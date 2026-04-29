-- Currículum del Amor - MVP Fase 1
-- PostgreSQL / Supabase schema
-- Incluye tablas principales, constraints, índices, triggers y políticas RLS.

-- Requerido para gen_random_uuid() en Postgres estándar.
create extension if not exists pgcrypto;

-- ============================
-- 1) ENUMS Y TIPOS AUXILIARES
-- ============================

-- Estado emocional mostrado en el perfil.
do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'emotional_state'
  ) then
    create type public.emotional_state as enum (
      'available',
      'rebuilding',
      'exploring',
      'deep_connections',
      'not_sure_yet'
    );
  end if;
end
$$;

-- Visibilidad del CV.
do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'cv_visibility'
  ) then
    create type public.cv_visibility as enum (
      'public',
      'private'
    );
  end if;
end
$$;

-- Tipo de relación en experiencia sentimental.
do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'relationship_type'
  ) then
    create type public.relationship_type as enum (
      'stable',
      'casual',
      'situationship',
      'long_distance',
      'other'
    );
  end if;
end
$$;

-- ============================
-- 2) FUNCIONES UTILITARIAS
-- ============================

-- Trigger para updated_at automático.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Función helper para hash de IP (idealmente se llama desde backend con IP real).
create or replace function public.sha256_text(input text)
returns text
language sql
immutable
as $$
  select encode(digest(coalesce(input, ''), 'sha256'), 'hex')
$$;

-- Sanitiza texto básico contra payloads HTML/JS para campos user-generated.
create or replace function public.sanitize_text(input text)
returns text
language sql
immutable
as $$
  select regexp_replace(coalesce(input, ''), '<[^>]*>', '', 'g')
$$;

-- Guard anti-spam para interview_requests:
-- 1) evita solicitudes al propio CV
-- 2) máximo 10 solicitudes por día por usuario
-- 3) sanitiza mensaje para prevenir XSS
create or replace function public.guard_interview_request_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_own_cv boolean;
  v_count_today int;
begin
  select exists (
    select 1
    from public.love_cvs c
    join public.profiles p on p.id = c.profile_id
    where c.id = new.to_cv_id and p.user_id = new.from_user_id
  ) into v_is_own_cv;

  if v_is_own_cv then
    raise exception 'No puedes solicitar entrevista a tu propio CV';
  end if;

  select count(*)
  into v_count_today
  from public.interview_requests ir
  where ir.from_user_id = new.from_user_id
    and ir.created_at >= date_trunc('day', now())
    and ir.created_at < date_trunc('day', now()) + interval '1 day';

  if v_count_today >= 10 then
    raise exception 'Límite diario alcanzado: máximo 10 solicitudes por día';
  end if;

  new.message := trim(public.sanitize_text(new.message));
  return new;
end;
$$;

-- ============================
-- 3) TABLAS PRINCIPALES
-- ============================

-- Perfiles extendidos sobre auth.users
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  username text not null unique,
  full_name text,
  alias text,
  city text,
  age int,
  emotional_state public.emotional_state not null default 'exploring',
  bio text,
  looking_for text,
  is_admin boolean not null default false,
  is_suspended boolean not null default false,
  suspended_until timestamptz,
  is_adult_confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,30}$'),
  constraint profiles_age_check check (age is null or (age >= 18 and age <= 120)),
  constraint profiles_adult_check check (is_adult_confirmed = true)
);

comment on table public.profiles is 'Perfil público y metadatos del usuario de Currículum del Amor.';
comment on column public.profiles.user_id is 'Relación 1:1 con auth.users.';
comment on column public.profiles.username is 'Usado para URLs públicas tipo /cv/[slug].';
comment on column public.profiles.is_adult_confirmed is 'Confirmación obligatoria de +18 en registro.';
comment on column public.profiles.is_admin is 'Flag para acceso al panel /admin (solo usuarios autorizados).';

create index if not exists idx_profiles_user_id on public.profiles(user_id);
create index if not exists idx_profiles_username on public.profiles(username);

-- CV principal emocional (1 por perfil en MVP)
create table if not exists public.love_cvs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  title text not null,
  experience jsonb not null default '[]'::jsonb,
  skills jsonb not null default '[]'::jsonb,
  green_flags jsonb not null default '[]'::jsonb,
  red_flags jsonb not null default '[]'::jsonb,
  love_languages jsonb not null default '[]'::jsonb,
  visibility public.cv_visibility not null default 'public',
  story_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint love_cvs_title_len check (char_length(title) between 3 and 180),
  constraint love_cvs_experience_is_array check (jsonb_typeof(experience) = 'array'),
  constraint love_cvs_skills_is_array check (jsonb_typeof(skills) = 'array'),
  constraint love_cvs_green_flags_is_array check (jsonb_typeof(green_flags) = 'array'),
  constraint love_cvs_red_flags_is_array check (jsonb_typeof(red_flags) = 'array'),
  constraint love_cvs_love_languages_is_array check (jsonb_typeof(love_languages) = 'array')
);

comment on table public.love_cvs is 'Contenido principal del CV emocional; una fila por profile_id en MVP.';

create index if not exists idx_love_cvs_profile_id on public.love_cvs(profile_id);
create index if not exists idx_love_cvs_visibility on public.love_cvs(visibility);

-- Fotos asociadas al CV
create table if not exists public.cv_photos (
  id uuid primary key default gen_random_uuid(),
  cv_id uuid not null references public.love_cvs(id) on delete cascade,
  url text not null,
  photo_order smallint not null default 0,
  is_main boolean not null default false,
  created_at timestamptz not null default now(),
  constraint cv_photos_url_len check (char_length(url) > 10)
);

comment on table public.cv_photos is 'Fotos del CV; se recomienda exactamente una principal para render público.';

create index if not exists idx_cv_photos_cv_id on public.cv_photos(cv_id);
create unique index if not exists uq_cv_photos_single_main
  on public.cv_photos(cv_id)
  where is_main = true;

