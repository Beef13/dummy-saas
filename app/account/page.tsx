import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { planForPriceId } from "@/lib/plans";

type SubscriptionRow = {
  id: string;
  status: string;
  price_id: string | null;
  cancel_at_period_end: boolean;
  current_period_end: string | null;
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { success, error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  // RLS means this only ever returns the signed-in user's rows.
  const { data } = await supabase
    .from("subscriptions")
    .select("id, status, price_id, cancel_at_period_end, current_period_end")
    .order("created_at", { ascending: false })
    .limit(1);
  const sub = (data?.[0] as SubscriptionRow | undefined) ?? null;
  const active = sub && ["active", "trialing", "past_due"].includes(sub.status);
  const plan = planForPriceId(sub?.price_id);

  return (
    <div className="max-w-xl space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Your account</h1>
        <p className="text-muted">{user.email}</p>
      </div>

      {success && (
        <p className="rounded-md border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm">
          Payment received. If your plan doesn&apos;t show yet, the webhook is still on its way —
          refresh in a few seconds.
        </p>
      )}
      {error && (
        <p className="rounded-md border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm">{error}</p>
      )}

      <section className="rounded-xl border border-line bg-card p-6">
        <h2 className="text-sm font-medium text-muted">Subscription</h2>
        {active ? (
          <div className="mt-2 space-y-4">
            <p className="text-2xl font-semibold">
              {plan?.name ?? "Unknown plan"}{" "}
              <span className="align-middle text-sm font-normal text-muted">({sub.status})</span>
            </p>
            {sub.current_period_end && (
              <p className="text-sm text-muted">
                {sub.cancel_at_period_end ? "Ends" : "Renews"} on{" "}
                {new Date(sub.current_period_end).toLocaleDateString()}
              </p>
            )}
            <form action="/api/portal" method="POST">
              <button className="rounded-md border border-line px-4 py-2 text-sm font-medium hover:bg-bg">
                Manage billing
              </button>
            </form>
          </div>
        ) : (
          <div className="mt-2 space-y-4">
            <p className="text-2xl font-semibold">Free</p>
            <Link
              href="/pricing"
              className="inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Upgrade
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
