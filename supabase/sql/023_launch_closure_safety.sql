-- Prompt 9 · final launch closure safety flags.
alter table public.change_set_items add column if not exists live_check_status text not null default 'not_checked';
alter table public.change_set_items add column if not exists live_checked_at timestamptz null;
alter table public.change_set_items add column if not exists live_value jsonb null;
alter table public.change_set_items add column if not exists live_error text null;
alter table public.shopify_products add column if not exists stale_at timestamptz null;
alter table public.shopify_products add column if not exists deleted_at timestamptz null;
alter table public.shopify_stores add column if not exists needs_resync boolean not null default false;
create index if not exists change_set_items_live_check_idx on public.change_set_items(change_set_id, live_check_status);
create index if not exists shopify_products_stale_idx on public.shopify_products(store_id, stale_at) where stale_at is not null;
