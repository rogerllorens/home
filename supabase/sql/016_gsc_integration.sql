create table if not exists public.gsc_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  google_account_email text null,
  google_account_name text null,
  access_token_encrypted text null,
  refresh_token_encrypted text null,
  token_type text null,
  scope text null,
  expiry_date timestamptz null,
  status text not null default 'connected',
  last_error text null,
  connected_at timestamptz not null default now(),
  disconnected_at timestamptz null,
  last_refreshed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gsc_connections_status_check check (status in ('connected','expired','revoked','disconnected','error'))
);
do $$ begin
  alter table gsc_connections add constraint gsc_connections_user_unique unique (user_id);
exception when duplicate_object then null;
end $$;
create index if not exists gsc_connections_user_status_idx on public.gsc_connections(user_id, status);
create index if not exists gsc_connections_created_idx on public.gsc_connections(created_at desc);
alter table public.gsc_connections enable row level security;
drop policy if exists "gsc_connections_select_own_or_admin" on public.gsc_connections;
create policy "gsc_connections_select_own_or_admin" on public.gsc_connections for select to authenticated using (auth.uid() = user_id or public.is_admin());
drop policy if exists "gsc_connections_service_role_all" on public.gsc_connections;
create policy "gsc_connections_service_role_all" on public.gsc_connections for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.gsc_oauth_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  state text not null unique,
  code_verifier text null,
  redirect_after text null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '15 minutes',
  consumed_at timestamptz null
);
create index if not exists gsc_oauth_states_state_idx on public.gsc_oauth_states(state);
create index if not exists gsc_oauth_states_user_created_idx on public.gsc_oauth_states(user_id, created_at desc);
create index if not exists gsc_oauth_states_expires_idx on public.gsc_oauth_states(expires_at);
alter table public.gsc_oauth_states enable row level security;
drop policy if exists "gsc_oauth_states_service_role_all" on public.gsc_oauth_states;
create policy "gsc_oauth_states_service_role_all" on public.gsc_oauth_states for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.gsc_properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid not null references public.gsc_connections(id) on delete cascade,
  site_url text not null,
  permission_level text null,
  is_selected boolean not null default false,
  display_name text null,
  property_type text null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, site_url)
);
create index if not exists gsc_properties_user_selected_idx on public.gsc_properties(user_id, is_selected);
alter table public.gsc_properties enable row level security;
drop policy if exists "gsc_properties_select_own_or_admin" on public.gsc_properties;
create policy "gsc_properties_select_own_or_admin" on public.gsc_properties for select to authenticated using (auth.uid() = user_id or public.is_admin());
drop policy if exists "gsc_properties_service_role_all" on public.gsc_properties;
create policy "gsc_properties_service_role_all" on public.gsc_properties for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.gsc_sync_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid not null references public.gsc_connections(id) on delete cascade,
  property_id uuid not null references public.gsc_properties(id) on delete cascade,
  site_url text not null,
  status text not null default 'pending',
  date_range text not null,
  start_date date not null,
  end_date date not null,
  dimensions jsonb not null default '[]'::jsonb,
  rows_fetched integer not null default 0,
  url_rows_fetched integer not null default 0,
  query_rows_fetched integer not null default 0,
  page_query_rows_fetched integer not null default 0,
  error_message text null,
  started_at timestamptz null,
  finished_at timestamptz null,
  created_at timestamptz not null default now(),
  constraint gsc_sync_runs_status_check check (status in ('pending','running','completed','failed','cancelled')),
  constraint gsc_sync_runs_date_range_check check (date_range in ('28d','90d','custom'))
);
create index if not exists gsc_sync_runs_user_created_idx on public.gsc_sync_runs(user_id, created_at desc);
create index if not exists gsc_sync_runs_property_range_idx on public.gsc_sync_runs(property_id, date_range, created_at desc);
create index if not exists gsc_sync_runs_status_idx on public.gsc_sync_runs(status);
alter table public.gsc_sync_runs enable row level security;
drop policy if exists "gsc_sync_runs_select_own_or_admin" on public.gsc_sync_runs;
create policy "gsc_sync_runs_select_own_or_admin" on public.gsc_sync_runs for select to authenticated using (auth.uid() = user_id or public.is_admin());
drop policy if exists "gsc_sync_runs_service_role_all" on public.gsc_sync_runs;
create policy "gsc_sync_runs_service_role_all" on public.gsc_sync_runs for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.gsc_url_metrics (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, property_id uuid not null references public.gsc_properties(id) on delete cascade, sync_run_id uuid not null references public.gsc_sync_runs(id) on delete cascade, site_url text not null, page_url text not null, normalized_url text not null, date_range text not null, start_date date not null, end_date date not null, clicks integer not null default 0, impressions integer not null default 0, ctr numeric not null default 0, position numeric not null default 0, matched_catalog_item_id uuid null references public.catalog_items(id) on delete set null, matched_proposal_id uuid null references public.optimization_proposals(id) on delete set null, match_confidence numeric null, match_method text null, created_at timestamptz not null default now(), unique (property_id, date_range, normalized_url, start_date, end_date)
);
create index if not exists gsc_url_metrics_user_impressions_idx on public.gsc_url_metrics(user_id, impressions desc); create index if not exists gsc_url_metrics_normalized_idx on public.gsc_url_metrics(normalized_url); create index if not exists gsc_url_metrics_match_catalog_idx on public.gsc_url_metrics(matched_catalog_item_id); alter table public.gsc_url_metrics enable row level security;
drop policy if exists "gsc_url_metrics_select_own_or_admin" on public.gsc_url_metrics; create policy "gsc_url_metrics_select_own_or_admin" on public.gsc_url_metrics for select to authenticated using (auth.uid() = user_id or public.is_admin()); drop policy if exists "gsc_url_metrics_service_role_all" on public.gsc_url_metrics; create policy "gsc_url_metrics_service_role_all" on public.gsc_url_metrics for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.gsc_query_metrics (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, property_id uuid not null references public.gsc_properties(id) on delete cascade, sync_run_id uuid not null references public.gsc_sync_runs(id) on delete cascade, site_url text not null, query text not null, normalized_query text not null, date_range text not null, start_date date not null, end_date date not null, clicks integer not null default 0, impressions integer not null default 0, ctr numeric not null default 0, position numeric not null default 0, created_at timestamptz not null default now(), unique (property_id, date_range, normalized_query, start_date, end_date)
);
create index if not exists gsc_query_metrics_user_impressions_idx on public.gsc_query_metrics(user_id, impressions desc); create index if not exists gsc_query_metrics_normalized_idx on public.gsc_query_metrics(normalized_query); alter table public.gsc_query_metrics enable row level security;
drop policy if exists "gsc_query_metrics_select_own_or_admin" on public.gsc_query_metrics; create policy "gsc_query_metrics_select_own_or_admin" on public.gsc_query_metrics for select to authenticated using (auth.uid() = user_id or public.is_admin()); drop policy if exists "gsc_query_metrics_service_role_all" on public.gsc_query_metrics; create policy "gsc_query_metrics_service_role_all" on public.gsc_query_metrics for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.gsc_page_query_metrics (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, property_id uuid not null references public.gsc_properties(id) on delete cascade, sync_run_id uuid not null references public.gsc_sync_runs(id) on delete cascade, site_url text not null, page_url text not null, normalized_url text not null, query text not null, normalized_query text not null, date_range text not null, start_date date not null, end_date date not null, clicks integer not null default 0, impressions integer not null default 0, ctr numeric not null default 0, position numeric not null default 0, matched_catalog_item_id uuid null references public.catalog_items(id) on delete set null, matched_proposal_id uuid null references public.optimization_proposals(id) on delete set null, match_confidence numeric null, match_method text null, created_at timestamptz not null default now(), unique (property_id, date_range, normalized_url, normalized_query, start_date, end_date)
);
create index if not exists gsc_page_query_user_impressions_idx on public.gsc_page_query_metrics(user_id, impressions desc); create index if not exists gsc_page_query_normalized_url_idx on public.gsc_page_query_metrics(normalized_url); create index if not exists gsc_page_query_normalized_query_idx on public.gsc_page_query_metrics(normalized_query); alter table public.gsc_page_query_metrics enable row level security;
drop policy if exists "gsc_page_query_select_own_or_admin" on public.gsc_page_query_metrics; create policy "gsc_page_query_select_own_or_admin" on public.gsc_page_query_metrics for select to authenticated using (auth.uid() = user_id or public.is_admin()); drop policy if exists "gsc_page_query_service_role_all" on public.gsc_page_query_metrics; create policy "gsc_page_query_service_role_all" on public.gsc_page_query_metrics for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.gsc_catalog_matches (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, property_id uuid not null references public.gsc_properties(id) on delete cascade, catalog_item_id uuid not null references public.catalog_items(id) on delete cascade, page_url text not null, normalized_url text not null, match_method text not null, match_confidence numeric not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (user_id, property_id, catalog_item_id, normalized_url)
);
alter table public.gsc_catalog_matches enable row level security;
drop policy if exists "gsc_catalog_matches_select_own_or_admin" on public.gsc_catalog_matches; create policy "gsc_catalog_matches_select_own_or_admin" on public.gsc_catalog_matches for select to authenticated using (auth.uid() = user_id or public.is_admin()); drop policy if exists "gsc_catalog_matches_service_role_all" on public.gsc_catalog_matches; create policy "gsc_catalog_matches_service_role_all" on public.gsc_catalog_matches for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
