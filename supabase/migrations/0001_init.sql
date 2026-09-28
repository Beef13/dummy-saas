-- Run this in Supabase → SQL Editor (or `supabase db push` if you use the CLI).

-- Maps a Supabase user to their Stripe customer.
create table if not exists public.customers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text unique not null,
  created_at timestamptz not null default now()
);

-- Mirror of Stripe subscriptions, kept in sync by the webhook.
create table if not exists public.subscriptions (
  id text primary key,                         -- Stripe subscription id (sub_...)
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null,                        -- active, trialing, past_due, canceled, ...
  price_id text,
  cancel_at_period_end boolean not null default false,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);

-- Row Level Security: signed-in users can read only their own rows.
-- There are no insert/update policies, so only the service-role key (the webhook) can write.
alter table public.customers enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "Users read own customer row" on public.customers;
create policy "Users read own customer row"
  on public.customers for select
  using (auth.uid() = user_id);

drop policy if exists "Users read own subscriptions" on public.subscriptions;
create policy "Users read own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);
