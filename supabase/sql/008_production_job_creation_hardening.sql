-- Final production hardening: server-side job creation, safe statuses and read-only customer job rows.
-- Run after 007_final_security_hardening.sql.

alter table public.jobs drop constraint if exists jobs_status_check;
alter table public.jobs add constraint jobs_status_check check (status in (
  'draft','analyzed','pending_reservation','queued','ready_for_processing','processing','retrying',
  'completed','completed_with_warnings','failed_validation','insufficient_credits','failed','cancelled'
));

-- Customers may read their jobs/rows, but productive inserts and state transitions happen through server routes or the worker service role.
drop policy if exists "jobs_insert_own" on public.jobs;
drop policy if exists "jobs_update_own_non_final_or_admin" on public.jobs;
drop policy if exists "jobs_admin_manage" on public.jobs;
create policy "jobs_admin_manage" on public.jobs for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
revoke insert, update, delete on public.jobs from authenticated;

drop policy if exists "job_rows_insert_own" on public.job_rows;
drop policy if exists "job_rows_update_own_or_admin" on public.job_rows;
drop policy if exists "job_rows_admin_manage" on public.job_rows;
create policy "job_rows_admin_manage" on public.job_rows for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
revoke insert, update, delete on public.job_rows from authenticated;

-- A job can only have one active reservation; historical consumed/released reservations remain auditable.
create unique index if not exists credit_reservations_one_reserved_per_job_idx on public.credit_reservations(job_id) where status = 'reserved';

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  status text not null default 'ok',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_events enable row level security;
create index if not exists audit_events_user_id_idx on public.audit_events(user_id);
create index if not exists audit_events_action_idx on public.audit_events(action);
create index if not exists audit_events_created_at_idx on public.audit_events(created_at desc);

drop policy if exists "audit_events_select_own_or_admin" on public.audit_events;
drop policy if exists "audit_events_admin_manage" on public.audit_events;
create policy "audit_events_select_own_or_admin" on public.audit_events for select to authenticated using (auth.uid() = user_id or public.is_admin(auth.uid()));
create policy "audit_events_admin_manage" on public.audit_events for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
revoke insert, update, delete on public.audit_events from authenticated;