-- Referencias/recomendaciones públicas
create table if not exists public.references (
  id uuid primary key default gen_random_uuid(),
  cv_id uuid not null references public.love_cvs(id) on delete cascade,
  from_user_id uuid references auth.users(id) on delete set null,
  author_fingerprint text,
  name text not null,
  text text not null,
  is_reported boolean not null default false,
  created_at timestamptz not null default now(),
  constraint references_name_len check (char_length(name) between 2 and 60),
  constraint references_text_len check (char_length(text) between 10 and 280),
  constraint references_author_id_or_fingerprint check (
    from_user_id is not null or author_fingerprint is not null
  )
);

comment on table public.references is 'Recomendaciones cortas; permite autor autenticado o anónimo con fingerprint.';

create index if not exists idx_references_cv_id on public.references(cv_id);
create index if not exists idx_references_created_at on public.references(created_at desc);

-- Evita spam: un usuario autenticado solo puede dejar 1 referencia por CV.
create unique index if not exists uq_references_one_per_user_per_cv
  on public.references(cv_id, from_user_id)
  where from_user_id is not null;

-- Evita spam anónimo: 1 referencia por fingerprint por CV.
create unique index if not exists uq_references_one_per_fingerprint_per_cv
  on public.references(cv_id, author_fingerprint)
  where author_fingerprint is not null;

-- Vistas al perfil público
create table if not exists public.profile_views (
  id uuid primary key default gen_random_uuid(),
  cv_id uuid not null references public.love_cvs(id) on delete cascade,
  viewer_id uuid references auth.users(id) on delete set null,
  ip_hash text,
  created_at timestamptz not null default now(),
  constraint profile_views_identity_check check (
    viewer_id is not null or ip_hash is not null
  )
);

comment on table public.profile_views is 'Eventos de vista para analíticas simples y contador público.';

create index if not exists idx_profile_views_cv_id on public.profile_views(cv_id);
create index if not exists idx_profile_views_created_at on public.profile_views(created_at desc);

-- Opcional anti-flood de vistas en ventana diaria por usuario/fingerprint.
create unique index if not exists uq_profile_views_unique_daily_user
  on public.profile_views(cv_id, viewer_id, date_trunc('day', created_at))
  where viewer_id is not null;

create unique index if not exists uq_profile_views_unique_daily_ip
  on public.profile_views(cv_id, ip_hash, date_trunc('day', created_at))
  where ip_hash is not null;

-- Imágenes generadas para Stories
create table if not exists public.generated_story_images (
  id uuid primary key default gen_random_uuid(),
  cv_id uuid not null references public.love_cvs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id int not null,
  image_url text not null,
  image_path text not null,
  custom_text text,
  has_watermark boolean not null default true,
  is_public boolean not null default true,
  cv_content_hash text,
  created_at timestamptz not null default now(),
  constraint generated_story_images_template_check check (template_id between 1 and 4),
  constraint generated_story_images_url_len check (char_length(image_url) > 10)
);

comment on table public.generated_story_images is 'Historial de imágenes verticales generadas para compartir en Stories.';
comment on column public.generated_story_images.cv_content_hash is 'Hash para cache inteligente: reutiliza imagen si el CV no cambió.';

create index if not exists idx_generated_story_images_cv_id
  on public.generated_story_images(cv_id);
create index if not exists idx_generated_story_images_user_id
  on public.generated_story_images(user_id);
create index if not exists idx_generated_story_images_created_at
  on public.generated_story_images(created_at desc);

-- Favoritos / guardados privados por usuario
create table if not exists public.cv_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cv_id uuid not null references public.love_cvs(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint uq_cv_favorites_user_cv unique (user_id, cv_id)
);

comment on table public.cv_favorites is 'CVs guardados de forma privada por cada usuario.';

create index if not exists idx_cv_favorites_user_id_created_at
  on public.cv_favorites(user_id, created_at desc);
create index if not exists idx_cv_favorites_cv_id
  on public.cv_favorites(cv_id);

-- Solicitudes de entrevista entre usuarios
create table if not exists public.interview_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_cv_id uuid not null references public.love_cvs(id) on delete cascade,
  message text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  rejected_at timestamptz,
  constraint interview_requests_message_len check (char_length(message) between 10 and 300),
  constraint interview_requests_status_check check (status in ('pending', 'accepted', 'rejected'))
);

comment on table public.interview_requests is 'Solicitudes intencionales para conectar con un CV.';

create unique index if not exists uq_interview_requests_active_per_user_cv
  on public.interview_requests(from_user_id, to_cv_id)
  where status in ('pending', 'accepted');
create index if not exists idx_interview_requests_to_cv_status_created
  on public.interview_requests(to_cv_id, status, created_at desc);
create index if not exists idx_interview_requests_from_user_created
  on public.interview_requests(from_user_id, created_at desc);

-- Notificaciones del sistema
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text,
  body text,
  data jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  constraint notifications_type_check check (
    type in ('favorite', 'interview_request', 'new_reference', 'view_milestone')
  ),
  constraint notifications_title_len check (title is null or char_length(title) <= 120),
  constraint notifications_body_len check (body is null or char_length(body) <= 500)
);

comment on table public.notifications is 'Notificaciones in-app para favoritos, solicitudes y eventos sociales.';

create index if not exists idx_notifications_user_read_created
  on public.notifications(user_id, is_read, created_at desc);

-- Tabla base para bloqueos futuros (estructura preparada para moderación futura).
create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_user_id uuid not null references auth.users(id) on delete cascade,
  blocked_user_id uuid not null references auth.users(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  constraint blocks_no_self check (blocker_user_id <> blocked_user_id),
  constraint blocks_unique_pair unique (blocker_user_id, blocked_user_id)
);

comment on table public.blocks is 'Relación de bloqueo entre usuarios para futuras reglas de visibilidad/interacción.';

create index if not exists idx_blocks_blocker_user_id on public.blocks(blocker_user_id);
create index if not exists idx_blocks_blocked_user_id on public.blocks(blocked_user_id);

