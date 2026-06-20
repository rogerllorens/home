-- Prompt 7 · Shopify read/import foundation and change-set preparation.
create extension if not exists pgcrypto;

create table if not exists public.shopify_stores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shop_domain text not null,
  myshopify_domain text not null,
  store_name text null,
  email text null,
  currency text null,
  timezone text null,
  plan_name text null,
  access_token_encrypted text null,
  granted_scopes jsonb not null default '[]'::jsonb,
  status text not null default 'connected',
  read_connected_at timestamptz null,
  write_connected_at timestamptz null,
  disconnected_at timestamptz null,
  last_sync_at timestamptz null,
  last_error text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, myshopify_domain),
  constraint shopify_stores_status_check check (status in ('connected','needs_reauth','disconnected','uninstalled','error'))
);

create table if not exists public.shopify_oauth_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shop_domain text not null,
  state text not null unique,
  requested_scopes jsonb not null default '[]'::jsonb,
  mode text not null default 'read',
  redirect_after text null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '15 minutes',
  consumed_at timestamptz null,
  constraint shopify_oauth_states_mode_check check (mode in ('read','write_upgrade'))
);

create table if not exists public.shopify_sync_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  store_id uuid not null references public.shopify_stores(id) on delete cascade,
  status text not null default 'pending',
  mode text not null default 'manual',
  sync_type text not null default 'products',
  cursor text null,
  products_seen integer not null default 0,
  products_created integer not null default 0,
  products_updated integer not null default 0,
  variants_seen integer not null default 0,
  images_seen integer not null default 0,
  started_at timestamptz null,
  finished_at timestamptz null,
  error_message text null,
  created_at timestamptz not null default now(),
  constraint shopify_sync_runs_status_check check (status in ('pending','queued','running','completed','failed','cancelled')),
  constraint shopify_sync_runs_mode_check check (mode in ('manual','webhook','scheduled','backfill'))
);

create table if not exists public.shopify_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  store_id uuid not null references public.shopify_stores(id) on delete cascade,
  shopify_product_gid text not null,
  legacy_resource_id text null,
  title text null,
  handle text null,
  vendor text null,
  product_type text null,
  status text null,
  online_store_url text null,
  seo_title text null,
  seo_description text null,
  body_html text null,
  tags jsonb not null default '[]'::jsonb,
  images jsonb not null default '[]'::jsonb,
  variants jsonb not null default '[]'::jsonb,
  raw_product jsonb not null default '{}'::jsonb,
  catalog_item_id uuid null references public.catalog_items(id) on delete set null,
  deleted_at timestamptz null,
  last_synced_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, shopify_product_gid)
);

create table if not exists public.shopify_product_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  store_id uuid not null references public.shopify_stores(id) on delete cascade,
  shopify_product_gid text not null,
  snapshot_type text not null default 'sync',
  snapshot jsonb not null,
  source text not null default 'shopify_sync',
  created_at timestamptz not null default now(),
  constraint shopify_product_snapshots_type_check check (snapshot_type in ('sync','pre_apply','rollback','manual'))
);

create table if not exists public.shopify_webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  store_id uuid null references public.shopify_stores(id) on delete set null,
  user_id uuid null references auth.users(id) on delete set null,
  topic text not null,
  shop_domain text not null,
  delivery_id text not null unique,
  hmac_valid boolean not null default false,
  status text not null default 'received',
  payload_hash text null,
  processed_at timestamptz null,
  error_message text null,
  created_at timestamptz not null default now(),
  constraint shopify_webhook_deliveries_status_check check (status in ('received','processed','ignored_duplicate','failed'))
);

create table if not exists public.change_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  integration text not null default 'shopify',
  store_id uuid null references public.shopify_stores(id) on delete set null,
  job_id uuid null references public.jobs(id) on delete set null,
  status text not null default 'draft',
  source text not null default 'approved_versions',
  title text null,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint change_sets_status_check check (status in ('draft','ready_for_dry_run','dry_run_completed','blocked','applied','partially_applied','cancelled'))
);

