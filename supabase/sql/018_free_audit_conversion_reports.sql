alter table public.free_seo_audits
  add column if not exists email text null,
  add column if not exists lead_name text null,
  add column if not exists company_name text null,
  add column if not exists url text null,
  add column if not exists public_token_hash text null unique,
  add column if not exists public_token_created_at timestamptz null,
  add column if not exists public_token_expires_at timestamptz null,
  add column if not exists report_sent_at timestamptz null,
  add column if not exists report_opened_at timestamptz null,
  add column if not exists last_viewed_at timestamptz null,
  add column if not exists overall_score integer null,
  add column if not exists seo_score integer null,
  add column if not exists technical_score integer null,
  add column if not exists image_score integer null,
  add column if not exists schema_score integer null,
  add column if not exists performance_score integer null,
  add column if not exists geo_aeo_score integer null,
  add column if not exists llms_score integer null,
  add column if not exists platform_guess text null,
  add column if not exists audit_result jsonb not null default '{}'::jsonb,
  add column if not exists executive_summary jsonb not null default '{}'::jsonb,
  add column if not exists top_issues jsonb not null default '[]'::jsonb,
  add column if not exists top_opportunities jsonb not null default '[]'::jsonb,
  add column if not exists recommended_actions jsonb not null default '[]'::jsonb,
  add column if not exists rankelia_value_summary jsonb not null default '{}'::jsonb,
  add column if not exists source text not null default 'free_audit',
  add column if not exists utm_source text null,
  add column if not exists utm_medium text null,
  add column if not exists utm_campaign text null,
  add column if not exists utm_term text null,
  add column if not exists utm_content text null,
  add column if not exists referrer text null,
  add column if not exists consent_email_report boolean not null default false,
  add column if not exists consent_marketing boolean not null default false,
  add column if not exists ip_hash text null,
  add column if not exists user_agent_hash text null;

update public.free_seo_audits set url = coalesce(url, input_url), email = coalesce(email, lead_email) where url is null or email is null;

create index if not exists free_seo_audits_public_token_hash_idx on public.free_seo_audits(public_token_hash) where public_token_hash is not null;
create index if not exists free_seo_audits_email_created_idx on public.free_seo_audits(email, created_at desc) where email is not null;

create table if not exists public.audit_report_events (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.free_seo_audits(id) on delete cascade,
  user_id uuid null references auth.users(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_report_events_type_check check (event_type in ('audit_created','email_requested','email_sent','email_failed','report_viewed','cta_clicked','signup_clicked','upload_clicked','gsc_clicked','expired'))
);

create index if not exists audit_report_events_audit_created_idx on public.audit_report_events(audit_id, created_at desc);
create index if not exists audit_report_events_type_created_idx on public.audit_report_events(event_type, created_at desc);

alter table public.audit_report_events enable row level security;

drop policy if exists "Users can read own audit report events" on public.audit_report_events;
create policy "Users can read own audit report events" on public.audit_report_events
for select using (auth.uid() = user_id);

drop policy if exists "Admins can read audit report events" on public.audit_report_events;
create policy "Admins can read audit report events" on public.audit_report_events
for select using (public.is_admin());
