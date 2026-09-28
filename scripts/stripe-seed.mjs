// Creates the demo products, prices and billing-portal config in your Stripe TEST account.
// Usage: put STRIPE_SECRET_KEY in .env.local, then `npm run stripe:seed`.
// Safe to re-run: prices are found by lookup_key instead of being duplicated.
import Stripe from "stripe";

try {
  process.loadEnvFile(".env.local");
} catch {
  // fine — maybe the key is already in the environment
}

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("Set STRIPE_SECRET_KEY in .env.local first.");
  process.exit(1);
}
if (!key.startsWith("sk_test_")) {
  console.error("Refusing to seed a live Stripe account. Use an sk_test_ key.");
  process.exit(1);
}

const stripe = new Stripe(key);

const plans = [
  { env: "STRIPE_PRICE_STARTER", lookup: "launchpad_starter_monthly", name: "Launchpad Starter", amount: 900 },
  { env: "STRIPE_PRICE_PRO", lookup: "launchpad_pro_monthly", name: "Launchpad Pro", amount: 2900 },
];

const out = [];
const portalProducts = [];

for (const plan of plans) {
  const existing = await stripe.prices.list({ lookup_keys: [plan.lookup], limit: 1 });
  let price = existing.data[0];
  if (!price) {
    const product = await stripe.products.create({ name: plan.name });
    price = await stripe.prices.create({
      product: product.id,
      currency: "usd",
      unit_amount: plan.amount,
      recurring: { interval: "month" },
      lookup_key: plan.lookup,
    });
    console.log(`Created ${plan.name} → ${price.id}`);
  } else {
    console.log(`Found ${plan.name} → ${price.id}`);
  }
  out.push(`${plan.env}=${price.id}`);
  const productId = typeof price.product === "string" ? price.product : price.product.id;
  portalProducts.push({ product: productId, prices: [price.id] });
}

// The customer portal needs a configuration before it can open in test mode.
const configs = await stripe.billingPortal.configurations.list({ is_default: true, limit: 1 });
if (!configs.data.length) {
  await stripe.billingPortal.configurations.create({
    business_profile: { headline: "Launchpad (demo) — manage your subscription" },
    features: {
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: { enabled: true, mode: "at_period_end" },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ["price"],
        proration_behavior: "create_prorations",
        products: portalProducts,
      },
    },
  });
  console.log("Created billing portal configuration");
}

console.log("\nAdd these to .env.local and to Vercel:\n");
console.log(out.join("\n"));