-- Suscripciones Stripe (1 fila por usuario)
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  plan_type text not null default 'free' check (plan_type in ('free', 'pro_monthly', 'pro_yearly')),
  status text not null default 'active' check (status in ('active', 'canceled', 'past_due', 'incomplete')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.subscriptions is 'Estado de suscripción por usuario sincronizado con Stripe.';
create index if not exists idx_subscriptions_plan_status on public.subscriptions(plan_type, status);
create index if not exists idx_subscriptions_current_period_end on public.subscriptions(current_period_end);

-- Boosts de perfil (pagos únicos) para priorización en explorar.
create table if not exists public.profile_boosts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cv_id uuid not null references public.love_cvs(id) on delete cascade,
  starts_at timestamptz not null,
  expires_at timestamptz not null,
  boost_type text not null check (boost_type in ('24h', '3days', '7days')),
  stripe_payment_id text,
  created_at timestamptz not null default now(),
  constraint profile_boosts_dates_check check (expires_at > starts_at)
);

comment on table public.profile_boosts is 'Boosts activos e históricos para ranking prioritario en explorar.';
create index if not exists idx_profile_boosts_cv_id_expires_at on public.profile_boosts(cv_id, expires_at desc);
create index if not exists idx_profile_boosts_user_id_created_at on public.profile_boosts(user_id, created_at desc);
create index if not exists idx_profile_boosts_active_window on public.profile_boosts(starts_at, expires_at);

-- Compras one-time (boosts, packs premium, etc).
create table if not exists public.one_time_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_type text not null,
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  amount numeric(10,2) not null check (amount >= 0),
  currency text not null default 'eur',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.one_time_purchases is 'Registro auditable de compras no recurrentes.';
create index if not exists idx_one_time_purchases_user_id_created_at
  on public.one_time_purchases(user_id, created_at desc);
create index if not exists idx_one_time_purchases_product_type
  on public.one_time_purchases(product_type);

-- Flags de capacidades premium adquiridas una sola vez (ej. pack de plantillas premium).
create table if not exists public.user_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entitlement_key text not null,
  source text not null default 'purchase',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint user_entitlements_unique_key unique (user_id, entitlement_key)
);

comment on table public.user_entitlements is 'Permisos extra por compras one-time o promos.';
create index if not exists idx_user_entitlements_user_id_expires
  on public.user_entitlements(user_id, expires_at);

-- Eventos de Stripe para idempotencia y auditoría.
create table if not exists public.stripe_events (
  id text primary key,
  event_type text not null,
  livemode boolean not null default false,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  payload jsonb not null
);

comment on table public.stripe_events is 'Log de webhooks Stripe para deduplicación y trazabilidad.';

-- Feature flags para activar/desactivar capacidades sin deploy.
create table if not exists public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text,
  enabled boolean not null default false,
  rollout_percentage int not null default 100 check (rollout_percentage between 0 and 100),
  metadata jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.feature_flags is 'Feature flags operativos para launch control y experimentación.';

-- Preferencias de usuario (dark mode, idioma, notificaciones, accesibilidad).
create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  language text not null default 'es' check (language in ('es', 'en')),
  reduced_motion boolean not null default false,
  high_contrast boolean not null default false,
  notifications_settings jsonb not null default '{}'::jsonb,
  privacy_settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.user_preferences is 'Preferencias UX y privacidad del usuario final.';
create index if not exists idx_user_preferences_language on public.user_preferences(language);

-- Matches/conexiones: se crean al aceptar interview_request.
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user1_id uuid not null references auth.users(id) on delete cascade,
  user2_id uuid not null references auth.users(id) on delete cascade,
  initiated_by uuid not null references auth.users(id) on delete cascade,
  interview_request_id uuid references public.interview_requests(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'paused', 'ended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matches_users_distinct check (user1_id <> user2_id)
);

comment on table public.matches is 'Conexiones activas entre dos usuarios después de aceptar solicitud.';
create unique index if not exists uq_matches_pair_normalized
  on public.matches (least(user1_id, user2_id), greatest(user1_id, user2_id));
create index if not exists idx_matches_user1_status_created on public.matches(user1_id, status, created_at desc);
create index if not exists idx_matches_user2_status_created on public.matches(user2_id, status, created_at desc);

-- Mensajes de chat por match.
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text,
  image_url text,
  is_read boolean not null default false,
  is_flagged boolean not null default false,
  flagged_reason text,
  created_at timestamptz not null default now(),
  constraint chat_messages_payload_check check (
    coalesce(char_length(trim(content)), 0) > 0 or image_url is not null
  ),
  constraint chat_messages_content_len check (
    content is null or char_length(content) <= 2000
  )
);

comment on table public.chat_messages is 'Mensajes entre usuarios conectados por match.';
create index if not exists idx_chat_messages_match_created on public.chat_messages(match_id, created_at desc);
create index if not exists idx_chat_messages_sender_created on public.chat_messages(sender_id, created_at desc);
create index if not exists idx_chat_messages_unread on public.chat_messages(match_id, is_read, created_at desc);

-- Ocultar chat por usuario (soft delete local sin borrar historial global).
create table if not exists public.chat_hidden_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  hidden_at timestamptz not null default now(),
  constraint chat_hidden_threads_unique unique (user_id, match_id)
);

comment on table public.chat_hidden_threads is 'Ocultación local de conversaciones por usuario.';

-- Bloqueos para chat/moderación (tabla específica de mensajería).
create table if not exists public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  constraint user_blocks_no_self check (blocker_id <> blocked_id),
  constraint user_blocks_unique_pair unique (blocker_id, blocked_id)
);

comment on table public.user_blocks is 'Bloqueos activos que impiden interacción, perfil y mensajes.';
create index if not exists idx_user_blocks_blocker on public.user_blocks(blocker_id);
create index if not exists idx_user_blocks_blocked on public.user_blocks(blocked_id);

-- Reportes para revisión manual.
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_id uuid not null references auth.users(id) on delete cascade,
  match_id uuid references public.matches(id) on delete set null,
  chat_message_id uuid references public.chat_messages(id) on delete set null,
  reason text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed', 'action_taken')),
  created_at timestamptz not null default now(),
  constraint reports_no_self check (reporter_id <> reported_id)
);

comment on table public.reports is 'Reportes de seguridad/moderación generados por usuarios.';
create index if not exists idx_reports_reported_status_created on public.reports(reported_id, status, created_at desc);
create index if not exists idx_reports_reporter_created on public.reports(reporter_id, created_at desc);

