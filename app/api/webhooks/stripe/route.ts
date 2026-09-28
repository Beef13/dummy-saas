import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Stripe → your server. Keeps public.subscriptions in sync with Stripe.
// Local: `npm run stripe:listen`. Production: add https://<your-app>.vercel.app/api/webhooks/stripe
// as an endpoint in the Stripe dashboard with the events listed below.

const RELEVANT = new Set<string>([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

async function resolveUserId(sub: Stripe.Subscription): Promise<string | null> {
  if (sub.metadata?.user_id) return sub.metadata.user_id;
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const { data } = await createAdminClient()
    .from("customers")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return (data?.user_id as string | undefined) ?? null;
}

async function upsertSubscription(sub: Stripe.Subscription) {
  const userId = await resolveUserId(sub);
  if (!userId) {
    console.warn(`[webhook] no user for subscription ${sub.id}`);
    return;
  }
  const item = sub.items.data[0];
  // Since API version 2025-03-31, the billing period lives on the subscription item.
  const periodEnd = item?.current_period_end;

  const { error } = await createAdminClient()
    .from("subscriptions")
    .upsert({
      id: sub.id,
      user_id: userId,
      status: sub.status,
      price_id: item?.price.id ?? null,
      cancel_at_period_end: sub.cancel_at_period_end,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    });
  if (error) throw new Error(`Supabase upsert failed: ${error.message}`);
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    // Signature verification needs the exact raw body.
    event = stripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (!RELEVANT.has(event.type)) return NextResponse.json({ received: true });

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && session.subscription) {
        const subId =
          typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        await upsertSubscription(await stripe().subscriptions.retrieve(subId));
      }
    } else {
      await upsertSubscription(event.data.object as Stripe.Subscription);
    }
  } catch (err) {
    console.error("[webhook]", event.type, err);
    // 500 makes Stripe retry the event later.
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
