-- Rankelia.ai Prompt 5 · Supabase Auth, profiles, demo wallets and base RLS.
-- Run this file in the Supabase SQL editor after creating the project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  avatar_url text,
  company_name text,
  default_platform text not null default 'generic',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 10000 check (balance >= 0),
  lifetime_used integer not null default 0 check (lifetime_used >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  type text not null,
  description text,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_credit_wallets_updated_at on public.credit_wallets;
create trigger set_credit_wallets_updated_at
before update on public.credit_wallets
for each row execute function public.set_updated_at();

create or replace function public.is_admin(user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = user_id and role = 'admin'
  );
$$;

create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin(auth.uid()) then
    raise exception 'Customers cannot change profile role';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_profile_role_escalation on public.profiles;
create trigger prevent_profile_role_escalation
before update on public.profiles
for each row execute function public.prevent_profile_role_escalation();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  full_name_value text;
begin
  full_name_value := coalesce(new.raw_user_meta_data ->> 'full_name', '');

  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, full_name_value, 'customer')
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
        updated_at = now();

  insert into public.credit_wallets (user_id, balance, lifetime_used)
  values (new.id, 10000, 0)
  on conflict (user_id) do nothing;

  insert into public.credit_transactions (user_id, amount, type, description)
  values (new.id, 10000, 'welcome_grant', 'Créditos demo de bienvenida');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_rankelia on auth.users;
create trigger on_auth_user_created_rankelia
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.credit_wallets enable row level security;
alter table public.credit_transactions enable row level security;

-- profiles: users can read/update their own editable fields; admins can read/update all.
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles for select
to authenticated
using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "profiles_admin_update_all" on public.profiles;
create policy "profiles_admin_update_all"
on public.profiles for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- wallets: customers can only read their own balance. Direct customer writes are intentionally not allowed.
drop policy if exists "wallets_select_own_or_admin" on public.credit_wallets;
create policy "wallets_select_own_or_admin"
on public.credit_wallets for select
to authenticated
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "wallets_admin_manage" on public.credit_wallets;
create policy "wallets_admin_manage"
on public.credit_wallets for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- transactions: customers can read their own transaction history. Inserts/updates are admin/server-only for now.
drop policy if exists "transactions_select_own_or_admin" on public.credit_transactions;
create policy "transactions_select_own_or_admin"
on public.credit_transactions for select
to authenticated
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "transactions_admin_manage" on public.credit_transactions;
create policy "transactions_admin_manage"
on public.credit_transactions for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Manual bootstrap for the first internal admin after registering:
-- update public.profiles set role = 'admin' where email = 'TU_EMAIL';
