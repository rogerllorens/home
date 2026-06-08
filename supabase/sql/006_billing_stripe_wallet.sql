-- Prompt 9: Stripe Billing, checkout tracking, real wallet reservations and secure credit RPCs.
-- Run after 005_ai_generation_fields.sql.

create table if not exists public.billing_customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  plan_id text not null default 'free',
  status text not null default 'free',
  price_id text,
  product_allowance integer default 0,
  internal_credit_allowance integer default 0,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  canceled_at timestamptz,
  trial_end timestamptz,
  latest_invoice_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  stripe_session_id text unique not null,
  mode text not null,
  item_type text not null,
  plan_id text,
  extra_pack_id text,
  products integer default 0,
  credits integer default 0,
  amount_total integer,
  currency text default 'eur',
  status text default 'created',
  created_at timestamptz default now(),
  completed_at timestamptz
);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text unique not null,
  event_type text not null,
  processed boolean default false,
  payload jsonb,
  error_message text,
  created_at timestamptz default now(),
  processed_at timestamptz
);

create table if not exists public.credit_reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  job_id uuid references public.jobs(id) on delete cascade not null,
  amount integer not null check (amount > 0),
  product_equivalent numeric,
  status text default 'reserved',
  reason text,
  created_at timestamptz default now(),
  released_at timestamptz,
  consumed_at timestamptz
);

alter table public.credit_wallets add column if not exists reserved_balance integer default 0;
alter table public.credit_wallets add column if not exists lifetime_purchased integer default 0;
alter table public.credit_wallets add column if not exists lifetime_granted integer default 0;
alter table public.credit_wallets add column if not exists lifetime_refunded integer default 0;

alter table public.credit_transactions add column if not exists job_id uuid references public.jobs(id) on delete set null;
alter table public.credit_transactions add column if not exists reservation_id uuid references public.credit_reservations(id) on delete set null;
alter table public.credit_transactions add column if not exists stripe_session_id text;
alter table public.credit_transactions add column if not exists stripe_event_id text;
alter table public.credit_transactions add column if not exists stripe_invoice_id text;
alter table public.credit_transactions add column if not exists product_equivalent numeric;
alter table public.credit_transactions add column if not exists balance_after integer;
alter table public.credit_transactions add column if not exists status text default 'completed';
alter table public.credit_transactions add column if not exists metadata jsonb;

alter table public.billing_customers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.checkout_sessions enable row level security;
alter table public.payment_events enable row level security;
alter table public.credit_reservations enable row level security;

create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists checkout_sessions_user_id_idx on public.checkout_sessions(user_id);
create index if not exists credit_reservations_user_id_idx on public.credit_reservations(user_id);
create unique index if not exists credit_reservations_one_active_per_job_idx on public.credit_reservations(job_id) where status = 'reserved';
create index if not exists credit_transactions_stripe_session_idx on public.credit_transactions(stripe_session_id);
create index if not exists credit_transactions_stripe_invoice_idx on public.credit_transactions(stripe_invoice_id);

-- RLS policies: customers can read their own billing data; admins can read global data. Writes happen server-side/webhook/worker.
drop policy if exists "Users read own billing customers" on public.billing_customers;
create policy "Users read own billing customers" on public.billing_customers for select using (user_id = auth.uid() or public.is_admin(auth.uid()));
drop policy if exists "Users read own subscriptions" on public.subscriptions;
create policy "Users read own subscriptions" on public.subscriptions for select using (user_id = auth.uid() or public.is_admin(auth.uid()));
drop policy if exists "Users read own checkout sessions" on public.checkout_sessions;
create policy "Users read own checkout sessions" on public.checkout_sessions for select using (user_id = auth.uid() or public.is_admin(auth.uid()));
drop policy if exists "Admins read payment events" on public.payment_events;
create policy "Admins read payment events" on public.payment_events for select using (public.is_admin(auth.uid()));
drop policy if exists "Users read own reservations" on public.credit_reservations;
create policy "Users read own reservations" on public.credit_reservations for select using (user_id = auth.uid() or public.is_admin(auth.uid()));

