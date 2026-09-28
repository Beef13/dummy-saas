import Link from "next/link";

const stack = [
  { name: "Vercel", role: "Hosting, preview deploys, serverless API routes" },
  { name: "Supabase", role: "Postgres database and email auth with Row Level Security" },
  { name: "Stripe", role: "Subscription checkout, billing portal and webhooks" },
];

export default function Home() {
  return (
    <div className="space-y-16">
      <section className="space-y-6 pt-8">
        <p className="text-sm font-medium text-accent">Dummy SaaS starter</p>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Validate your idea with real sign-ups and real payments.
        </h1>
        <p className="max-w-xl text-lg text-muted">
          Launchpad is a placeholder product. Swap the copy, keep the plumbing: accounts,
          subscriptions and a database are already wired up.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/pricing"
            className="rounded-md bg-accent px-4 py-2 font-medium text-white hover:opacity-90"
          >
            See pricing
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-line px-4 py-2 font-medium hover:bg-card"
          >
            Create account
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {stack.map((s) => (
          <div key={s.name} className="rounded-lg border border-line bg-card p-5">
            <h3 className="font-semibold">{s.name}</h3>
            <p className="mt-1 text-sm text-muted">{s.role}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
