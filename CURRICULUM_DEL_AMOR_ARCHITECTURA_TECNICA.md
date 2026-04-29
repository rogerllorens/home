# Currículum del Amor — Arquitectura técnica (Fase 1 y 2)

## 1) Diagrama textual de arquitectura

```text
[Browser (Next.js UI)]
   |
   | HTTPS
   v
[Vercel - Next.js App Router]
   |- Route Handlers (/api/*)
   |- Server Actions (mutaciones seguras)
   |- Middleware (protección rutas privadas)
   |
   | supabase-js (SSR + server)
   v
[Supabase]
   |- Auth (usuarios, sesiones, JWT)
   |- PostgreSQL (RLS habilitado)
   |- Storage (bucket photos)
   |- Realtime (futuro chat/notificaciones)

[Servicios futuros]
   |- Stripe (suscripciones/premium)
   |- Resend (emails transaccionales)

[Observabilidad]
   |- Logs Vercel + logs DB
   |- Sentry/PostHog (fase 2.5)
```

Patrón técnico recomendado:
- Lecturas públicas: **Server Components** + consultas seguras a vistas públicas.
- Escrituras: **Server Actions** (por defecto) y Route Handlers cuando:
  - requieres callback/webhook,
  - requieres endpoint compartible,
  - requieres control especial de cache.
- Seguridad de datos delegada en **RLS de Supabase** (no confiar en frontend).

---

## 2) Estructura de carpetas recomendada

```text
src/
  app/
    (public)/
      page.tsx                      # landing
      explorar/page.tsx
      [username]/page.tsx           # perfil público
      u/[username]/page.tsx         # alias opcional
    (auth)/
      login/page.tsx
      registro/page.tsx
      callback/route.ts             # OAuth callback
    (private)/
      dashboard/page.tsx
      cv/editar/page.tsx
      fotos/page.tsx
      ajustes/page.tsx
      ajustes/privacidad/page.tsx
      ajustes/cuenta/page.tsx
    api/
      views/route.ts                # registrar visita
      reports/route.ts              # crear reporte
      photos/sign-upload/route.ts   # signed upload url
      photos/complete/route.ts      # confirmar upload
      username/check/route.ts       # disponibilidad username
      account/delete/route.ts       # borrado cuenta
      webhooks/stripe/route.ts      # futuro
      webhooks/resend/route.ts      # futuro
    layout.tsx
    globals.css
  components/
    ui/                             # shadcn/ui
    forms/
      cv-section-form.tsx
      profile-form.tsx
    profile/
      public-profile-header.tsx
      profile-visit-counter.tsx
    photos/
      photo-uploader.tsx
      photo-grid-editor.tsx
  lib/
    supabase/
      client.ts
      server.ts
      middleware.ts
    auth/
      guard.ts
    validations/
      profile.ts
      cv.ts
      photo.ts
      report.ts
    actions/
      profile.actions.ts
      cv.actions.ts
      photos.actions.ts
      privacy.actions.ts
      account.actions.ts
    db/
      types.ts                      # tipos generados + extendidos
      queries.ts
    security/
      rate-limit.ts
      content-sanitize.ts
  middleware.ts
supabase/
  migrations/
    001_extensions.sql
    002_tables.sql
    003_indexes.sql
    004_rls.sql
    005_policies.sql
    006_triggers.sql
  seeds/
```

---

## 3) Rutas de Next.js

## Públicas
- `GET /` landing
- `GET /explorar` listado de perfiles públicos
- `GET /[username]` perfil público canónico
- `GET /u/[username]` alias opcional
- `GET /login`
- `GET /registro`

## Privadas (requieren sesión)
- `GET /dashboard`
- `GET /cv/editar`
- `GET /fotos`
- `GET /ajustes`
- `GET /ajustes/privacidad`
- `GET /ajustes/cuenta`

