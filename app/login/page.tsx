import { signIn, signUp } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const { error, message, next } = await searchParams;

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in or create an account</h1>
        <p className="text-sm text-muted">Email and password, handled by Supabase Auth.</p>
      </div>

      {error && (
        <p className="rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm">{error}</p>
      )}
      {message && (
        <p className="rounded-md border border-line bg-card px-3 py-2 text-sm">{message}</p>
      )}

      <form className="space-y-4">
        <input type="hidden" name="next" value={next ?? "/account"} />
        <label className="block space-y-1">
          <span className="text-sm font-medium">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-md border border-line bg-card px-3 py-2 outline-none focus:border-accent"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Password</span>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="current-password"
            className="w-full rounded-md border border-line bg-card px-3 py-2 outline-none focus:border-accent"
          />
        </label>
        <div className="flex gap-3">
          <button
            formAction={signIn}
            className="flex-1 rounded-md bg-fg px-4 py-2 font-medium text-bg hover:opacity-90"
          >
            Sign in
          </button>
          <button
            formAction={signUp}
            className="flex-1 rounded-md border border-line px-4 py-2 font-medium hover:bg-card"
          >
            Sign up
          </button>
        </div>
      </form>
    </div>
  );
}