-- Lista configurable de palabras prohibidas para filtro básico.
create table if not exists public.banned_words (
  id uuid primary key default gen_random_uuid(),
  word text not null unique,
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.banned_words is 'Diccionario configurable para moderación automática simple.';

alter table public.banned_words
  add column if not exists language text not null default 'es',
  add column if not exists category text not null default 'toxic';

-- Consentimientos explícitos para cumplimiento legal y GDPR.
create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null,
  accepted boolean not null default true,
  accepted_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

comment on table public.user_consents is 'Registro auditable de consentimientos legales y de privacidad.';
create index if not exists idx_user_consents_user_id_type on public.user_consents(user_id, consent_type, accepted_at desc);

-- Auditoría de acciones de administración/moderación.
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.admin_audit_logs is 'Trail auditable de acciones ejecutadas por admins/moderadores.';
create index if not exists idx_admin_audit_logs_admin_created on public.admin_audit_logs(admin_id, created_at desc);
create index if not exists idx_admin_audit_logs_target on public.admin_audit_logs(target_type, target_id, created_at desc);

-- Historial de sanciones aplicadas a usuarios reportados.
create table if not exists public.user_sanctions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  strike_count int not null default 1 check (strike_count between 1 and 4),
  sanction_type text not null check (sanction_type in ('warning', 'ban_7d', 'ban_30d', 'ban_permanent')),
  reason text,
  related_report_id uuid references public.reports(id) on delete set null,
  expires_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.user_sanctions is 'Escalado de sanciones por reincidencia (strikes).';
create index if not exists idx_user_sanctions_user_created on public.user_sanctions(user_id, created_at desc);

alter table public.reports
  alter column reporter_id drop not null,
  alter column reported_id drop not null,
  add column if not exists report_category text not null default 'other'
    check (report_category in ('harassment', 'sexual_content', 'fake_profile', 'spam', 'minor', 'other')),
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists resolution_note text;

-- ============================
-- 4) TRIGGERS updated_at
-- ============================

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_love_cvs_updated_at on public.love_cvs;
create trigger trg_love_cvs_updated_at
before update on public.love_cvs
for each row execute function public.set_updated_at();

drop trigger if exists trg_interview_requests_updated_at on public.interview_requests;
create trigger trg_interview_requests_updated_at
before update on public.interview_requests
for each row execute function public.set_updated_at();

drop trigger if exists trg_interview_requests_guard_insert on public.interview_requests;
create trigger trg_interview_requests_guard_insert
before insert on public.interview_requests
for each row execute function public.guard_interview_request_insert();

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

drop trigger if exists trg_feature_flags_updated_at on public.feature_flags;
create trigger trg_feature_flags_updated_at
before update on public.feature_flags
for each row execute function public.set_updated_at();

drop trigger if exists trg_user_preferences_updated_at on public.user_preferences;
create trigger trg_user_preferences_updated_at
before update on public.user_preferences
for each row execute function public.set_updated_at();

drop trigger if exists trg_matches_updated_at on public.matches;
create trigger trg_matches_updated_at
before update on public.matches
for each row execute function public.set_updated_at();

drop trigger if exists trg_interview_requests_create_match on public.interview_requests;
create trigger trg_interview_requests_create_match
after update on public.interview_requests
for each row execute function public.create_match_on_request_accepted();

drop trigger if exists trg_chat_messages_guard_insert on public.chat_messages;
create trigger trg_chat_messages_guard_insert
before insert on public.chat_messages
for each row execute function public.guard_chat_message_insert();

-- ============================
-- 5) RLS + POLÍTICAS
-- ============================

alter table public.profiles enable row level security;
alter table public.love_cvs enable row level security;
alter table public.cv_photos enable row level security;
alter table public.references enable row level security;
alter table public.profile_views enable row level security;
alter table public.generated_story_images enable row level security;
alter table public.cv_favorites enable row level security;
alter table public.interview_requests enable row level security;
alter table public.notifications enable row level security;
alter table public.blocks enable row level security;
alter table public.subscriptions enable row level security;
alter table public.profile_boosts enable row level security;
alter table public.one_time_purchases enable row level security;
alter table public.user_entitlements enable row level security;
alter table public.stripe_events enable row level security;
alter table public.matches enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_hidden_threads enable row level security;
alter table public.user_blocks enable row level security;
alter table public.reports enable row level security;
alter table public.banned_words enable row level security;
alter table public.user_consents enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.user_sanctions enable row level security;
alter table public.feature_flags enable row level security;
alter table public.user_preferences enable row level security;

-- PROFILES
-- Lectura pública para perfiles usados en /cv/[slug].
drop policy if exists profiles_select_public on public.profiles;
create policy profiles_select_public
  on public.profiles
  for select
  using (true);

-- Usuario autenticado puede insertar su propio profile (user_id = auth.uid())
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Usuario puede actualizar solo su perfil.
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Usuario puede borrar solo su perfil.
drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own
  on public.profiles
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- LOVE_CVS
-- Lectura pública solo si visibility = public.
drop policy if exists love_cvs_select_public_or_owner on public.love_cvs;
create policy love_cvs_select_public_or_owner
  on public.love_cvs
  for select
  using (
    visibility = 'public'
    or exists (
      select 1 from public.profiles p
      where p.id = love_cvs.profile_id
      and p.user_id = auth.uid()
    )
  );

-- Dueño crea/edita/borra su CV.
drop policy if exists love_cvs_insert_owner on public.love_cvs;
create policy love_cvs_insert_owner
  on public.love_cvs
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = love_cvs.profile_id
      and p.user_id = auth.uid()
    )
  );

drop policy if exists love_cvs_update_owner on public.love_cvs;
create policy love_cvs_update_owner
  on public.love_cvs
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = love_cvs.profile_id
      and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = love_cvs.profile_id
      and p.user_id = auth.uid()
    )
  );

drop policy if exists love_cvs_delete_owner on public.love_cvs;
create policy love_cvs_delete_owner
  on public.love_cvs
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = love_cvs.profile_id
      and p.user_id = auth.uid()
    )
  );