create or replace function public.ensure_wallet(p_user_id uuid)
returns public.credit_wallets
language plpgsql
security definer
set search_path = public
as $$
declare v_wallet public.credit_wallets;
begin
  insert into public.credit_wallets(user_id, balance, reserved_balance, lifetime_used, lifetime_purchased, lifetime_granted, lifetime_refunded)
  values (p_user_id, 0, 0, 0, 0, 0, 0)
  on conflict (user_id) do nothing;
  select * into v_wallet from public.credit_wallets where user_id = p_user_id;
  return v_wallet;
end;
$$;

create or replace function public.add_credits(p_user_id uuid, p_amount integer, p_type text, p_description text, p_metadata jsonb default '{}'::jsonb)
returns public.credit_wallets
language plpgsql
security definer
set search_path = public
as $$
declare v_wallet public.credit_wallets;
begin
  if p_amount <= 0 then raise exception 'amount must be positive'; end if;
  perform public.ensure_wallet(p_user_id);
  update public.credit_wallets
  set balance = balance + p_amount,
      lifetime_purchased = lifetime_purchased + case when p_type = 'purchase' then p_amount else 0 end,
      lifetime_granted = lifetime_granted + case when p_type in ('subscription_grant','welcome_grant','promo_code','admin_adjustment') then p_amount else 0 end,
      updated_at = now()
  where user_id = p_user_id
  returning * into v_wallet;
  insert into public.credit_transactions(user_id, amount, product_equivalent, type, status, description, metadata, stripe_session_id, stripe_event_id, stripe_invoice_id, balance_after)
  values (p_user_id, p_amount, p_amount / 500.0, p_type, 'completed', p_description, p_metadata, p_metadata->>'stripe_session_id', p_metadata->>'stripe_event_id', p_metadata->>'stripe_invoice_id', v_wallet.balance);
  return v_wallet;
end;
$$;

create or replace function public.reserve_credits(p_user_id uuid, p_job_id uuid, p_amount integer)
returns public.credit_reservations
language plpgsql
security definer
set search_path = public
as $$
declare v_wallet public.credit_wallets; v_reservation public.credit_reservations;
begin
  if p_amount <= 0 then raise exception 'amount must be positive'; end if;
  perform public.ensure_wallet(p_user_id);
  select * into v_wallet from public.credit_wallets where user_id = p_user_id for update;
  if v_wallet.balance < p_amount then raise exception 'insufficient_credits'; end if;
  update public.credit_wallets set balance = balance - p_amount, reserved_balance = reserved_balance + p_amount, updated_at = now() where user_id = p_user_id returning * into v_wallet;
  insert into public.credit_reservations(user_id, job_id, amount, product_equivalent, status, reason)
  values (p_user_id, p_job_id, p_amount, p_amount / 500.0, 'reserved', 'job_processing') returning * into v_reservation;
  insert into public.credit_transactions(user_id, job_id, reservation_id, amount, product_equivalent, type, status, description, balance_after)
  values (p_user_id, p_job_id, v_reservation.id, -p_amount, p_amount / 500.0, 'reservation', 'completed', 'Créditos reservados para job', v_wallet.balance);
  return v_reservation;
end;
$$;

