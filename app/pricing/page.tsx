import { PLANS } from "@/lib/plans";

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string; error?: string }>;
}) {
  const { canceled, error } = await searchParams;

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Pricing</h1>
        <p className="text-muted">Monthly plans. Cancel any time from your account page.</p>
      </div>

      {canceled && (
        <p className="rounded-md border border-line bg-card px-4 py-3 text-sm">
          Checkout canceled — no charge was made.
        </p>
      )}
      {error && (
        <p className="rounded-md border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm">
          {error}
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`flex flex-col rounded-xl border bg-card p-6 ${
              plan.highlight ? "border-accent" : "border-line"
            }`}
          >
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold">{plan.name}</h2>
              {plan.highlight && (
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                  Popular
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted">{plan.blurb}</p>
            <p className="mt-6 text-4xl font-semibold">
              {plan.price}
              <span className="text-base font-normal text-muted">/mo</span>
            </p>
            <ul className="mt-6 flex-1 space-y-2 text-sm">
              {plan.features.map((f) => (
                <li key={f}>✓ {f}</li>
              ))}
            </ul>
            <form action="/api/checkout" method="POST" className="mt-8">
              <input type="hidden" name="plan" value={plan.id} />
              <button
                className={`w-full rounded-md px-4 py-2 font-medium ${
                  plan.highlight
                    ? "bg-accent text-white hover:opacity-90"
                    : "border border-line hover:bg-bg"
                }`}
              >
                Subscribe to {plan.name}
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
