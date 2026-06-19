-- Advanced schema/GEO/AEO/llms.txt audit summaries on free_seo_audits.
alter table public.free_seo_audits
  add column if not exists schema_score integer null check (schema_score is null or schema_score between 0 and 100),
  add column if not exists schema_status text null,
  add column if not exists schema_summary jsonb not null default '{}'::jsonb,
  add column if not exists schema_issues jsonb not null default '[]'::jsonb,
  add column if not exists schema_recommendations jsonb not null default '[]'::jsonb,
  add column if not exists schema_safe_suggestions jsonb not null default '[]'::jsonb,
  add column if not exists geo_aeo_score integer null check (geo_aeo_score is null or geo_aeo_score between 0 and 100),
  add column if not exists geo_aeo_status text null,
  add column if not exists geo_aeo_summary jsonb not null default '{}'::jsonb,
  add column if not exists geo_aeo_issues jsonb not null default '[]'::jsonb,
  add column if not exists geo_aeo_recommendations jsonb not null default '[]'::jsonb,
  add column if not exists llms_txt_generated boolean not null default false,
  add column if not exists llms_txt_preview text null,
  add column if not exists llms_txt_warnings jsonb not null default '[]'::jsonb,
  add column if not exists llms_txt_score integer null check (llms_txt_score is null or llms_txt_score between 0 and 100);
