# Launchpad — dummy SaaS (Next.js · Supabase · Stripe · Vercel)

A minimal, working subscription site you can clone to validate an idea: sign up, pick a plan, pay with Stripe, and see your plan on your account page.

- **Next.js 16** (App Router, server actions, `proxy.ts`) — deployed on **Vercel**
- **Supabase** — email/password auth + Postgres with Row Level Security
- **Stripe** — Checkout (subscriptions), Customer Portal, webhooks → Supabase

## How it fits together

```
Browser ──► /pricing ──POST──► /api/checkout ──► Stripe Checkout (hosted)
                                                     │ pays
                                                     ▼
Supabase ◄── upsert subscription ◄── /api/webhooks/stripe ◄── Stripe event
   │
   └─► /account reads the user's subscription (RLS: own rows only)
```

| Path | What it does |
|---|---|
| `app/page.tsx` | Landing page |
| `app/pricing/page.tsx` | Two plans (Starter $9, Pro $29) |
| `app/login/*` | Sign in / sign up with Supabase Auth |
| `app/account/page.tsx` | Protected — shows current plan, "Manage billing" |
| `app/api/checkout` | Creates Stripe customer (once) + Checkout Session |
| `app/api/portal` | Opens the Stripe Customer Portal |
| `app/api/webhooks/stripe` | Verifies signature, syncs subscriptions to Supabase |
| `proxy.ts` | Refreshes auth cookies, guards `/account` |
| `supabase/migrations/0001_init.sql` | `customers` + `subscriptions` tables with RLS |
| `scripts/stripe-seed.mjs` | Creates test products/prices + portal config |

## Setup (~15 minutes)

### 1. Install
```bash
npm install
cp .env.example .env.local
```

### 2. Supabase
1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor** → paste and run `supabase/migrations/0001_init.sql`.
3. **Project Settings → API** → copy the URL, `anon` key and `service_role` key into `.env.local`.
4. **Authentication → URL Configuration** → set Site URL to `http://localhost:3000` and add `http://localhost:3000/auth/callback` (and later your Vercel URL + `/auth/callback`) to Redirect URLs.
   - For a quick demo you can turn off **Confirm email** under Authentication → Providers → Email so sign-up logs you straight in.

### 3. Stripe (test mode)
1. In the [Stripe dashboard](https://dashboard.stripe.com/test/apikeys), make sure **Test mode** is on and copy the secret key (`sk_test_...`) into `.env.local`.
2. Create the products, prices and portal config:
   ```bash
   npm run stripe:seed
   ```
   Paste the printed `STRIPE_PRICE_STARTER` / `STRIPE_PRICE_PRO` lines into `.env.local`.
3. Forward webhooks locally with the [Stripe CLI](https://docs.stripe.com/stripe-cli):
   ```bash
   stripe login
   npm run stripe:listen
   ```
   Copy the `whsec_...` it prints into `STRIPE_WEBHOOK_SECRET`.

### 4. Run it
```bash
npm run dev
```
Open http://localhost:3000 → Sign up → Pricing → Subscribe. Pay with card **4242 4242 4242 4242**, any future expiry, any CVC. You land on `/account` showing your plan.

## Deploy to Vercel

1. Push this repo to GitHub:
   ```bash
   git remote add origin https://github.com/<you>/dummy-saas.git
   git push -u origin main
   ```
2. In [Vercel](https://vercel.com/new), **Import** the repo (framework is auto-detected).
3. Add every variable from `.env.example` under **Settings → Environment Variables**, with `NEXT_PUBLIC_SITE_URL=https://<your-app>.vercel.app`.
4. In Stripe → **Developers → Webhooks → Add endpoint**:
   - URL: `https://<your-app>.vercel.app/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy that endpoint's signing secret into Vercel's `STRIPE_WEBHOOK_SECRET` (it's different from the CLI one) and redeploy.
5. In Supabase **URL Configuration**, add the Vercel URL as Site URL and `https://<your-app>.vercel.app/auth/callback` as a Redirect URL.

## Making it yours
- Copy/branding: `app/page.tsx`, `components/Nav.tsx`, colours in `app/globals.css`.
- Plans: edit `lib/plans.ts` (display) and the seed script (actual Stripe prices).
- Gate a feature: query `subscriptions` for `status in ('active','trialing')` like `app/account/page.tsx` does.
- Going live: switch to live Stripe keys, re-run the price setup in live mode (the seed script only runs on test keys), and create a live webhook endpoint.

## Security notes
- `SUPABASE_SERVICE_ROLE_KEY` and `STRIPE_SECRET_KEY` are server-only — never prefix them with `NEXT_PUBLIC_`.
- Users can read only their own rows; only the webhook (service role) writes subscription data, so nobody can grant themselves a plan from the browser.
- The webhook verifies Stripe's signature on the raw body before trusting any event.
