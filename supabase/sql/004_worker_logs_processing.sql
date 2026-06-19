-- Rankelia.ai Prompt 7 · worker logs, processing metadata and completed-with-warnings status.
-- Run after 003_projects_jobs_storage.sql.

alter table public.jobs drop constraint if exists jobs_status_check;
alter table public.jobs add constraint jobs_status_check check (status in ('draft','analyzed','queued','ready_for_processing','retrying','processing','completed','completed_with_warnings','failed_validation','failed','cancelled'));

alter table public.jobs add column if not exists processing_attempts integer not null default 0;
alter table public.jobs add column if not exists last_worker_error text;
alter table public.jobs add column if not exists last_heartbeat_at timestamptz;
alter table public.jobs add column if not exists quality_level text not null default 'standard';
alter table public.jobs add column if not exists product_equivalent_used integer not null default 0;

alter table public.downloads add column if not exists quality_level text;
alter table public.downloads add column if not exists product_equivalent_used integer not null default 0;

create table if not exists public.job_logs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  level text not null default 'info' check (level in ('info','warning','error','critical')),
  source text not null default 'worker',
  message text not null,
  context jsonb,
  created_at timestamptz not null default now()
);

create index if not exists job_logs_job_id_idx on public.job_logs(job_id);
create index if not exists job_logs_user_id_idx on public.job_logs(user_id);
create index if not exists job_logs_level_idx on public.job_logs(level);
create index if not exists job_logs_created_at_idx on public.job_logs(created_at desc);

alter table public.job_logs enable row level security;

drop policy if exists "job_logs_select_own_or_admin" on public.job_logs;
drop policy if exists "job_logs_admin_manage" on public.job_logs;

create policy "job_logs_select_own_or_admin" on public.job_logs for select to authenticated using (auth.uid() = user_id or public.is_admin());
create policy "job_logs_admin_manage" on public.job_logs for all to authenticated using (public.is_admin()) with check (public.is_admin());
