-- Free SEO audit lead magnet storage. Anonymous audits are inserted by service role only;
-- public users cannot list anonymous audits.
create table if not exists public.free_seo_audits (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid null references auth.users(id) on delete set null,
  lead_email text null check (lead_email is null or lead_email = lower(lead_email)),
  input_url text not null,
  normalized_url text not null check (char_length(normalized_url) <= 2048),
  domain text not null,
  status text not null check (status in ('pending','completed','failed','blocked')),
  error_message text null,
  platform text null,
  platform_confidence integer not null default 0 check (platform_confidence between 0 and 100),
  http_status integer null,
  final_url text null,
  redirect_count integer not null default 0,
  fetch_time_ms integer null,
  html_size_bytes integer null,
  title text null,
  title_length integer null,
  meta_description text null,
  meta_description_length integer null,
  h1_count integer not null default 0,
  h1_texts jsonb not null default '[]'::jsonb,
  canonical_url text null,
  robots_meta text null,
  is_indexable boolean null,
  robots_txt_found boolean null,
  robots_txt_url text null,
  sitemap_found boolean null,
  sitemap_url text null,
  sitemap_declared_in_robots boolean not null default false,
  schema_types jsonb not null default '[]'::jsonb,
  product_schema_found boolean not null default false,
  organization_schema_found boolean not null default false,
  breadcrumb_schema_found boolean not null default false,
  faq_schema_found boolean not null default false,
  image_count integer not null default 0,
  images_without_alt integer not null default 0,
  images_with_empty_alt integer not null default 0,
  large_image_candidates integer not null default 0,
  internal_links_count integer not null default 0,
  external_links_count integer not null default 0,
  critical_issues jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  opportunities jsonb not null default '[]'::jsonb,
  scores jsonb not null default '{}'::jsonb,
  raw_summary jsonb not null default '{}'::jsonb,
  source_ip_hash text null,
  user_agent_hash text null
);

create index if not exists free_seo_audits_user_created_idx on public.free_seo_audits(user_id, created_at desc);
create index if not exists free_seo_audits_domain_created_idx on public.free_seo_audits(domain, created_at desc);
create index if not exists free_seo_audits_lead_email_idx on public.free_seo_audits(lead_email) where lead_email is not null;

create or replace function public.set_free_seo_audits_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_free_seo_audits_updated_at on public.free_seo_audits;
create trigger set_free_seo_audits_updated_at
before update on public.free_seo_audits
for each row execute function public.set_free_seo_audits_updated_at();

alter table public.free_seo_audits enable row level security;

drop policy if exists "Users can read own free SEO audits" on public.free_seo_audits;
create policy "Users can read own free SEO audits" on public.free_seo_audits
for select using (auth.uid() = user_id);

drop policy if exists "Admins can read free SEO audits" on public.free_seo_audits;
create policy "Admins can read free SEO audits" on public.free_seo_audits
for select using (public.is_admin());

-- Inserts/updates are intentionally performed by server-side service role from /api/free-audit.