create or replace function public.consume_reserved_credits(p_reservation_id uuid, p_actual_amount integer)
returns public.credit_wallets
language plpgsql
security definer
set search_path = public
as $$
declare v_res public.credit_reservations; v_wallet public.credit_wallets; v_release integer;
begin
  select * into v_res from public.credit_reservations where id = p_reservation_id and status = 'reserved' for update;
  if not found then raise exception 'reservation_not_found_or_not_reserved'; end if;
  if p_actual_amount < 0 or p_actual_amount > v_res.amount then raise exception 'invalid_actual_amount'; end if;
  v_release := v_res.amount - p_actual_amount;
  update public.credit_reservations set status = 'consumed', consumed_at = now() where id = p_reservation_id;
  update public.credit_wallets set reserved_balance = greatest(reserved_balance - v_res.amount, 0), balance = balance + v_release, lifetime_used = lifetime_used + p_actual_amount, updated_at = now() where user_id = v_res.user_id returning * into v_wallet;
  insert into public.credit_transactions(user_id, job_id, reservation_id, amount, product_equivalent, type, status, description, balance_after)
  values (v_res.user_id, v_res.job_id, v_res.id, -p_actual_amount, p_actual_amount / 500.0, 'usage', 'completed', 'Créditos consumidos por job completado', v_wallet.balance);
  if v_release > 0 then
    insert into public.credit_transactions(user_id, job_id, reservation_id, amount, product_equivalent, type, status, description, balance_after)
    values (v_res.user_id, v_res.job_id, v_res.id, v_release, v_release / 500.0, 'reservation_release', 'completed', 'Diferencia de reserva liberada', v_wallet.balance);
  end if;
  return v_wallet;
end;
$$;

create or replace function public.release_reserved_credits(p_reservation_id uuid, p_reason text)
returns public.credit_wallets
language plpgsql
security definer
set search_path = public
as $$
declare v_res public.credit_reservations; v_wallet public.credit_wallets;
begin
  select * into v_res from public.credit_reservations where id = p_reservation_id and status = 'reserved' for update;
  if not found then raise exception 'reservation_not_found_or_not_reserved'; end if;
  update public.credit_reservations set status = 'released', released_at = now(), reason = p_reason where id = p_reservation_id;
  update public.credit_wallets set reserved_balance = greatest(reserved_balance - v_res.amount, 0), balance = balance + v_res.amount, lifetime_refunded = lifetime_refunded + v_res.amount, updated_at = now() where user_id = v_res.user_id returning * into v_wallet;
  insert into public.credit_transactions(user_id, job_id, reservation_id, amount, product_equivalent, type, status, description, balance_after)
  values (v_res.user_id, v_res.job_id, v_res.id, v_res.amount, v_res.amount / 500.0, 'reservation_release', 'completed', coalesce(p_reason,'Reserva liberada'), v_wallet.balance);
  return v_wallet;
end;
$$;

revoke execute on function public.add_credits(uuid, integer, text, text, jsonb) from anon, authenticated;
revoke execute on function public.reserve_credits(uuid, uuid, integer) from anon, authenticated;
revoke execute on function public.consume_reserved_credits(uuid, integer) from anon, authenticated;
revoke execute on function public.release_reserved_credits(uuid, text) from anon, authenticated;
revoke execute on function public.ensure_wallet(uuid) from anon, authenticated;
grant execute on function public.add_credits(uuid, integer, text, text, jsonb) to service_role;
grant execute on function public.reserve_credits(uuid, uuid, integer) to service_role;
grant execute on function public.consume_reserved_credits(uuid, integer) to service_role;
grant execute on function public.release_reserved_credits(uuid, text) to service_role;
grant execute on function public.ensure_wallet(uuid) to service_role;

-- New signups should receive the Free plan welcome grant: 3 products = 1,500 internal credits.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles(id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), 'customer')
  on conflict (id) do nothing;
  insert into public.credit_wallets(user_id, balance, reserved_balance, lifetime_granted, lifetime_used, lifetime_purchased, lifetime_refunded)
  values (new.id, 1500, 0, 1500, 0, 0, 0)
  on conflict (user_id) do nothing;
  insert into public.credit_transactions(user_id, amount, product_equivalent, type, status, description, metadata, balance_after)
  values (new.id, 1500, 3, 'welcome_grant', 'completed', '3 productos estándar de bienvenida Free', jsonb_build_object('products', 3, 'credits_per_product', 500), 1500)
  on conflict do nothing;
  insert into public.subscriptions(user_id, plan_id, status, product_allowance, internal_credit_allowance)
  values (new.id, 'free', 'free', 3, 1500)
  on conflict do nothing;
  return new;
end;
$$;
