import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { siteUrl } from "@/lib/plans";
import { getCustomerId } from "@/lib/customers";

// Opens the Stripe-hosted billing portal (change plan, update card, cancel).
export async function POST() {
  const base = siteUrl();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${base}/login?next=/account`, 303);

  const customer = await getCustomerId(user.id);
  if (!customer) return NextResponse.redirect(`${base}/pricing`, 303);

  try {
    const portal = await stripe().billingPortal.sessions.create({
      customer,
      return_url: `${base}/account`,
    });
    return NextResponse.redirect(portal.url, 303);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not open billing portal";
    console.error("[portal]", message);
    return NextResponse.redirect(`${base}/account?error=${encodeURIComponent(message)}`, 303);
  }
}