-- CV_PHOTOS
-- Lectura pública si su CV es público, o dueño.
drop policy if exists cv_photos_select_public_or_owner on public.cv_photos;
create policy cv_photos_select_public_or_owner
  on public.cv_photos
  for select
  using (
    exists (
      select 1
      from public.love_cvs c
      join public.profiles p on p.id = c.profile_id
      where c.id = cv_photos.cv_id
        and (c.visibility = 'public' or p.user_id = auth.uid())
    )
  );

-- Insert/update/delete solo dueño del CV.
drop policy if exists cv_photos_insert_owner on public.cv_photos;
create policy cv_photos_insert_owner
  on public.cv_photos
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.love_cvs c
      join public.profiles p on p.id = c.profile_id
      where c.id = cv_photos.cv_id and p.user_id = auth.uid()
    )
  );

drop policy if exists cv_photos_update_owner on public.cv_photos;
create policy cv_photos_update_owner
  on public.cv_photos
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.love_cvs c
      join public.profiles p on p.id = c.profile_id
      where c.id = cv_photos.cv_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.love_cvs c
      join public.profiles p on p.id = c.profile_id
      where c.id = cv_photos.cv_id and p.user_id = auth.uid()
    )
  );

drop policy if exists cv_photos_delete_owner on public.cv_photos;
create policy cv_photos_delete_owner
  on public.cv_photos
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.love_cvs c
      join public.profiles p on p.id = c.profile_id
      where c.id = cv_photos.cv_id and p.user_id = auth.uid()
    )
  );

-- REFERENCES
-- Lectura pública de referencias para CVs públicos.
drop policy if exists references_select_public_or_owner on public.references;
create policy references_select_public_or_owner
  on public.references
  for select
  using (
    exists (
      select 1
      from public.love_cvs c
      join public.profiles p on p.id = c.profile_id
      where c.id = references.cv_id
        and (c.visibility = 'public' or p.user_id = auth.uid())
    )
  );

-- Crear referencia: permitido a anónimos y autenticados, solo para CVs públicos.
drop policy if exists references_insert_public_cv on public.references;
create policy references_insert_public_cv
  on public.references
  for insert
  to anon, authenticated
  with check (
    exists (
      select 1
      from public.love_cvs c
      where c.id = references.cv_id and c.visibility = 'public'
    )
    and (
      (auth.role() = 'authenticated' and from_user_id = auth.uid())
      or (auth.role() = 'anon' and from_user_id is null)
    )
  );

-- Editar/borrar referencia: solo dueño del CV (moderación básica).
drop policy if exists references_update_cv_owner on public.references;
create policy references_update_cv_owner
  on public.references
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.love_cvs c
      join public.profiles p on p.id = c.profile_id
      where c.id = references.cv_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.love_cvs c
      join public.profiles p on p.id = c.profile_id
      where c.id = references.cv_id and p.user_id = auth.uid()
    )
  );

drop policy if exists references_delete_cv_owner on public.references;
create policy references_delete_cv_owner
  on public.references
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.love_cvs c
      join public.profiles p on p.id = c.profile_id
      where c.id = references.cv_id and p.user_id = auth.uid()
    )
  );

-- PROFILE_VIEWS
-- El dueño puede ver detalle de vistas. Para público se recomienda exponer conteo vía RPC o vista agregada.
drop policy if exists profile_views_select_owner on public.profile_views;
create policy profile_views_select_owner
  on public.profile_views
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.love_cvs c
      join public.profiles p on p.id = c.profile_id
      where c.id = profile_views.cv_id and p.user_id = auth.uid()
    )
  );

-- Insert de vistas permitido para anon/auth en CV público.
drop policy if exists profile_views_insert_public_cv on public.profile_views;
create policy profile_views_insert_public_cv
  on public.profile_views
  for insert
  to anon, authenticated
  with check (
    exists (
      select 1 from public.love_cvs c
      where c.id = profile_views.cv_id and c.visibility = 'public'
    )
    and (
      (auth.role() = 'authenticated' and viewer_id = auth.uid())
      or (auth.role() = 'anon' and viewer_id is null)
    )
  );

-- GENERATED_STORY_IMAGES
-- Cualquiera puede leer imágenes públicas para facilitar sharing.
drop policy if exists generated_story_images_select_public_or_owner on public.generated_story_images;
create policy generated_story_images_select_public_or_owner
  on public.generated_story_images
  for select
  using (
    is_public = true
    or user_id = auth.uid()
    or exists (
      select 1
      from public.love_cvs c
      join public.profiles p on p.id = c.profile_id
      where c.id = generated_story_images.cv_id and p.user_id = auth.uid()
    )
  );

-- Solo dueño del CV puede insertar imágenes generadas.
drop policy if exists generated_story_images_insert_owner on public.generated_story_images;
create policy generated_story_images_insert_owner
  on public.generated_story_images
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.love_cvs c
      join public.profiles p on p.id = c.profile_id
      where c.id = generated_story_images.cv_id and p.user_id = auth.uid()
    )
  );

drop policy if exists generated_story_images_delete_owner on public.generated_story_images;
create policy generated_story_images_delete_owner
  on public.generated_story_images
  for delete
  to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1
      from public.love_cvs c
      join public.profiles p on p.id = c.profile_id
      where c.id = generated_story_images.cv_id and p.user_id = auth.uid()
    )
  );

-- CV_FAVORITES
drop policy if exists cv_favorites_select_own on public.cv_favorites;
create policy cv_favorites_select_own
  on public.cv_favorites
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists cv_favorites_insert_own on public.cv_favorites;
create policy cv_favorites_insert_own
  on public.cv_favorites
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.love_cvs c
      where c.id = cv_favorites.cv_id and c.visibility = 'public'
    )
  );

drop policy if exists cv_favorites_delete_own on public.cv_favorites;
create policy cv_favorites_delete_own
  on public.cv_favorites
  for delete
  to authenticated
  using (user_id = auth.uid());

-- INTERVIEW_REQUESTS
-- El remitente ve sus enviadas.
drop policy if exists interview_requests_select_sender on public.interview_requests;
create policy interview_requests_select_sender
  on public.interview_requests
  for select
  to authenticated
  using (from_user_id = auth.uid());

