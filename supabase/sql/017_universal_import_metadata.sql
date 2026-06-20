alter table public.jobs
  add column if not exists import_source_type text null,
  add column if not exists import_original_file_name text null,
  add column if not exists import_sheet_name text null,
  add column if not exists import_encoding text null,
  add column if not exists import_delimiter text null,
  add column if not exists import_platform_guess text null,
  add column if not exists import_mapping_confidence numeric null,
  add column if not exists import_warnings jsonb not null default '[]'::jsonb;

do $$ begin
  alter table public.jobs add constraint jobs_import_source_type_check check (import_source_type in ('csv','tsv','xlsx','xls','pasted_table','xml') or import_source_type is null);
exception when duplicate_object then null;
end $$;

create index if not exists jobs_import_source_type_idx on public.jobs(import_source_type);
