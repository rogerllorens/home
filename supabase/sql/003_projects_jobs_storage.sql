-- Rankelia.ai Prompt 6 · projects, uploads, jobs, rows, downloads and private Storage buckets.
-- Run after 001_auth_profiles.sql and 002_fix_admin_bootstrap.sql.

create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  website_url text,
  platform text not null default 'generic',
  language text not null default 'es',
  country text not null default 'ES',
  default_tone text not null default 'profesional',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.file_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  original_filename text not null,
  storage_bucket text not null,
  storage_path text not null,
  file_type text,
  file_size bigint,
  row_count integer not null default 0,
  detected_columns jsonb not null default '[]'::jsonb,
  status text not null default 'uploaded' check (status in ('uploaded','analyzed','invalid','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  file_upload_id uuid references public.file_uploads(id) on delete set null,
  job_type text not null default 'products_csv',
  platform text not null default 'generic',
  generation_type text not null default 'product_complete',
  language text not null default 'es',
  country text not null default 'ES',
  tone text not null default 'profesional',
  status text not null default 'draft' check (status in ('draft','analyzed','queued','ready_for_processing','processing','completed','failed_validation','failed','cancelled')),
  original_filename text,
  input_bucket text,
  input_file_path text,
  output_csv_path text,
  output_html_path text,
  output_report_path text,
  rows_total integer not null default 0,
  rows_valid integer not null default 0,
  rows_invalid integer not null default 0,
  rows_processed integer not null default 0,
  rows_failed integer not null default 0,
  categories_count integer not null default 0,
  detected_columns jsonb not null default '[]'::jsonb,
  column_mapping jsonb not null default '{}'::jsonb,
  analysis_summary jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  estimated_credits integer not null default 0,
  reserved_credits integer not null default 0,
  credits_used integer not null default 0,
  average_score integer,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);

create table if not exists public.job_rows (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  row_index integer not null,
  input_data jsonb not null,
  validation_status text not null default 'valid' check (validation_status in ('valid','warning','invalid')),
  detected_issues jsonb not null default '[]'::jsonb,
  priority text not null default 'low' check (priority in ('low','medium','high')),
  output_data jsonb,
  seo_score integer,
  conversion_score integer,
  status text not null default 'pending' check (status in ('pending','processing','completed','failed','skipped')),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(job_id, row_index)
);

create table if not exists public.downloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  job_id uuid references public.jobs(id) on delete cascade,
  file_type text not null check (file_type in ('csv_shopify','csv_prestashop','csv_woocommerce','csv_generic','html','report_txt','errors_csv')),
  filename text not null,
  storage_bucket text not null,
  storage_path text not null,
  rows_count integer not null default 0,
  average_score integer,
  file_size bigint,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists projects_platform_idx on public.projects(platform);
create index if not exists file_uploads_user_id_idx on public.file_uploads(user_id);
create index if not exists file_uploads_project_id_idx on public.file_uploads(project_id);
create index if not exists file_uploads_status_idx on public.file_uploads(status);
create index if not exists file_uploads_created_at_idx on public.file_uploads(created_at desc);
create index if not exists jobs_user_id_idx on public.jobs(user_id);
create index if not exists jobs_project_id_idx on public.jobs(project_id);
create index if not exists jobs_status_idx on public.jobs(status);
create index if not exists jobs_created_at_idx on public.jobs(created_at desc);
create index if not exists jobs_platform_idx on public.jobs(platform);
create index if not exists jobs_file_upload_id_idx on public.jobs(file_upload_id);
create index if not exists job_rows_user_id_idx on public.job_rows(user_id);
create index if not exists job_rows_job_id_idx on public.job_rows(job_id);
create index if not exists job_rows_status_idx on public.job_rows(status);
create index if not exists job_rows_validation_status_idx on public.job_rows(validation_status);
create index if not exists job_rows_priority_idx on public.job_rows(priority);
create index if not exists job_rows_row_index_idx on public.job_rows(row_index);
create index if not exists downloads_user_id_idx on public.downloads(user_id);
create index if not exists downloads_job_id_idx on public.downloads(job_id);
create index if not exists downloads_created_at_idx on public.downloads(created_at desc);
create index if not exists downloads_file_type_idx on public.downloads(file_type);

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at before update on public.projects for each row execute function public.set_updated_at();
drop trigger if exists set_file_uploads_updated_at on public.file_uploads;
create trigger set_file_uploads_updated_at before update on public.file_uploads for each row execute function public.set_updated_at();
drop trigger if exists set_jobs_updated_at on public.jobs;
create trigger set_jobs_updated_at before update on public.jobs for each row execute function public.set_updated_at();
drop trigger if exists set_job_rows_updated_at on public.job_rows;
create trigger set_job_rows_updated_at before update on public.job_rows for each row execute function public.set_updated_at();

alter table public.projects enable row level security;
alter table public.file_uploads enable row level security;
alter table public.jobs enable row level security;
alter table public.job_rows enable row level security;
alter table public.downloads enable row level security;

drop policy if exists "projects_select_own_or_admin" on public.projects;
drop policy if exists "projects_insert_own" on public.projects;
drop policy if exists "projects_update_own_or_admin" on public.projects;
drop policy if exists "file_uploads_select_own_or_admin" on public.file_uploads;
drop policy if exists "file_uploads_insert_own" on public.file_uploads;
drop policy if exists "file_uploads_update_own_or_admin" on public.file_uploads;
drop policy if exists "jobs_select_own_or_admin" on public.jobs;
drop policy if exists "jobs_insert_own" on public.jobs;
drop policy if exists "jobs_update_own_non_final_or_admin" on public.jobs;
drop policy if exists "job_rows_select_own_or_admin" on public.job_rows;
drop policy if exists "job_rows_insert_own" on public.job_rows;
drop policy if exists "job_rows_update_own_or_admin" on public.job_rows;
drop policy if exists "downloads_select_own_or_admin" on public.downloads;
drop policy if exists "downloads_admin_manage" on public.downloads;

create policy "projects_select_own_or_admin" on public.projects for select to authenticated using (auth.uid() = user_id or public.is_admin());
create policy "projects_insert_own" on public.projects for insert to authenticated with check (auth.uid() = user_id);
create policy "projects_update_own_or_admin" on public.projects for update to authenticated using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());

