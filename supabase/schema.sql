create extension if not exists pgcrypto;
create extension if not exists citext;
create table if not exists profiles (id uuid primary key default gen_random_uuid(), user_id uuid not null unique references auth.users(id) on delete cascade, username citext unique not null, display_name text not null, city text not null, country text not null, intention text not null, emotional_status text not null, bio_short text not null, avatar_url text, is_public boolean default true, is_completed boolean default false, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists love_cvs (id uuid primary key default gen_random_uuid(), profile_id uuid unique not null references profiles(id) on delete cascade, headline text not null, applying_for text not null, about_me text not null, emotional_experience text not null, affective_skills text[] default '{}', green_flags text[] default '{}', soft_red_flags text[] default '{}', love_languages text[] default '{}', ideal_date text, availability text, final_cta text, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists photos (id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade, profile_id uuid not null references profiles(id) on delete cascade, url text not null, storage_path text not null unique, position int default 0, is_primary boolean default false, visibility text default 'public', moderation_status text default 'approved', created_at timestamptz default now());
create table if not exists profile_views (id bigserial primary key, profile_id uuid not null references profiles(id) on delete cascade, viewer_hash text not null, viewed_at timestamptz default now());
create table if not exists reports (id uuid primary key default gen_random_uuid(), reporter_user_id uuid not null references auth.users(id) on delete cascade, reported_profile_id uuid not null references profiles(id) on delete cascade, reason_code text not null, details text, created_at timestamptz default now());
create table if not exists blocks (id uuid primary key default gen_random_uuid(), blocker_user_id uuid not null references auth.users(id) on delete cascade, blocked_user_id uuid not null references auth.users(id) on delete cascade, unique(blocker_user_id, blocked_user_id));
create table if not exists references (id uuid primary key default gen_random_uuid(), profile_id uuid not null references profiles(id) on delete cascade, body text not null, visibility text default 'private', created_at timestamptz default now());
create table if not exists subscriptions (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, plan_code text default 'free', status text default 'inactive', created_at timestamptz default now());
create table if not exists story_exports (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, profile_id uuid not null references profiles(id) on delete cascade, template_id text not null, export_url text, has_watermark boolean default true, is_premium boolean default false, created_at timestamptz default now());
create table if not exists interview_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  sender_profile_id uuid not null references profiles(id) on delete cascade,
  receiver_profile_id uuid not null references profiles(id) on delete cascade,
  message text not null,
  proposal_type text not null,
  intention text not null,
  availability text not null,
  custom_question_answer text,
  status text not null default 'pending',
  read_at timestamptz,
  responded_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists interview_request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references interview_requests(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  metadata jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_interview_requests_receiver_status on interview_requests(receiver_id,status,created_at desc);
create index if not exists idx_interview_requests_sender_created on interview_requests(sender_id,created_at desc);
alter table profiles add column if not exists discoverable boolean default true;
alter table profiles add column if not exists age_range text;
alter table profiles add column if not exists gender text;
alter table profiles add column if not exists orientation text;
alter table profiles add column if not exists looking_for text;
alter table profiles add column if not exists last_active_at timestamptz default now();
alter table profiles add column if not exists moderation_status text default 'active';
alter table profiles add column if not exists profile_score integer default 0;
alter table profiles add column if not exists featured_until timestamptz;
alter table profiles add column if not exists city_normalized text;
alter table profiles add column if not exists country_code text;

create table if not exists favorites (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 profile_id uuid not null references profiles(id) on delete cascade,
 created_at timestamptz default now(),
 unique(user_id,profile_id)
);
create table if not exists discover_preferences (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null unique references auth.users(id) on delete cascade,
 preferred_cities text[],
 preferred_country text,
 preferred_intentions text[],
 preferred_age_ranges text[],
 preferred_love_languages text[],
 hide_viewed_profiles boolean default false,
 show_me_in_discover boolean default true,
 created_at timestamptz default now(),
 updated_at timestamptz default now()
);
create table if not exists profile_impressions (
 id bigserial primary key,
 viewer_id uuid references auth.users(id) on delete set null,
 profile_id uuid not null references profiles(id) on delete cascade,
 source text not null default 'explore',
 created_at timestamptz default now()
);
create table if not exists profile_clicks (
 id bigserial primary key,
 viewer_id uuid references auth.users(id) on delete set null,
 profile_id uuid not null references profiles(id) on delete cascade,
 source text not null default 'explore',
 created_at timestamptz default now()
);
create index if not exists idx_profiles_discover on profiles(discoverable,is_public,is_completed,moderation_status);
create index if not exists idx_profiles_city_norm on profiles(city_normalized);
create index if not exists idx_profiles_intention on profiles(intention);
create index if not exists idx_profiles_featured_until on profiles(featured_until desc);
create index if not exists idx_profiles_created_at on profiles(created_at desc);
create index if not exists idx_profiles_username_name on profiles(username,display_name);
-- Monetization
alter table subscriptions add column if not exists plan text default 'free';
alter table subscriptions add column if not exists stripe_customer_id text;
alter table subscriptions add column if not exists stripe_subscription_id text;
alter table subscriptions add column if not exists current_period_start timestamptz;
alter table subscriptions add column if not exists current_period_end timestamptz;
alter table subscriptions add column if not exists cancel_at_period_end boolean default false;

create table if not exists payments (
 id uuid primary key default gen_random_uuid(),
 user_id uuid references auth.users(id) on delete cascade,
 stripe_payment_intent_id text unique,
 stripe_checkout_session_id text unique,
 type text not null,
 amount integer not null default 0,
 currency text not null default 'eur',
 status text not null,
 metadata jsonb,
 created_at timestamptz default now()
);
create table if not exists boosts (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 profile_id uuid not null references profiles(id) on delete cascade,
 type text not null,
 starts_at timestamptz default now(),
 ends_at timestamptz not null,
 status text not null default 'active',
 payment_id uuid references payments(id) on delete set null,
 city_scope text,
 created_at timestamptz default now()
);
create table if not exists premium_entitlements (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 key text not null,
 value text not null,
 source text not null,
 expires_at timestamptz,
 created_at timestamptz default now()
);
create table if not exists analytics_events (
 id bigserial primary key,
 user_id uuid references auth.users(id) on delete set null,
 profile_id uuid references profiles(id) on delete set null,
 event_name text not null,
 source text,
 metadata jsonb,
 created_at timestamptz default now()
);
create index if not exists idx_boosts_profile_active on boosts(profile_id,status,ends_at desc);
create index if not exists idx_payments_user_created on payments(user_id,created_at desc);
create index if not exists idx_analytics_events_name_created on analytics_events(event_name,created_at desc);
