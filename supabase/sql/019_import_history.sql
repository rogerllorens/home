create table if not exists public.import_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid null references public.jobs(id) on delete set null,
  source_type text not null,
  original_file_name text null,
  sheet_name text null,
  encoding text null,
  delimiter text null,
  platform_guess text null,
  mapping_confidence numeric null,
  status text not null default 'previewed',
  rows_total integer not null default 0,
  rows_valid integer not null default 0,
  rows_invalid integer not null default 0,
  columns_total integer not null default 0,
  mapping jsonb not null default '{}'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  errors jsonb not null default '[]'::jsonb,
  normalized_storage_path text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint import_runs_status_check check (status in ('previewed','normalized','job_created','failed','cancelled')),
  constraint import_runs_source_type_check check (source_type in ('csv','tsv','xlsx','xls','pasted_table','xml'))
);

create index if not exists import_runs_user_created_idx on public.import_runs(user_id, created_at desc);
create index if not exists import_runs_job_idx on public.import_runs(job_id) where job_id is not null;

alter table public.import_runs enable row level security;

drop policy if exists "Users can read own import runs" on public.import_runs;
create policy "Users can read own import runs" on public.import_runs for select using (auth.uid() = user_id);

drop policy if exists "Admins can read import runs" on public.import_runs;
create policy "Admins can read import runs" on public.import_runs for select using (public.is_admin());
