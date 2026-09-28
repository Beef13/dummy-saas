import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

export async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-line">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="font-semibold tracking-tight">
          Launchpad<span className="text-accent">.</span>
        </Link>
        <div className="flex items-center gap-5 text-sm">
          <Link href="/pricing" className="text-muted hover:text-fg">
            Pricing
          </Link>
          {user ? (
            <>
              <Link href="/account" className="text-muted hover:text-fg">
                Account
              </Link>
              <form action={signOut}>
                <button className="text-muted hover:text-fg">Sign out</button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-fg px-3 py-1.5 font-medium text-bg hover:opacity-90"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
