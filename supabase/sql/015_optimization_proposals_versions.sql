create table if not exists public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null default 'csv',
  source_id text null,
  external_id text null,
  job_id uuid null references public.jobs(id) on delete set null,
  job_row_id uuid null references public.job_rows(id) on delete set null,
  product_name text null,
  sku text null,
  handle text null,
  product_url text null,
  category text null,
  brand text null,
  language text null,
  country text null,
  original_data jsonb not null default '{}'::jsonb,
  normalized_data jsonb not null default '{}'::jsonb,
  latest_proposal_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(job_row_id)
);
create index if not exists catalog_items_user_created_idx on public.catalog_items(user_id, created_at desc);
create index if not exists catalog_items_user_job_idx on public.catalog_items(user_id, job_id);
create index if not exists catalog_items_user_product_url_idx on public.catalog_items(user_id, product_url);
create index if not exists catalog_items_user_sku_idx on public.catalog_items(user_id, sku);
create index if not exists catalog_items_user_handle_idx on public.catalog_items(user_id, handle);
create index if not exists catalog_items_job_row_idx on public.catalog_items(job_row_id);
alter table public.catalog_items enable row level security;
drop policy if exists "catalog_items_select_own_or_admin" on public.catalog_items;
create policy "catalog_items_select_own_or_admin" on public.catalog_items for select to authenticated using (auth.uid() = user_id or public.is_admin());
drop policy if exists "catalog_items_service_role_all" on public.catalog_items;
create policy "catalog_items_service_role_all" on public.catalog_items for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.optimization_proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  catalog_item_id uuid null references public.catalog_items(id) on delete set null,
  job_id uuid null references public.jobs(id) on delete set null,
  job_row_id uuid null references public.job_rows(id) on delete set null,
  source text not null default 'job',
  proposal_type text not null default 'product',
  status text not null default 'draft',
  review_status text not null default 'pending_review',
  active_version_id uuid null,
  approved_version_id uuid null,
  original_snapshot jsonb not null default '{}'::jsonb,
  current_snapshot jsonb not null default '{}'::jsonb,
  original_scores jsonb not null default '{}'::jsonb,
  active_scores jsonb not null default '{}'::jsonb,
  approved_scores jsonb not null default '{}'::jsonb,
  score_delta jsonb not null default '{}'::jsonb,
  main_keyword text null,
  secondary_keywords jsonb not null default '[]'::jsonb,
  primary_query text null,
  human_review_required boolean not null default true,
  ready_to_export boolean not null default false,
  version_count integer not null default 0,
  created_by uuid null references auth.users(id) on delete set null,
  approved_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz null,
  exported_at timestamptz null,
  constraint optimization_proposals_status_check check (status in ('draft','active','approved','rejected','needs_review','exported','archived')),
  constraint optimization_proposals_review_status_check check (review_status in ('pending_review','needs_changes','approved','rejected')),
  unique(job_row_id)
);
create index if not exists optimization_proposals_user_status_idx on public.optimization_proposals(user_id, status);
create index if not exists optimization_proposals_user_review_status_idx on public.optimization_proposals(user_id, review_status);
create index if not exists optimization_proposals_user_job_idx on public.optimization_proposals(user_id, job_id);
create index if not exists optimization_proposals_user_catalog_item_idx on public.optimization_proposals(user_id, catalog_item_id);
create index if not exists optimization_proposals_job_row_idx on public.optimization_proposals(job_row_id);
create index if not exists optimization_proposals_active_version_idx on public.optimization_proposals(active_version_id);
create index if not exists optimization_proposals_approved_version_idx on public.optimization_proposals(approved_version_id);
create index if not exists optimization_proposals_created_idx on public.optimization_proposals(created_at desc);
alter table public.optimization_proposals enable row level security;
drop policy if exists "optimization_proposals_select_own_or_admin" on public.optimization_proposals;
create policy "optimization_proposals_select_own_or_admin" on public.optimization_proposals for select to authenticated using (auth.uid() = user_id or public.is_admin());
drop policy if exists "optimization_proposals_service_role_all" on public.optimization_proposals;
create policy "optimization_proposals_service_role_all" on public.optimization_proposals for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.optimization_proposal_versions (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.optimization_proposals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  version_number integer not null,
  version_label text null,
  source text not null default 'initial',
  scope text not null default 'full_product',
  instructions text null,
  output_data jsonb not null default '{}'::jsonb,
  changed_fields jsonb not null default '[]'::jsonb,
  diff_summary jsonb not null default '{}'::jsonb,
  scores jsonb not null default '{}'::jsonb,
  quality_audit jsonb not null default '{}'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  model_used text null,
  prompt_version text null,
  generation_engine text null,
  fallback_used boolean not null default false,
  ai_cost_estimate numeric null,
  generation_time_ms integer null,
  human_review_required boolean not null default true,
  ready_to_export boolean not null default false,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint optimization_proposal_versions_source_check check (source in ('initial','regeneration','field_regeneration','manual_edit','imported','fallback')),
  constraint optimization_proposal_versions_scope_check check (scope in ('full_product','seo_product_name','meta_title','meta_description','short_description','long_description','primary_image_alt','gallery_image_alts','image_alt','slug','schema','faq','category','manual_fields')),
  constraint optimization_proposal_versions_unique_number unique (proposal_id, version_number)
);
create index if not exists optimization_versions_proposal_number_idx on public.optimization_proposal_versions(proposal_id, version_number desc);
create index if not exists optimization_versions_user_created_idx on public.optimization_proposal_versions(user_id, created_at desc);
create index if not exists optimization_versions_proposal_created_idx on public.optimization_proposal_versions(proposal_id, created_at desc);
alter table public.optimization_proposal_versions enable row level security;
drop policy if exists "optimization_versions_select_own_or_admin" on public.optimization_proposal_versions;
create policy "optimization_versions_select_own_or_admin" on public.optimization_proposal_versions for select to authenticated using (auth.uid() = user_id or public.is_admin());
drop policy if exists "optimization_versions_service_role_all" on public.optimization_proposal_versions;
create policy "optimization_versions_service_role_all" on public.optimization_proposal_versions for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