## API Routes / Route Handlers
- `POST /api/views` registrar visita anti-abuso
- `POST /api/reports` crear reporte
- `GET /api/username/check?username=x`
- `POST /api/photos/sign-upload`
- `POST /api/photos/complete`
- `POST /api/account/delete`
- `POST /api/webhooks/stripe` (futuro)

---

## 4) SQL completo para crear tablas

```sql
-- 001_extensions.sql
create extension if not exists pgcrypto;
create extension if not exists citext;

-- 002_tables.sql
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  username citext not null unique,
  display_name varchar(60) not null,
  birthdate date null,
  age_range varchar(20) null,
  city varchar(80) not null,
  country char(2) not null,
  gender varchar(30) null,
  orientation varchar(30) null,
  intention varchar(30) not null,
  emotional_status varchar(30) not null,
  bio_short varchar(180) not null,
  avatar_url text null,
  is_public boolean not null default true,
  is_completed boolean not null default false,
  allow_messages boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null,
  constraint profiles_birth_or_age check (birthdate is not null or age_range is not null),
  constraint username_format check (username ~ '^[a-z0-9_]{3,30}$')
);

create table if not exists public.love_cvs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  headline varchar(120) not null,
  applying_for varchar(120) not null,
  about_me text not null,
  emotional_experience text not null,
  affective_skills text[] not null default '{}',
  green_flags text[] not null default '{}',
  soft_red_flags text[] not null default '{}',
  love_languages text[] not null default '{}',
  ideal_date text null,
  availability varchar(80) null,
  fun_fact varchar(180) null,
  final_cta varchar(160) null,
  completion_score smallint not null default 0,
  published_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cv_sections (
  id uuid primary key default gen_random_uuid(),
  cv_id uuid not null references public.love_cvs(id) on delete cascade,
  section_key varchar(40) not null,
  title varchar(80) not null,
  content jsonb not null,
  visibility varchar(20) not null default 'public',
  position smallint not null,
  is_required boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (cv_id, section_key),
  constraint cv_sections_visibility check (visibility in ('public','registered','private'))
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  url text not null,
  storage_path text not null unique,
  position smallint not null default 0,
  is_primary boolean not null default false,
  visibility varchar(20) not null default 'public',
  moderation_status varchar(20) not null default 'pending',
  blurhash varchar(100) null,
  created_at timestamptz not null default now(),
  constraint photos_visibility check (visibility in ('public','private')),
  constraint photos_moderation check (moderation_status in ('pending','approved','rejected')),
  unique (profile_id, position)
);

create table if not exists public.profile_views (
  id bigserial primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  viewer_user_id uuid null references auth.users(id) on delete set null,
  viewer_hash varchar(128) not null,
  source varchar(30) not null default 'direct',
  viewed_at timestamptz not null default now(),
  ua text null,
  referrer text null
);

create table if not exists public.references (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  author_user_id uuid null references auth.users(id) on delete set null,
  relation_type varchar(30) not null,
  body text not null,
  visibility varchar(20) not null default 'private',
  moderation_status varchar(20) not null default 'pending',
  created_at timestamptz not null default now(),
  constraint references_visibility check (visibility in ('public','private','match_only')),
  constraint references_moderation check (moderation_status in ('pending','approved','rejected'))
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  reported_profile_id uuid not null references public.profiles(id) on delete cascade,
  reason_code varchar(40) not null,
  details text null,
  status varchar(20) not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz null,
  constraint reports_status check (status in ('open','reviewing','resolved','rejected'))
);

create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_user_id uuid not null references auth.users(id) on delete cascade,
  blocked_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_user_id, blocked_user_id),
  constraint blocks_no_self check (blocker_user_id <> blocked_user_id)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id varchar(120) null unique,
  stripe_subscription_id varchar(120) null unique,
  plan_code varchar(30) not null default 'free',
  status varchar(20) not null default 'inactive',
  current_period_start timestamptz null,
  current_period_end timestamptz null,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.story_exports (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete cascade,
  format varchar(20) not null default '9:16',
  status varchar(20) not null default 'pending',
  output_url text null,
  created_at timestamptz not null default now(),
  completed_at timestamptz null,
  constraint story_exports_status check (status in ('pending','processing','done','failed'))
);

create table if not exists public.username_reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  username citext not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.rate_limits (
  id bigserial primary key,
  bucket varchar(40) not null,
  actor_hash varchar(128) not null,
  hits integer not null default 1,
  window_start timestamptz not null,
  window_end timestamptz not null,
  unique(bucket, actor_hash, window_start)
);
```

