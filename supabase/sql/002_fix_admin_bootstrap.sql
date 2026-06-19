-- Rankelia.ai Prompt 6 · fix first-admin bootstrap from Supabase SQL Editor.
-- Allows internal SQL operations where auth.uid() is null, while still blocking customer role escalation.

create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
    and auth.uid() is not null
    and not public.is_admin(auth.uid()) then
    raise exception 'Customers cannot change profile role';
  end if;
  return new;
end;
$$;

-- First admin bootstrap after registering a user:
-- update public.profiles set role = 'admin' where email = 'TU_EMAIL';