alter table public.optimization_proposals drop constraint if exists optimization_proposals_active_version_fk;
alter table public.optimization_proposals add constraint optimization_proposals_active_version_fk foreign key (active_version_id) references public.optimization_proposal_versions(id) on delete set null;
alter table public.optimization_proposals drop constraint if exists optimization_proposals_approved_version_fk;
alter table public.optimization_proposals add constraint optimization_proposals_approved_version_fk foreign key (approved_version_id) references public.optimization_proposal_versions(id) on delete set null;

create table if not exists public.proposal_events (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.optimization_proposals(id) on delete cascade,
  version_id uuid null references public.optimization_proposal_versions(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint proposal_events_type_check check (event_type in ('created','version_created','activated','approved','rejected','marked_needs_review','manual_edit','regeneration_requested','regeneration_completed','regeneration_failed','exported','bulk_approved'))
);
create index if not exists proposal_events_proposal_created_idx on public.proposal_events(proposal_id, created_at desc);
create index if not exists proposal_events_user_created_idx on public.proposal_events(user_id, created_at desc);
create index if not exists proposal_events_type_idx on public.proposal_events(event_type);
alter table public.proposal_events enable row level security;
drop policy if exists "proposal_events_select_own_or_admin" on public.proposal_events;
create policy "proposal_events_select_own_or_admin" on public.proposal_events for select to authenticated using (auth.uid() = user_id or public.is_admin());
drop policy if exists "proposal_events_service_role_all" on public.proposal_events;
create policy "proposal_events_service_role_all" on public.proposal_events for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

alter table public.job_rows
  add column if not exists catalog_item_id uuid null references public.catalog_items(id) on delete set null,
  add column if not exists proposal_id uuid null references public.optimization_proposals(id) on delete set null,
  add column if not exists active_version_id uuid null references public.optimization_proposal_versions(id) on delete set null,
  add column if not exists approved_version_id uuid null references public.optimization_proposal_versions(id) on delete set null,
  add column if not exists original_scores jsonb not null default '{}'::jsonb,
  add column if not exists proposed_scores jsonb not null default '{}'::jsonb,
  add column if not exists score_delta jsonb not null default '{}'::jsonb,
  add column if not exists approval_status text not null default 'pending_review';
alter table public.job_rows drop constraint if exists job_rows_approval_status_check;
alter table public.job_rows add constraint job_rows_approval_status_check check (approval_status in ('pending_review','needs_changes','approved','rejected','exported'));
create index if not exists job_rows_proposal_id_idx on public.job_rows(proposal_id);
create index if not exists job_rows_approval_status_idx on public.job_rows(approval_status);