create table if not exists public.change_set_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  change_set_id uuid not null references public.change_sets(id) on delete cascade,
  proposal_id uuid null references public.optimization_proposals(id) on delete set null,
  proposal_version_id uuid null references public.optimization_proposal_versions(id) on delete set null,
  catalog_item_id uuid null references public.catalog_items(id) on delete set null,
  external_product_gid text null,
  status text not null default 'pending',
  fields jsonb not null default '[]'::jsonb,
  before_snapshot jsonb not null default '{}'::jsonb,
  proposed_changes jsonb not null default '{}'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  blockers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint change_set_items_status_check check (status in ('pending','ready','blocked','skipped'))
);

alter table public.optimization_proposal_versions add column if not exists template_id uuid null references public.ai_prompt_templates(id) on delete set null;
alter table public.optimization_proposal_versions add column if not exists prompt_version_id uuid null references public.ai_prompt_versions(id) on delete set null;
alter table public.optimization_proposal_versions add column if not exists sector_rule_id uuid null references public.ai_sector_rules(id) on delete set null;
alter table public.optimization_proposal_versions add column if not exists ai_generation_run_id uuid null references public.ai_generation_runs(id) on delete set null;
alter table public.optimization_proposal_versions add column if not exists provider text null;
alter table public.optimization_proposal_versions add column if not exists token_usage jsonb not null default '{}'::jsonb;

create index if not exists shopify_stores_user_status_idx on public.shopify_stores(user_id, status);
create index if not exists shopify_products_store_gid_idx on public.shopify_products(store_id, shopify_product_gid);
create index if not exists shopify_products_catalog_item_idx on public.shopify_products(catalog_item_id) where catalog_item_id is not null;
create index if not exists shopify_sync_runs_store_status_idx on public.shopify_sync_runs(store_id, status, created_at desc);
create index if not exists shopify_webhook_delivery_id_idx on public.shopify_webhook_deliveries(delivery_id);
create index if not exists change_sets_user_status_idx on public.change_sets(user_id, status);
create index if not exists change_set_items_proposal_idx on public.change_set_items(proposal_id) where proposal_id is not null;

alter table public.shopify_stores enable row level security;
alter table public.shopify_oauth_states enable row level security;
alter table public.shopify_sync_runs enable row level security;
alter table public.shopify_products enable row level security;
alter table public.shopify_product_snapshots enable row level security;
alter table public.shopify_webhook_deliveries enable row level security;
alter table public.change_sets enable row level security;
alter table public.change_set_items enable row level security;

create policy "shopify_stores_select_own_or_admin" on public.shopify_stores for select to authenticated using (auth.uid() = user_id or public.is_admin());
create policy "shopify_products_select_own_or_admin" on public.shopify_products for select to authenticated using (auth.uid() = user_id or public.is_admin());
create policy "shopify_sync_runs_select_own_or_admin" on public.shopify_sync_runs for select to authenticated using (auth.uid() = user_id or public.is_admin());
create policy "shopify_snapshots_select_own_or_admin" on public.shopify_product_snapshots for select to authenticated using (auth.uid() = user_id or public.is_admin());
create policy "shopify_webhooks_select_admin" on public.shopify_webhook_deliveries for select to authenticated using (public.is_admin());
create policy "change_sets_select_own_or_admin" on public.change_sets for select to authenticated using (auth.uid() = user_id or public.is_admin());
create policy "change_set_items_select_own_or_admin" on public.change_set_items for select to authenticated using (auth.uid() = user_id or public.is_admin());
create policy "shopify_service_role_all" on public.shopify_stores for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "shopify_oauth_service_role_all" on public.shopify_oauth_states for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "shopify_sync_service_role_all" on public.shopify_sync_runs for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "shopify_products_service_role_all" on public.shopify_products for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "shopify_snapshots_service_role_all" on public.shopify_product_snapshots for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "shopify_webhooks_service_role_all" on public.shopify_webhook_deliveries for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "change_sets_service_role_all" on public.change_sets for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "change_set_items_service_role_all" on public.change_set_items for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');


-- GSC production hardening foundation: route enqueues a run; worker/script processes it.
alter table public.gsc_sync_runs drop constraint if exists gsc_sync_runs_status_check;
alter table public.gsc_sync_runs add constraint gsc_sync_runs_status_check check (status in ('pending','queued','running','completed','failed','cancelled'));
alter table public.gsc_sync_runs add column if not exists mode text not null default 'manual';
create index if not exists gsc_sync_runs_pending_idx on public.gsc_sync_runs(status, created_at) where status in ('pending','queued');
