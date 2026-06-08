-- Prompt 8: AI generation metadata, validation stats and optional prompt registry.
-- Run after 004_worker_logs_processing.sql.

alter table public.jobs add column if not exists ai_provider text null;
alter table public.jobs add column if not exists ai_model text null;
alter table public.jobs add column if not exists generation_engine text default 'template';
alter table public.jobs add column if not exists prompt_version text null;
alter table public.jobs add column if not exists input_tokens_estimated integer default 0;
alter table public.jobs add column if not exists output_tokens_estimated integer default 0;
alter table public.jobs add column if not exists ai_cost_estimated numeric default 0;
alter table public.jobs add column if not exists ai_error_count integer default 0;
alter table public.jobs add column if not exists fallback_count integer default 0;
alter table public.jobs add column if not exists validation_error_count integer default 0;
alter table public.jobs add column if not exists unsupported_claim_count integer default 0;

alter table public.job_rows add column if not exists ai_provider text null;
alter table public.job_rows add column if not exists ai_model text null;
alter table public.job_rows add column if not exists prompt_version text null;
alter table public.job_rows add column if not exists input_tokens_estimated integer default 0;
alter table public.job_rows add column if not exists output_tokens_estimated integer default 0;
alter table public.job_rows add column if not exists ai_cost_estimated numeric default 0;
alter table public.job_rows add column if not exists raw_ai_output jsonb null;
alter table public.job_rows add column if not exists validation_errors jsonb null;
alter table public.job_rows add column if not exists unsupported_claims jsonb null;
alter table public.job_rows add column if not exists fallback_used boolean default false;
alter table public.job_rows add column if not exists generation_attempts integer default 0;
alter table public.job_rows add column if not exists json_repaired boolean default false;

create table if not exists public.ai_prompt_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  platform text,
  vertical text,
  language text default 'es',
  system_prompt text not null,
  user_prompt_template text not null,
  json_schema jsonb,
  version text default 'v1',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.ai_prompt_templates enable row level security;

drop policy if exists "Admins can read ai prompt templates" on public.ai_prompt_templates;
create policy "Admins can read ai prompt templates" on public.ai_prompt_templates for select using (public.is_admin(auth.uid()));

drop policy if exists "Admins can manage ai prompt templates" on public.ai_prompt_templates;
create policy "Admins can manage ai prompt templates" on public.ai_prompt_templates for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create index if not exists jobs_ai_provider_idx on public.jobs(ai_provider);
create index if not exists jobs_ai_model_idx on public.jobs(ai_model);
create index if not exists job_rows_fallback_used_idx on public.job_rows(fallback_used);
