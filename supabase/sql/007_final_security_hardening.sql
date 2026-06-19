-- Prompt final: close beta security gaps without changing product behavior.
-- Run after 006_billing_stripe_wallet.sql.

-- Customers may update editable profile fields, but must never self-promote role.
create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin(auth.uid()) then
    raise exception 'role_updates_admin_only';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_profile_role_escalation_trigger on public.profiles;
create trigger prevent_profile_role_escalation_trigger
before update of role on public.profiles
for each row execute function public.prevent_profile_role_escalation();

-- Keep wallet writes server/admin-only: users read their wallet, service_role/RPC mutates it.
revoke insert, update, delete on public.credit_wallets from authenticated;
revoke insert, update, delete on public.credit_transactions from authenticated;
revoke insert, update, delete on public.credit_reservations from authenticated;
revoke insert, update, delete on public.payment_events from authenticated;

-- Extra defense: downloads must remain read-only for customers; worker/service role creates rows.
revoke insert, update, delete on public.downloads from authenticated;