-- El receptor (owner del CV) ve recibidas.
drop policy if exists interview_requests_select_receiver on public.interview_requests;
create policy interview_requests_select_receiver
  on public.interview_requests
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.love_cvs c
      join public.profiles p on p.id = c.profile_id
      where c.id = interview_requests.to_cv_id and p.user_id = auth.uid()
    )
  );

-- Insert solo autenticado, y solo hacia CV público.
drop policy if exists interview_requests_insert_authenticated_public_cv on public.interview_requests;
create policy interview_requests_insert_authenticated_public_cv
  on public.interview_requests
  for insert
  to authenticated
  with check (
    from_user_id = auth.uid()
    and exists (
      select 1 from public.love_cvs c
      where c.id = interview_requests.to_cv_id and c.visibility = 'public'
    )
  );

-- Update permitido al receptor (aceptar/rechazar) y al remitente (cancelación futura).
drop policy if exists interview_requests_update_sender_or_receiver on public.interview_requests;
create policy interview_requests_update_sender_or_receiver
  on public.interview_requests
  for update
  to authenticated
  using (
    from_user_id = auth.uid()
    or exists (
      select 1
      from public.love_cvs c
      join public.profiles p on p.id = c.profile_id
      where c.id = interview_requests.to_cv_id and p.user_id = auth.uid()
    )
  )
  with check (
    from_user_id = interview_requests.from_user_id
    and to_cv_id = interview_requests.to_cv_id
    and (
      from_user_id = auth.uid()
      or exists (
        select 1
        from public.love_cvs c
        join public.profiles p on p.id = c.profile_id
        where c.id = interview_requests.to_cv_id and p.user_id = auth.uid()
      )
    )
  );

-- NOTIFICATIONS
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own
  on public.notifications
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists notifications_insert_own_or_service on public.notifications;
create policy notifications_insert_own_or_service
  on public.notifications
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own
  on public.notifications
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists notifications_delete_own on public.notifications;
create policy notifications_delete_own
  on public.notifications
  for delete
  to authenticated
  using (user_id = auth.uid());

-- BLOCKS
drop policy if exists blocks_select_own on public.blocks;
create policy blocks_select_own
  on public.blocks
  for select
  to authenticated
  using (blocker_user_id = auth.uid());

drop policy if exists blocks_insert_own on public.blocks;
create policy blocks_insert_own
  on public.blocks
  for insert
  to authenticated
  with check (blocker_user_id = auth.uid());

drop policy if exists blocks_delete_own on public.blocks;
create policy blocks_delete_own
  on public.blocks
  for delete
  to authenticated
  using (blocker_user_id = auth.uid());

-- SUBSCRIPTIONS
drop policy if exists subscriptions_select_own on public.subscriptions;
create policy subscriptions_select_own
  on public.subscriptions
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists subscriptions_insert_own on public.subscriptions;
create policy subscriptions_insert_own
  on public.subscriptions
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists subscriptions_update_own on public.subscriptions;
create policy subscriptions_update_own
  on public.subscriptions
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- PROFILE_BOOSTS
-- Lectura pública para ranking de explorar (solo boosts activos), o dueño.
drop policy if exists profile_boosts_select_public_active_or_owner on public.profile_boosts;
create policy profile_boosts_select_public_active_or_owner
  on public.profile_boosts
  for select
  using (
    (starts_at <= now() and expires_at > now())
    or user_id = auth.uid()
  );

drop policy if exists profile_boosts_insert_own on public.profile_boosts;
create policy profile_boosts_insert_own
  on public.profile_boosts
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.love_cvs c
      join public.profiles p on p.id = c.profile_id
      where c.id = profile_boosts.cv_id and p.user_id = auth.uid()
    )
  );

drop policy if exists profile_boosts_delete_own on public.profile_boosts;
create policy profile_boosts_delete_own
  on public.profile_boosts
  for delete
  to authenticated
  using (user_id = auth.uid());

-- ONE_TIME_PURCHASES
drop policy if exists one_time_purchases_select_own on public.one_time_purchases;
create policy one_time_purchases_select_own
  on public.one_time_purchases
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists one_time_purchases_insert_own on public.one_time_purchases;
create policy one_time_purchases_insert_own
  on public.one_time_purchases
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- USER_ENTITLEMENTS
drop policy if exists user_entitlements_select_own on public.user_entitlements;
create policy user_entitlements_select_own
  on public.user_entitlements
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists user_entitlements_insert_own on public.user_entitlements;
create policy user_entitlements_insert_own
  on public.user_entitlements
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- MATCHES
drop policy if exists matches_select_participants_only on public.matches;
create policy matches_select_participants_only
  on public.matches
  for select
  to authenticated
  using (auth.uid() in (user1_id, user2_id));

drop policy if exists matches_update_participants_only on public.matches;
create policy matches_update_participants_only
  on public.matches
  for update
  to authenticated
  using (auth.uid() in (user1_id, user2_id))
  with check (auth.uid() in (user1_id, user2_id));

-- CHAT_MESSAGES
drop policy if exists chat_messages_select_participants_only on public.chat_messages;
create policy chat_messages_select_participants_only
  on public.chat_messages
  for select
  to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = chat_messages.match_id
        and auth.uid() in (m.user1_id, m.user2_id)
    )
  );

drop policy if exists chat_messages_insert_sender_participant on public.chat_messages;
create policy chat_messages_insert_sender_participant
  on public.chat_messages
  for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.matches m
      where m.id = chat_messages.match_id
        and m.status = 'active'
        and auth.uid() in (m.user1_id, m.user2_id)
    )
  );

-- Solo sender puede actualizar su mensaje (ediciones futuras), y receptor/sender marcan leído.
drop policy if exists chat_messages_update_participants on public.chat_messages;
create policy chat_messages_update_participants
  on public.chat_messages
  for update
  to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = chat_messages.match_id
        and auth.uid() in (m.user1_id, m.user2_id)
    )
  )
  with check (
    exists (
      select 1 from public.matches m
      where m.id = chat_messages.match_id
        and auth.uid() in (m.user1_id, m.user2_id)
    )
  );

