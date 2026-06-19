-- Atomic daily preview limits for AI preview endpoint.
-- Run after 009_preview_limits_and_exports.sql.

create table if not exists public.preview_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  used_count integer not null default 0 check (used_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

alter table public.preview_usage enable row level security;

drop policy if exists "Users can read own preview usage" on public.preview_usage;
create policy "Users can read own preview usage" on public.preview_usage for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Service role manages preview usage" on public.preview_usage;
create policy "Service role manages preview usage" on public.preview_usage for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create or replace function public.increment_preview_usage(p_user_id uuid, p_usage_date date, p_limit integer)
returns table(allowed boolean, used_count integer, max_allowed integer)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' and auth.uid() is distinct from p_user_id then
    raise exception 'Not allowed to increment preview usage for another user';
  end if;

  insert into public.preview_usage(user_id, usage_date, used_count, updated_at)
  values (p_user_id, p_usage_date, 0, now())
  on conflict (user_id, usage_date) do nothing;

  update public.preview_usage
  set used_count = used_count + 1, updated_at = now()
  where user_id = p_user_id and usage_date = p_usage_date and used_count < p_limit
  returning true, preview_usage.used_count, p_limit into allowed, used_count, max_allowed;

  if allowed is null then
    select false, pu.used_count, p_limit into allowed, used_count, max_allowed
    from public.preview_usage pu where pu.user_id = p_user_id and pu.usage_date = p_usage_date;
  end if;
  return next;
end;
$$;
