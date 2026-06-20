-- Prompt 8 · Shopify dry-run/apply/rollback safety layer.
create extension if not exists pgcrypto;

alter table public.catalog_items add column if not exists import_source_type text null;
alter table public.catalog_items add column if not exists shopify_store_id uuid null references public.shopify_stores(id) on delete set null;
alter table public.catalog_items add column if not exists shopify_product_gid text null;
create unique index if not exists catalog_items_shopify_product_unique_idx on public.catalog_items(shopify_store_id, shopify_product_gid) where shopify_store_id is not null and shopify_product_gid is not null;

alter table public.import_runs drop constraint if exists import_runs_source_type_check;
alter table public.import_runs add constraint import_runs_source_type_check check (source_type in ('csv','tsv','xlsx','xls','pasted_table','xml','shopify'));
alter table public.import_runs add column if not exists shopify_store_id uuid null references public.shopify_stores(id) on delete set null;
alter table public.import_runs add column if not exists shopify_sync_run_id uuid null references public.shopify_sync_runs(id) on delete set null;

alter table public.change_sets drop constraint if exists change_sets_status_check;
alter table public.change_sets add constraint change_sets_status_check check (status in ('draft','ready_for_dry_run','dry_run_running','dry_run_completed','blocked','ready_to_apply','apply_queued','applying','applied','partially_applied','failed','rollback_available','rolled_back','partially_rolled_back','cancelled'));
alter table public.change_sets add column if not exists dry_run_id uuid null;
alter table public.change_sets add column if not exists apply_run_id uuid null;
alter table public.change_sets add column if not exists rollback_run_id uuid null;
alter table public.change_sets add column if not exists write_scope_required boolean not null default true;
alter table public.change_sets add column if not exists confirmed_at timestamptz null;
alter table public.change_sets add column if not exists confirmed_by uuid null references auth.users(id) on delete set null;
alter table public.change_sets add column if not exists applied_at timestamptz null;
alter table public.change_sets add column if not exists rollback_available boolean not null default false;
alter table public.change_sets add column if not exists conflict_count integer not null default 0;
alter table public.change_sets add column if not exists blocked_count integer not null default 0;
alter table public.change_sets add column if not exists items_total integer not null default 0;
alter table public.change_sets add column if not exists items_ready integer not null default 0;
alter table public.change_sets add column if not exists items_applied integer not null default 0;
alter table public.change_sets add column if not exists items_failed integer not null default 0;
alter table public.change_sets add column if not exists last_error text null;

alter table public.change_set_items add column if not exists external_resource_type text null default 'product';
alter table public.change_set_items add column if not exists external_image_gid text null;
alter table public.change_set_items add column if not exists field_group text null;
alter table public.change_set_items add column if not exists field_path text null;
alter table public.change_set_items add column if not exists before_value jsonb null;
alter table public.change_set_items add column if not exists proposed_value jsonb null;
alter table public.change_set_items add column if not exists current_value_at_dry_run jsonb null;
alter table public.change_set_items add column if not exists current_value_before_apply jsonb null;
alter table public.change_set_items add column if not exists conflict_status text null;
alter table public.change_set_items add column if not exists dry_run_status text null;
alter table public.change_set_items add column if not exists apply_status text null;
alter table public.change_set_items add column if not exists rollback_status text null;
alter table public.change_set_items add column if not exists shopify_mutation_name text null;
alter table public.change_set_items add column if not exists shopify_user_errors jsonb not null default '[]'::jsonb;
alter table public.change_set_items add column if not exists last_error text null;

