export type Plan = {
  id: "starter" | "pro";
  name: string;
  price: string;
  blurb: string;
  features: string[];
  priceEnv: "STRIPE_PRICE_STARTER" | "STRIPE_PRICE_PRO";
  highlight?: boolean;
};

// Display data only. The real amount charged comes from the Stripe Price ID in the env var.
export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: "$9",
    blurb: "For side projects testing the waters.",
    features: ["1 project", "Basic analytics", "Email support"],
    priceEnv: "STRIPE_PRICE_STARTER",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    blurb: "For founders with paying customers.",
    features: ["Unlimited projects", "Advanced analytics", "Priority support", "Team seats"],
    priceEnv: "STRIPE_PRICE_PRO",
    highlight: true,
  },
];

export function priceIdFor(planId: string): string | null {
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) return null;
  return process.env[plan.priceEnv] ?? null;
}

export function planForPriceId(priceId: string | null | undefined): Plan | undefined {
  if (!priceId) return undefined;
  return PLANS.find((p) => process.env[p.priceEnv] === priceId);
}

export function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  ).replace(/\/$/, "");
}