---

## 5) SQL completo para crear índices

```sql
-- 003_indexes.sql
create index if not exists idx_profiles_public_username
  on public.profiles (is_public, username);

create index if not exists idx_profiles_country_city
  on public.profiles (country, city);

create index if not exists idx_love_cvs_profile
  on public.love_cvs (profile_id);

create index if not exists idx_cv_sections_cv_position
  on public.cv_sections (cv_id, position);

create index if not exists idx_photos_profile_position
  on public.photos (profile_id, position);

create index if not exists idx_photos_profile_primary
  on public.photos (profile_id, is_primary)
  where is_primary = true;

create index if not exists idx_profile_views_profile_time
  on public.profile_views (profile_id, viewed_at desc);

create index if not exists idx_profile_views_dedup
  on public.profile_views (profile_id, viewer_hash, viewed_at desc);

create index if not exists idx_reports_reported_status
  on public.reports (reported_profile_id, status, created_at desc);

create index if not exists idx_blocks_blocker
  on public.blocks (blocker_user_id);

create index if not exists idx_subscriptions_user_status
  on public.subscriptions (user_id, status);

create index if not exists idx_story_exports_profile_status
  on public.story_exports (profile_id, status, created_at desc);

create index if not exists idx_username_reservations_exp
  on public.username_reservations (expires_at);
```

---

## 6) SQL completo para activar RLS

```sql
-- 004_rls.sql
alter table public.profiles enable row level security;
alter table public.love_cvs enable row level security;
alter table public.cv_sections enable row level security;
alter table public.photos enable row level security;
alter table public.profile_views enable row level security;
alter table public.references enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;
alter table public.subscriptions enable row level security;
alter table public.story_exports enable row level security;
alter table public.username_reservations enable row level security;
alter table public.rate_limits enable row level security;
```

---

## 7) SQL completo para políticas RLS