create policy "file_uploads_select_own_or_admin" on public.file_uploads for select to authenticated using (auth.uid() = user_id or public.is_admin());
create policy "file_uploads_insert_own" on public.file_uploads for insert to authenticated with check (auth.uid() = user_id);
create policy "file_uploads_update_own_or_admin" on public.file_uploads for update to authenticated using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());

create policy "jobs_select_own_or_admin" on public.jobs for select to authenticated using (auth.uid() = user_id or public.is_admin());
create policy "jobs_insert_own" on public.jobs for insert to authenticated with check (auth.uid() = user_id);
create policy "jobs_update_own_non_final_or_admin" on public.jobs for update to authenticated using ((auth.uid() = user_id and status not in ('processing','completed','failed','cancelled')) or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());

create policy "job_rows_select_own_or_admin" on public.job_rows for select to authenticated using (auth.uid() = user_id or public.is_admin());
create policy "job_rows_insert_own" on public.job_rows for insert to authenticated with check (auth.uid() = user_id);
create policy "job_rows_update_own_or_admin" on public.job_rows for update to authenticated using (auth.uid() = user_id or public.is_admin()) with check (auth.uid() = user_id or public.is_admin());

create policy "downloads_select_own_or_admin" on public.downloads for select to authenticated using (auth.uid() = user_id or public.is_admin());
create policy "downloads_admin_manage" on public.downloads for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('rankelia-inputs', 'rankelia-inputs', false), ('rankelia-outputs', 'rankelia-outputs', false), ('rankelia-reports', 'rankelia-reports', false)
on conflict (id) do update set public = false;

drop policy if exists "storage_inputs_select_own_or_admin" on storage.objects;
drop policy if exists "storage_inputs_insert_own" on storage.objects;
drop policy if exists "storage_inputs_update_own_or_admin" on storage.objects;
drop policy if exists "storage_outputs_select_own_or_admin" on storage.objects;
drop policy if exists "storage_outputs_admin_insert" on storage.objects;

create policy "storage_inputs_select_own_or_admin" on storage.objects for select to authenticated using (bucket_id = 'rankelia-inputs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "storage_inputs_insert_own" on storage.objects for insert to authenticated with check (bucket_id = 'rankelia-inputs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "storage_inputs_update_own_or_admin" on storage.objects for update to authenticated using (bucket_id = 'rankelia-inputs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())) with check (bucket_id = 'rankelia-inputs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "storage_outputs_select_own_or_admin" on storage.objects for select to authenticated using (bucket_id in ('rankelia-outputs','rankelia-reports') and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "storage_outputs_admin_insert" on storage.objects for insert to authenticated with check (bucket_id in ('rankelia-outputs','rankelia-reports') and public.is_admin());
