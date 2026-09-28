import Stripe from "stripe";

let client: Stripe | null = null;

/** Lazily created so `next build` works even before env vars are set. */
export function stripe() {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    client = new Stripe(key, { appInfo: { name: "dummy-saas" } });
  }
  return client;
}