```sql
-- 005_policies.sql

-- PROFILES
create policy "public can read public profiles"
on public.profiles for select
using (is_public = true and deleted_at is null);

create policy "owner can read own profile"
on public.profiles for select
to authenticated
using (auth.uid() = user_id);

create policy "owner can insert own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = user_id);

create policy "owner can update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "owner can delete own profile"
on public.profiles for delete
to authenticated
using (auth.uid() = user_id);

-- LOVE_CVS
create policy "public can read cv of public profile"
on public.love_cvs for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = love_cvs.profile_id and p.is_public = true and p.deleted_at is null
  )
);

create policy "owner can manage own cv"
on public.love_cvs for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = love_cvs.profile_id and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = love_cvs.profile_id and p.user_id = auth.uid()
  )
);

-- CV_SECTIONS
create policy "public can read public sections of public profile"
on public.cv_sections for select
using (
  visibility = 'public' and exists (
    select 1
    from public.love_cvs c
    join public.profiles p on p.id = c.profile_id
    where c.id = cv_sections.cv_id and p.is_public = true and p.deleted_at is null
  )
);

create policy "authenticated can read registered sections"
on public.cv_sections for select
to authenticated
using (
  visibility in ('public','registered') and exists (
    select 1
    from public.love_cvs c
    join public.profiles p on p.id = c.profile_id
    where c.id = cv_sections.cv_id and p.is_public = true and p.deleted_at is null
  )
);

create policy "owner can manage own sections"
on public.cv_sections for all
to authenticated
using (
  exists (
    select 1 from public.love_cvs c
    join public.profiles p on p.id = c.profile_id
    where c.id = cv_sections.cv_id and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.love_cvs c
    join public.profiles p on p.id = c.profile_id
    where c.id = cv_sections.cv_id and p.user_id = auth.uid()
  )
);

-- PHOTOS
create policy "public can read approved public photos of public profile"
on public.photos for select
using (
  visibility = 'public' and moderation_status = 'approved' and exists (
    select 1 from public.profiles p
    where p.id = photos.profile_id and p.is_public = true and p.deleted_at is null
  )
);

create policy "owner can read own photos"
on public.photos for select
to authenticated
using (owner_id = auth.uid());

create policy "owner can insert own photos"
on public.photos for insert
to authenticated
with check (owner_id = auth.uid());

create policy "owner can update own photos"
on public.photos for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "owner can delete own photos"
on public.photos for delete
to authenticated
using (owner_id = auth.uid());

-- PROFILE_VIEWS
create policy "owner can read own profile views"
on public.profile_views for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = profile_views.profile_id and p.user_id = auth.uid()
  )
);

create policy "service role can insert views"
on public.profile_views for insert
to authenticated
with check (true);

-- REFERENCES
create policy "public can read approved public references"
on public.references for select
using (
  visibility = 'public' and moderation_status = 'approved' and exists (
    select 1 from public.profiles p
    where p.id = references.profile_id and p.is_public = true and p.deleted_at is null
  )
);

create policy "owner can manage references on own profile"
on public.references for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = references.profile_id and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = references.profile_id and p.user_id = auth.uid()
  )
);

-- REPORTS
create policy "auth can create reports"
on public.reports for insert
to authenticated
with check (reporter_user_id = auth.uid());

create policy "reporter can read own reports"
on public.reports for select
to authenticated
using (reporter_user_id = auth.uid());

-- BLOCKS
create policy "owner can manage own blocks"
on public.blocks for all
to authenticated
using (blocker_user_id = auth.uid())
with check (blocker_user_id = auth.uid());

-- SUBSCRIPTIONS
create policy "owner can read own subscription"
on public.subscriptions for select
to authenticated
using (user_id = auth.uid());

create policy "owner can insert own subscription shell"
on public.subscriptions for insert
to authenticated
with check (user_id = auth.uid());

create policy "owner can update own subscription"
on public.subscriptions for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- STORY_EXPORTS
create policy "owner can manage own story exports"
on public.story_exports for all
to authenticated
using (
  requested_by = auth.uid() and exists (
    select 1 from public.profiles p where p.id = story_exports.profile_id and p.user_id = auth.uid()
  )
)
with check (
  requested_by = auth.uid() and exists (
    select 1 from public.profiles p where p.id = story_exports.profile_id and p.user_id = auth.uid()
  )
);

-- USERNAME_RESERVATIONS
create policy "owner can manage own username reservations"
on public.username_reservations for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- RATE_LIMITS (only backend/service should use; deny direct by default)
create policy "nobody direct access rate_limits"
on public.rate_limits for all
to authenticated
using (false)
with check (false);
```

Nota: para `profile_views` y `rate_limits`, en producción conviene escribir con **service role** desde Route Handlers (no desde cliente) para reforzar anti abuso.

---

## 8) Tipos TypeScript principales

```ts
export type Visibility = 'public' | 'registered' | 'private'
export type ModerationStatus = 'pending' | 'approved' | 'rejected'
export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'rejected'

export interface Profile {
  id: string
  user_id: string
  username: string
  display_name: string
  birthdate: string | null
  age_range: string | null
  city: string
  country: string
  gender: string | null
  orientation: string | null
  intention: string
  emotional_status: string
  bio_short: string
  avatar_url: string | null
  is_public: boolean
  is_completed: boolean
  allow_messages: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface LoveCV {
  id: string
  profile_id: string
  headline: string
  applying_for: string
  about_me: string
  emotional_experience: string
  affective_skills: string[]
  green_flags: string[]
  soft_red_flags: string[]
  love_languages: string[]
  ideal_date: string | null
  availability: string | null
  fun_fact: string | null
  final_cta: string | null
  completion_score: number
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface Photo {
  id: string
  owner_id: string
  profile_id: string
  url: string
  storage_path: string
  position: number
  is_primary: boolean
  visibility: 'public' | 'private'
  moderation_status: ModerationStatus
  blurhash: string | null
  created_at: string
}

export interface ProfileViewEvent {
  profile_id: string
  viewer_user_id: string | null
  viewer_hash: string
  source: 'direct' | 'explore' | 'share' | 'other'
  ua?: string
  referrer?: string
}
```