-- CHAT_HIDDEN_THREADS
drop policy if exists chat_hidden_threads_select_own on public.chat_hidden_threads;
create policy chat_hidden_threads_select_own
  on public.chat_hidden_threads
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists chat_hidden_threads_insert_own on public.chat_hidden_threads;
create policy chat_hidden_threads_insert_own
  on public.chat_hidden_threads
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.matches m
      where m.id = chat_hidden_threads.match_id
        and auth.uid() in (m.user1_id, m.user2_id)
    )
  );

drop policy if exists chat_hidden_threads_delete_own on public.chat_hidden_threads;
create policy chat_hidden_threads_delete_own
  on public.chat_hidden_threads
  for delete
  to authenticated
  using (user_id = auth.uid());

-- USER_BLOCKS
drop policy if exists user_blocks_select_involved on public.user_blocks;
create policy user_blocks_select_involved
  on public.user_blocks
  for select
  to authenticated
  using (auth.uid() in (blocker_id, blocked_id));

drop policy if exists user_blocks_insert_blocker_only on public.user_blocks;
create policy user_blocks_insert_blocker_only
  on public.user_blocks
  for insert
  to authenticated
  with check (blocker_id = auth.uid());

drop policy if exists user_blocks_delete_blocker_only on public.user_blocks;
create policy user_blocks_delete_blocker_only
  on public.user_blocks
  for delete
  to authenticated
  using (blocker_id = auth.uid());

-- REPORTS
drop policy if exists reports_insert_authenticated on public.reports;
create policy reports_insert_authenticated
  on public.reports
  for insert
  to authenticated
  with check (reporter_id = auth.uid());

drop policy if exists reports_select_own_reported on public.reports;
create policy reports_select_own_reported
  on public.reports
  for select
  to authenticated
  using (reporter_id = auth.uid());

drop policy if exists reports_select_admin_all on public.reports;
create policy reports_select_admin_all
  on public.reports
  for select
  to authenticated
  using (public.is_admin_user(auth.uid()));

drop policy if exists reports_update_admin_only on public.reports;
create policy reports_update_admin_only
  on public.reports
  for update
  to authenticated
  using (public.is_admin_user(auth.uid()))
  with check (public.is_admin_user(auth.uid()));

-- BANNED_WORDS
drop policy if exists banned_words_select_public on public.banned_words;
create policy banned_words_select_public
  on public.banned_words
  for select
  using (is_active = true);

drop policy if exists banned_words_admin_manage on public.banned_words;
create policy banned_words_admin_manage
  on public.banned_words
  for all
  to authenticated
  using (public.is_admin_user(auth.uid()))
  with check (public.is_admin_user(auth.uid()));

-- USER_CONSENTS
drop policy if exists user_consents_select_own on public.user_consents;
create policy user_consents_select_own
  on public.user_consents
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists user_consents_insert_own on public.user_consents;
create policy user_consents_insert_own
  on public.user_consents
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists user_consents_select_admin on public.user_consents;
create policy user_consents_select_admin
  on public.user_consents
  for select
  to authenticated
  using (public.is_admin_user(auth.uid()));

-- ADMIN_AUDIT_LOGS
drop policy if exists admin_audit_logs_admin_only on public.admin_audit_logs;
create policy admin_audit_logs_admin_only
  on public.admin_audit_logs
  for all
  to authenticated
  using (public.is_admin_user(auth.uid()))
  with check (public.is_admin_user(auth.uid()));

-- USER_SANCTIONS
drop policy if exists user_sanctions_select_self_or_admin on public.user_sanctions;
create policy user_sanctions_select_self_or_admin
  on public.user_sanctions
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin_user(auth.uid()));

drop policy if exists user_sanctions_admin_insert on public.user_sanctions;
create policy user_sanctions_admin_insert
  on public.user_sanctions
  for insert
  to authenticated
  with check (public.is_admin_user(auth.uid()));

-- FEATURE_FLAGS
drop policy if exists feature_flags_select_enabled on public.feature_flags;
create policy feature_flags_select_enabled
  on public.feature_flags
  for select
  using (enabled = true or public.is_admin_user(auth.uid()));

drop policy if exists feature_flags_admin_manage on public.feature_flags;
create policy feature_flags_admin_manage
  on public.feature_flags
  for all
  to authenticated
  using (public.is_admin_user(auth.uid()))
  with check (public.is_admin_user(auth.uid()));

-- USER_PREFERENCES
drop policy if exists user_preferences_select_own on public.user_preferences;
create policy user_preferences_select_own
  on public.user_preferences
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists user_preferences_insert_own on public.user_preferences;
create policy user_preferences_insert_own
  on public.user_preferences
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists user_preferences_update_own on public.user_preferences;
create policy user_preferences_update_own
  on public.user_preferences
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Helpers chat/moderación.
create or replace function public.is_blocked(user_a uuid, user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_blocks b
    where (b.blocker_id = user_a and b.blocked_id = user_b)
       or (b.blocker_id = user_b and b.blocked_id = user_a)
  )
$$;

