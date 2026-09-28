import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Launchpad — dummy SaaS",
  description: "A demo SaaS built with Next.js, Supabase and Stripe, deployed on Vercel.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Nav />
        <main className="mx-auto max-w-5xl px-4 py-12">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 pb-10 text-xs text-muted">
          Demo site · Stripe is in test mode — use card 4242 4242 4242 4242.
        </footer>
      </body>
    </html>
  );
}