create table if not exists public.shopify_dry_runs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, store_id uuid not null references public.shopify_stores(id) on delete cascade, change_set_id uuid not null references public.change_sets(id) on delete cascade, status text not null default 'pending', items_total integer not null default 0, items_ready integer not null default 0, items_blocked integer not null default 0, conflicts integer not null default 0, warnings jsonb not null default '[]'::jsonb, blockers jsonb not null default '[]'::jsonb, started_at timestamptz null, finished_at timestamptz null, error_message text null, created_at timestamptz not null default now(), constraint shopify_dry_runs_status_check check (status in ('pending','running','completed','failed','cancelled'))
);
create table if not exists public.shopify_apply_runs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, store_id uuid not null references public.shopify_stores(id) on delete cascade, change_set_id uuid not null references public.change_sets(id) on delete cascade, dry_run_id uuid not null references public.shopify_dry_runs(id) on delete restrict, status text not null default 'pending', items_total integer not null default 0, items_applied integer not null default 0, items_failed integer not null default 0, items_skipped integer not null default 0, items_conflict integer not null default 0, confirmed_by uuid null references auth.users(id) on delete set null, confirmed_at timestamptz null, idempotency_key text null, started_at timestamptz null, finished_at timestamptz null, error_message text null, created_at timestamptz not null default now(), constraint shopify_apply_runs_status_check check (status in ('pending','queued','running','completed','partial_failed','failed','cancelled'))
);
create table if not exists public.shopify_apply_run_items (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, apply_run_id uuid not null references public.shopify_apply_runs(id) on delete cascade, change_set_item_id uuid not null references public.change_set_items(id) on delete cascade, status text not null default 'pending', external_product_gid text not null, before_snapshot_id uuid null references public.shopify_product_snapshots(id) on delete set null, mutation_name text null, request_hash text null, response_hash text null, shopify_user_errors jsonb not null default '[]'::jsonb, error_message text null, applied_at timestamptz null, created_at timestamptz not null default now(), constraint shopify_apply_run_items_status_check check (status in ('pending','applied','failed','skipped','conflict'))
);
create table if not exists public.shopify_rollback_runs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, store_id uuid not null references public.shopify_stores(id) on delete cascade, apply_run_id uuid not null references public.shopify_apply_runs(id) on delete restrict, status text not null default 'pending', items_total integer not null default 0, items_rolled_back integer not null default 0, items_failed integer not null default 0, items_skipped integer not null default 0, confirmed_by uuid null references auth.users(id) on delete set null, confirmed_at timestamptz null, idempotency_key text null, started_at timestamptz null, finished_at timestamptz null, error_message text null, created_at timestamptz not null default now(), constraint shopify_rollback_runs_status_check check (status in ('pending','queued','running','completed','partial_failed','failed','cancelled'))
);
create table if not exists public.shopify_rollback_run_items (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, rollback_run_id uuid not null references public.shopify_rollback_runs(id) on delete cascade, apply_run_item_id uuid not null references public.shopify_apply_run_items(id) on delete cascade, status text not null default 'pending', external_product_gid text not null, restored_snapshot_id uuid null references public.shopify_product_snapshots(id) on delete set null, mutation_name text null, shopify_user_errors jsonb not null default '[]'::jsonb, error_message text null, rolled_back_at timestamptz null, created_at timestamptz not null default now(), constraint shopify_rollback_run_items_status_check check (status in ('pending','rolled_back','failed','skipped'))
);

create index if not exists shopify_dry_runs_change_set_idx on public.shopify_dry_runs(change_set_id, status);
create index if not exists shopify_apply_runs_change_set_idx on public.shopify_apply_runs(change_set_id, status);
create unique index if not exists shopify_apply_runs_idempotency_idx on public.shopify_apply_runs(idempotency_key) where idempotency_key is not null;
create index if not exists shopify_apply_items_run_idx on public.shopify_apply_run_items(apply_run_id, status);
create index if not exists shopify_rollback_runs_apply_idx on public.shopify_rollback_runs(apply_run_id, status);
create unique index if not exists shopify_rollback_runs_idempotency_idx on public.shopify_rollback_runs(idempotency_key) where idempotency_key is not null;

alter table public.shopify_dry_runs enable row level security;
alter table public.shopify_apply_runs enable row level security;
alter table public.shopify_apply_run_items enable row level security;
alter table public.shopify_rollback_runs enable row level security;
alter table public.shopify_rollback_run_items enable row level security;
create policy "shopify_dry_runs_select_own_or_admin" on public.shopify_dry_runs for select to authenticated using (auth.uid() = user_id or public.is_admin());
create policy "shopify_apply_runs_select_own_or_admin" on public.shopify_apply_runs for select to authenticated using (auth.uid() = user_id or public.is_admin());
create policy "shopify_apply_items_select_own_or_admin" on public.shopify_apply_run_items for select to authenticated using (auth.uid() = user_id or public.is_admin());
create policy "shopify_rollback_runs_select_own_or_admin" on public.shopify_rollback_runs for select to authenticated using (auth.uid() = user_id or public.is_admin());
create policy "shopify_rollback_items_select_own_or_admin" on public.shopify_rollback_run_items for select to authenticated using (auth.uid() = user_id or public.is_admin());
create policy "shopify_dry_runs_service_role_all" on public.shopify_dry_runs for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "shopify_apply_runs_service_role_all" on public.shopify_apply_runs for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "shopify_apply_items_service_role_all" on public.shopify_apply_run_items for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "shopify_rollback_runs_service_role_all" on public.shopify_rollback_runs for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "shopify_rollback_items_service_role_all" on public.shopify_rollback_run_items for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