create or replace function public.can_message_between(user_a uuid, user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    user_a <> user_b
    and not public.is_blocked(user_a, user_b)
    and exists (
      select 1 from public.matches m
      where m.status = 'active'
        and (
          (m.user1_id = user_a and m.user2_id = user_b)
          or (m.user1_id = user_b and m.user2_id = user_a)
        )
    )
$$;

-- Trigger: crea match automáticamente cuando una interview_request pasa a accepted.
create or replace function public.create_match_on_request_accepted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_to_user_id uuid;
begin
  if new.status = 'accepted' and old.status is distinct from 'accepted' then
    select p.user_id
    into v_to_user_id
    from public.love_cvs c
    join public.profiles p on p.id = c.profile_id
    where c.id = new.to_cv_id;

    if v_to_user_id is null then
      raise exception 'No se encontró dueño del CV destino';
    end if;

    if not public.is_blocked(new.from_user_id, v_to_user_id) then
      insert into public.matches (user1_id, user2_id, initiated_by, interview_request_id, status)
      values (
        least(new.from_user_id, v_to_user_id),
        greatest(new.from_user_id, v_to_user_id),
        new.from_user_id,
        new.id,
        'active'
      )
      on conflict (least(user1_id, user2_id), greatest(user1_id, user2_id))
      do update set status = 'active', updated_at = now();
    end if;
  end if;

  return new;
end;
$$;

-- Trigger: anti-spam + sanitización + moderación básica de mensajes.
create or replace function public.guard_chat_message_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_other_user_id uuid;
  v_count_last_minute int;
  v_match_status text;
begin
  select
    case when m.user1_id = new.sender_id then m.user2_id else m.user1_id end,
    m.status
  into v_other_user_id, v_match_status
  from public.matches m
  where m.id = new.match_id
    and new.sender_id in (m.user1_id, m.user2_id);

  if v_other_user_id is null then
    raise exception 'No autorizado para enviar en este match';
  end if;

  if v_match_status <> 'active' then
    raise exception 'El match no está activo';
  end if;

  if public.is_blocked(new.sender_id, v_other_user_id) then
    raise exception 'No puedes enviar mensajes: existe un bloqueo activo';
  end if;

  select count(*)
  into v_count_last_minute
  from public.chat_messages cm
  where cm.match_id = new.match_id
    and cm.sender_id = new.sender_id
    and cm.created_at >= now() - interval '1 minute';

  if v_count_last_minute >= 15 then
    raise exception 'Límite de mensajes alcanzado: 15 por minuto';
  end if;

  if new.content is not null then
    new.content := trim(public.sanitize_text(new.content));
  end if;

  if exists (
    select 1
    from public.banned_words bw
    where bw.is_active = true
      and new.content is not null
      and lower(new.content) like ('%' || lower(bw.word) || '%')
  ) then
    new.is_flagged := true;
    new.flagged_reason := 'banned_word_match';
  end if;

  return new;
end;
$$;

create or replace function public.is_admin_user(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.user_id = p_user_id and p.is_admin = true
  )
$$;

-- Función GDPR: elimina/anomiza de forma segura los datos de un usuario.
create or replace function public.delete_user_cascade(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if auth.uid() <> p_user_id and not public.is_admin_user(auth.uid()) then
    raise exception 'No autorizado para eliminar este usuario';
  end if;

  -- Anonimizar reportes para preservar trazabilidad estadística sin datos directos.
  update public.reports
  set reporter_id = null,
      description = null
  where reporter_id = p_user_id;

  update public.reports
  set reported_id = null
  where reported_id = p_user_id;

  delete from public.user_consents where user_id = p_user_id;
  delete from public.user_sanctions where user_id = p_user_id;
  delete from public.user_blocks where blocker_id = p_user_id or blocked_id = p_user_id;
  delete from public.chat_hidden_threads where user_id = p_user_id;
  delete from public.matches where user1_id = p_user_id or user2_id = p_user_id;
  delete from public.cv_favorites where user_id = p_user_id;
  delete from public.notifications where user_id = p_user_id;
  delete from public.profile_boosts where user_id = p_user_id;
  delete from public.one_time_purchases where user_id = p_user_id;
  delete from public.user_entitlements where user_id = p_user_id;
  delete from public.subscriptions where user_id = p_user_id;
  delete from public.profiles where user_id = p_user_id;
end;
$$;

-- ============================
-- 6) FUNCIÓN PARA CONTADOR SEGURO
-- ============================

-- Función SECURITY DEFINER para registrar vista evitando exponer lógica directa en cliente.
create or replace function public.increment_profile_view(
  p_cv_id uuid,
  p_ip_hash text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.love_cvs c
    where c.id = p_cv_id and c.visibility = 'public'
  ) then
    raise exception 'CV not found or private';
  end if;

  insert into public.profile_views (cv_id, viewer_id, ip_hash)
  values (
    p_cv_id,
    case when auth.role() = 'authenticated' then auth.uid() else null end,
    case when auth.role() = 'anon' then p_ip_hash else null end
  )
  on conflict do nothing;
end;
$$;

revoke all on function public.increment_profile_view(uuid, text) from public;
grant execute on function public.increment_profile_view(uuid, text) to anon, authenticated;

comment on function public.increment_profile_view(uuid, text)
  is 'Registra una vista del CV público de manera segura (usar desde /api/views/increment).';

-- ============================
-- 7) GDPR BORRADO (helpers)
-- ============================

-- Nota: borrar auth.users en Supabase (admin API) hará cascade en profiles -> love_cvs -> fotos/referencias/vistas.
-- Este helper borra datos del usuario autenticado si se necesita desde SQL.
create or replace function public.delete_my_account_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.profiles where user_id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account_data() from public;
grant execute on function public.delete_my_account_data() to authenticated;

comment on function public.delete_my_account_data() is
  'Elimina datos de negocio del usuario autenticado; luego backend debe eliminar auth.user vía Admin API.';

-- Determina si un usuario tiene plan Pro activo (mensual o anual) y vigente.
create or replace function public.is_pro_user(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.subscriptions s
    where s.user_id = p_user_id
      and s.plan_type in ('pro_monthly', 'pro_yearly')
      and s.status = 'active'
      and (
        s.current_period_end is null
        or s.current_period_end > now()
        or s.cancel_at_period_end = true
      )
  )
$$;

-- Helper para explorar: indica si el CV tiene boost activo ahora.
create or replace function public.has_active_boost(p_cv_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profile_boosts b
    where b.cv_id = p_cv_id
      and b.starts_at <= now()
      and b.expires_at > now()
  )
$$;

revoke all on function public.is_pro_user(uuid) from public;
grant execute on function public.is_pro_user(uuid) to anon, authenticated;

revoke all on function public.has_active_boost(uuid) from public;
grant execute on function public.has_active_boost(uuid) to anon, authenticated;

revoke all on function public.is_blocked(uuid, uuid) from public;
grant execute on function public.is_blocked(uuid, uuid) to authenticated;

revoke all on function public.can_message_between(uuid, uuid) from public;
grant execute on function public.can_message_between(uuid, uuid) to authenticated;

revoke all on function public.is_admin_user(uuid) from public;
grant execute on function public.is_admin_user(uuid) to authenticated;

revoke all on function public.delete_user_cascade(uuid) from public;
grant execute on function public.delete_user_cascade(uuid) to authenticated;
