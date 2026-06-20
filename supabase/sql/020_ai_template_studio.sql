create table if not exists public.ai_prompt_templates (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text null,
  type text not null,
  status text not null default 'draft',
  default_locale text not null default 'es',
  default_tone text null,
  default_sector text null,
  owner_scope text not null default 'global',
  created_by uuid null references auth.users(id) on delete set null,
  active_version_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_prompt_templates_type_check check (type in ('product','category','metadata','alt_text','schema','faq','article','repair_json','product_regeneration','field_regeneration','free_audit_summary','gsc_opportunity','import_mapping_assistant')),
  constraint ai_prompt_templates_status_check check (status in ('draft','active','paused','archived')),
  constraint ai_prompt_templates_owner_scope_check check (owner_scope in ('global','workspace','user'))
);

create table if not exists public.ai_prompt_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.ai_prompt_templates(id) on delete cascade,
  version_number integer not null,
  status text not null default 'draft',
  system_prompt text not null,
  user_prompt_template text not null,
  developer_notes text null,
  output_schema jsonb not null default '{}'::jsonb,
  variables_schema jsonb not null default '{}'::jsonb,
  model_policy jsonb not null default '{}'::jsonb,
  quality_policy jsonb not null default '{}'::jsonb,
  safety_policy jsonb not null default '{}'::jsonb,
  changelog text null,
  created_by uuid null references auth.users(id) on delete set null,
  activated_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  activated_at timestamptz null,
  constraint ai_prompt_versions_unique_number unique (template_id, version_number),
  constraint ai_prompt_versions_status_check check (status in ('draft','active','paused','archived'))
);

do $$ begin
  alter table public.ai_prompt_templates add constraint ai_prompt_templates_active_version_fk foreign key (active_version_id) references public.ai_prompt_versions(id) on delete set null;
exception when duplicate_object then null; end $$;

create table if not exists public.ai_sector_rules (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text null,
  sector text not null,
  business_type text null,
  locale text not null default 'es',
  tone text null,
  allowed_claims jsonb not null default '[]'::jsonb,
  forbidden_claims jsonb not null default '[]'::jsonb,
  required_fields jsonb not null default '[]'::jsonb,
  recommended_keywords jsonb not null default '[]'::jsonb,
  forbidden_keywords jsonb not null default '[]'::jsonb,
  writing_guidelines jsonb not null default '{}'::jsonb,
  seo_guidelines jsonb not null default '{}'::jsonb,
  compliance_notes jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_sector_rules_status_check check (status in ('active','paused','archived'))
);

create table if not exists public.ai_model_configs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  model text not null,
  display_name text not null,
  status text not null default 'active',
  supports_json boolean not null default true,
  supports_tools boolean not null default false,
  supports_vision boolean not null default false,
  input_cost_per_1m numeric null,
  output_cost_per_1m numeric null,
  currency text not null default 'USD',
  max_input_tokens integer null,
  max_output_tokens integer null,
  default_temperature numeric null,
  default_top_p numeric null,
  quality_tier text not null default 'standard',
  latency_tier text not null default 'standard',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, model),
  constraint ai_model_configs_status_check check (status in ('active','paused','archived')),
  constraint ai_model_configs_quality_tier_check check (quality_tier in ('cheap','standard','premium','experimental'))
);

create table if not exists public.ai_routing_rules (
  id uuid primary key default gen_random_uuid(),
  task_type text not null,
  sector text null,
  plan_key text null,
  primary_provider text not null,
  primary_model text not null,
  fallback_provider text null,
  fallback_model text null,
  max_cost_per_item numeric null,
  max_latency_ms integer null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_routing_rules_status_check check (status in ('active','paused','archived'))
);

create table if not exists public.ai_generation_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  job_id uuid null references public.jobs(id) on delete set null,
  job_row_id uuid null references public.job_rows(id) on delete set null,
  proposal_id uuid null references public.optimization_proposals(id) on delete set null,
  proposal_version_id uuid null references public.optimization_proposal_versions(id) on delete set null,
  template_id uuid null references public.ai_prompt_templates(id) on delete set null,
  prompt_version_id uuid null references public.ai_prompt_versions(id) on delete set null,
  sector_rule_id uuid null references public.ai_sector_rules(id) on delete set null,
  task_type text not null,
  provider text not null,
  model text not null,
  prompt_version_label text null,
  input_tokens integer null,
  output_tokens integer null,
  total_tokens integer null,
  estimated_cost numeric null,
  currency text not null default 'USD',
  latency_ms integer null,
  status text not null default 'completed',
  error_message text null,
  fallback_used boolean not null default false,
  fallback_reason text null,
  quality_score numeric null,
  seo_score numeric null,
  image_seo_score numeric null,
  geo_aeo_score numeric null,
  confidence_score numeric null,
  warnings jsonb not null default '[]'::jsonb,
  quality_audit jsonb not null default '{}'::jsonb,
  prompt_input_hash text null,
  output_hash text null,
  created_at timestamptz not null default now(),
  constraint ai_generation_runs_status_check check (status in ('completed','failed','fallback','cancelled'))
);

create table if not exists public.ai_prompt_experiments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text null,
  template_id uuid not null references public.ai_prompt_templates(id) on delete cascade,
  variant_a_version_id uuid not null references public.ai_prompt_versions(id) on delete cascade,
  variant_b_version_id uuid not null references public.ai_prompt_versions(id) on delete cascade,
  traffic_split numeric not null default 0.5,
  status text not null default 'draft',
  start_at timestamptz null,
  end_at timestamptz null,
  success_metric text not null default 'quality_score',
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint ai_prompt_experiments_status_check check (status in ('draft','running','paused','completed','archived'))
);

create index if not exists ai_generation_runs_job_created_idx on public.ai_generation_runs(job_id, created_at desc) where job_id is not null;
create index if not exists ai_generation_runs_template_created_idx on public.ai_generation_runs(template_id, created_at desc) where template_id is not null;
create index if not exists ai_generation_runs_cost_idx on public.ai_generation_runs(provider, model, created_at desc);

alter table public.ai_prompt_templates enable row level security;
alter table public.ai_prompt_versions enable row level security;
alter table public.ai_sector_rules enable row level security;
alter table public.ai_model_configs enable row level security;
alter table public.ai_routing_rules enable row level security;
alter table public.ai_generation_runs enable row level security;
alter table public.ai_prompt_experiments enable row level security;

create policy "Admins manage ai prompt templates" on public.ai_prompt_templates for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage ai prompt versions" on public.ai_prompt_versions for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage ai sector rules" on public.ai_sector_rules for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage ai model configs" on public.ai_model_configs for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage ai routing rules" on public.ai_routing_rules for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage ai experiments" on public.ai_prompt_experiments for all using (public.is_admin()) with check (public.is_admin());
create policy "Users read own ai generation runs" on public.ai_generation_runs for select using (auth.uid() = user_id);
create policy "Admins read ai generation runs" on public.ai_generation_runs for select using (public.is_admin());