---

## 9) Validaciones Zod principales

```ts
import { z } from 'zod'

export const usernameSchema = z
  .string()
  .min(3)
  .max(30)
  .regex(/^[a-z0-9_]+$/)

export const profileSchema = z.object({
  display_name: z.string().min(2).max(60),
  username: usernameSchema,
  birthdate: z.string().date().optional().nullable(),
  age_range: z.string().max(20).optional().nullable(),
  city: z.string().min(2).max(80),
  country: z.string().length(2),
  gender: z.string().max(30).optional().nullable(),
  orientation: z.string().max(30).optional().nullable(),
  intention: z.enum(['serious', 'casual', 'friendship', 'open']),
  emotional_status: z.enum(['single', 'healing', 'open_to_connect']),
  bio_short: z.string().min(20).max(180),
  is_public: z.boolean(),
}).refine(v => !!v.birthdate || !!v.age_range, {
  message: 'birthdate o age_range es obligatorio'
})

export const loveCvSchema = z.object({
  headline: z.string().min(10).max(120),
  applying_for: z.string().min(5).max(120),
  about_me: z.string().min(80).max(3000),
  emotional_experience: z.string().min(40).max(3000),
  affective_skills: z.array(z.string().min(2).max(40)).max(12),
  green_flags: z.array(z.string().min(2).max(60)).min(3).max(12),
  soft_red_flags: z.array(z.string().min(2).max(60)).min(1).max(12),
  love_languages: z.array(z.string().min(2).max(40)).min(1).max(5),
  ideal_date: z.string().max(500).optional().nullable(),
  availability: z.string().max(80).optional().nullable(),
  fun_fact: z.string().max(180).optional().nullable(),
  final_cta: z.string().max(160).optional().nullable(),
})

export const photoInputSchema = z.object({
  profile_id: z.string().uuid(),
  storage_path: z.string().min(10).max(512),
  position: z.number().int().min(0).max(20),
  is_primary: z.boolean().default(false),
  visibility: z.enum(['public', 'private'])
})

export const reportSchema = z.object({
  reported_profile_id: z.string().uuid(),
  reason_code: z.enum(['spam', 'harassment', 'nudity', 'hate', 'fake', 'other']),
  details: z.string().max(2000).optional().nullable()
})
```

---

## 10) Explicación de cada tabla (resumen)

- `profiles`: identidad pública, privacidad, discoverability.
- `love_cvs`: contenido principal del CV amoroso en columnas útiles para búsqueda.
- `cv_sections`: flexibilidad para bloques custom/futuros experimentos A/B.
- `photos`: galería con moderación y visibilidad por foto.
- `profile_views`: analítica de visitas anti-abuso por `viewer_hash`.
- `references`: referencias sociales moderables.
- `reports`: sistema de safety/reporting.
- `blocks`: bloqueo bilateral desde perspectiva del bloqueador.
- `subscriptions`: estado premium preparado para Stripe.
- `story_exports`: cola/resultado de export vertical 9:16.
- `username_reservations`: evita carrera en onboarding multi-paso.
- `rate_limits`: base para control server-side de abuso.

---

## 11) Explicación de políticas RLS (resumen)

