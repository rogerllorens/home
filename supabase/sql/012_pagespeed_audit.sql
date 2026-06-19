-- PageSpeed Insights summaries for free SEO audits. Stores only normalized metrics, not full Lighthouse payloads.
create table if not exists public.pagespeed_audits (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  free_audit_id uuid null references public.free_seo_audits(id) on delete set null,
  user_id uuid null references auth.users(id) on delete set null,
  normalized_url text not null,
  domain text not null,
  strategy text not null check (strategy in ('mobile', 'desktop')),
  status text not null check (status in ('pending', 'completed', 'failed', 'skipped', 'rate_limited')),
  error_message text null,
  psi_fetch_time_ms integer null,
  lighthouse_version text null,
  performance_score integer null check (performance_score is null or performance_score between 0 and 100),
  accessibility_score integer null,
  best_practices_score integer null,
  seo_score integer null,
  pwa_score integer null,
  first_contentful_paint_ms integer null,
  largest_contentful_paint_ms integer null,
  total_blocking_time_ms integer null,
  cumulative_layout_shift numeric null,
  speed_index_ms integer null,
  interaction_to_next_paint_ms integer null,
  time_to_interactive_ms integer null,
  server_response_time_ms integer null,
  render_blocking_savings_ms integer null,
  unused_js_savings_bytes integer null,
  unused_css_savings_bytes integer null,
  image_optimization_savings_bytes integer null,
  modern_image_savings_bytes integer null,
  dom_size integer null,
  critical_opportunities jsonb not null default '[]'::jsonb,
  diagnostics jsonb not null default '[]'::jsonb,
  field_data jsonb not null default '{}'::jsonb,
  lab_data jsonb not null default '{}'::jsonb,
  raw_summary jsonb not null default '{}'::jsonb,
  cache_key text not null,
  expires_at timestamptz null
);

create unique index if not exists pagespeed_audits_cache_strategy_idx on public.pagespeed_audits(cache_key, strategy);
create index if not exists pagespeed_audits_domain_created_idx on public.pagespeed_audits(domain, created_at desc);
create index if not exists pagespeed_audits_free_audit_idx on public.pagespeed_audits(free_audit_id);
create index if not exists pagespeed_audits_url_idx on public.pagespeed_audits(normalized_url);

create or replace function public.set_pagespeed_audits_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_pagespeed_audits_updated_at on public.pagespeed_audits;
create trigger set_pagespeed_audits_updated_at
before update on public.pagespeed_audits
for each row execute function public.set_pagespeed_audits_updated_at();

alter table public.pagespeed_audits enable row level security;

drop policy if exists "Users can read own pagespeed audits" on public.pagespeed_audits;
create policy "Users can read own pagespeed audits" on public.pagespeed_audits
for select using (auth.uid() = user_id);

drop policy if exists "Admins can read pagespeed audits" on public.pagespeed_audits;
create policy "Admins can read pagespeed audits" on public.pagespeed_audits
for select using (public.is_admin());

-- Inserts/updates are intentionally performed by server-side service role from audit routes.
