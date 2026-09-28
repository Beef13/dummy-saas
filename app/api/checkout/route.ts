import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { priceIdFor, siteUrl } from "@/lib/plans";
import { getOrCreateCustomer } from "@/lib/customers";

export async function POST(request: NextRequest) {
  const base = siteUrl();
  const form = await request.formData();
  const plan = String(form.get("plan") ?? "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(
      `${base}/login?next=/pricing&message=${encodeURIComponent("Sign in to subscribe.")}`,
      303
    );
  }

  const priceId = priceIdFor(plan);
  if (!priceId) {
    return NextResponse.redirect(
      `${base}/pricing?error=${encodeURIComponent("That plan isn't configured yet — set the STRIPE_PRICE_* env vars.")}`,
      303
    );
  }

  try {
    const customer = await getOrCreateCustomer(user.id, user.email);
    const session = await stripe().checkout.sessions.create({
      mode: "subscription",
      customer,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { metadata: { user_id: user.id } },
      allow_promotion_codes: true,
      success_url: `${base}/account?success=1`,
      cancel_url: `${base}/pricing?canceled=1`,
    });
    return NextResponse.redirect(session.url!, 303);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    console.error("[checkout]", message);
    return NextResponse.redirect(`${base}/pricing?error=${encodeURIComponent(message)}`, 303);
  }
}