- **Lectura pública estricta:** solo perfiles `is_public=true` y no borrados.
- **Escritura por dueño:** toda tabla de contenido exige `auth.uid()==owner` directa o vía join.
- **Fotos públicas:** además de públicas, deben estar `approved`.
- **Reportes:** cualquier autenticado puede crear, solo ve los suyos.
- **Bloqueos/suscripción/exports:** dueño gestiona su propio dato.
- **Rate limits:** sin acceso directo del cliente (solo backend/service role).

---

## 12) Flujos técnicos

## Registro
1. Usuario crea cuenta con Supabase Auth.
2. Callback crea sesión SSR.
3. En primer acceso, crear `profiles` mínimo + `subscriptions(plan=free)`.
4. Reservar username (opcional) en `username_reservations`.

## Creación de CV
1. Form wizard valida con Zod.
2. Server Action upsert a `love_cvs`.
3. Opcional: persistir bloques en `cv_sections`.
4. Calcular `completion_score`.

## Edición
1. Carga server-side del `profile` y `cv` del usuario.
2. Submit vía Server Action.
3. Update transaccional + `updated_at`.

## Subida de foto
1. Cliente solicita `sign-upload` con metadatos.
2. Server valida owner/profile.
3. Server devuelve signed URL de Supabase Storage.
4. Cliente sube binario al bucket.
5. Cliente llama `photos/complete` para insertar registro en `photos`.
6. Trigger asegura una sola `is_primary=true` por perfil.

## Visualización pública
1. Route `/[username]` busca profile público.
2. Render con CV + fotos aprobadas.
3. Llama `/api/views` async (fire-and-forget).

## Contador de visitas
1. `/api/views` calcula `viewer_hash` (IP truncada + UA hash + salt rotativo diario).
2. Inserta solo si no existe visita reciente (ej: 1 por 12h por profile+viewer_hash).
3. Vista agregada: `count(*)` en ventana temporal.

## Borrado de cuenta
1. Usuario confirma contraseña/reautenticación.
2. Server Action marca `profiles.deleted_at` + `is_public=false` inmediato.
3. Job elimina fotos de storage.
4. Hard delete de tablas owner-linked en 30 días (o inmediato por política).
5. Eliminar user en `auth.users` (admin API).

---

## 13) Edge cases técnicos

1. Colisión de username simultánea → manejar con `username_reservations` + unique.
2. Usuario elimina cuenta con exports en proceso.
3. Cambio de username rompe links anteriores → crear tabla de aliases futuro.
4. Perfil privado con fotos públicas heredadas → consulta debe filtrar por perfil público + foto aprobada.
5. Spam de vistas desde bots.
6. Report brigading coordinado.
7. Race condition al cambiar foto principal.
8. Usuario bloqueado intenta reportar o ver contenido.
9. Datos parciales en onboarding (perfil incompleto).
10. Moderación rechaza avatar primario sin fallback.

---

## 14) Recomendaciones de seguridad

- RLS + tests automáticos de políticas por tabla.
- Nunca usar `service_role` en cliente.
- Rate limit por IP+user para `/api/views`, `/api/reports`, `/api/photos/*`.
- Sanitizar texto contra XSS antes de renderizar.
- CSP estricto en Next.js.
- Reautenticación para borrar cuenta.
- Audit log de acciones críticas (delete/report/block).
- Bucket de fotos privado por defecto y signed delivery para privadas.
- Moderación async con cuarentena (`pending`) antes de publicar.

---

## 15) Checklist pre-producción

- [ ] Migraciones aplican en entorno limpio.
- [ ] RLS habilitado en todas las tablas de dominio.
- [ ] Tests de políticas (owner, no-owner, anon).
- [ ] Validaciones Zod espejadas con constraints SQL.
- [ ] Protección CSRF en mutaciones sensibles.
- [ ] Rate limit activo en rutas de abuso.
- [ ] Rotación de secrets (Supabase, Vercel, JWT).
- [ ] Backup + restore test PostgreSQL.
- [ ] Política de retención y borrado documentada.
- [ ] Monitoreo de errores y alertas 5xx.
- [ ] Runbook de incidentes (abuso, fuga, spam).

