# Currículum del Amor — Product Definition v1.0

## 1) Visión del producto

### Posicionamiento
**Currículum del Amor** es una **web app social-first** donde las personas construyen un perfil emocional estructurado (no solo fotos), lo comparten en stories y pueden activar modo “conocer gente” para evolucionar a red social/dating.

**Tagline:** “No swipes. Contexto real.”

### Diferenciación vs Tinder, Bumble, Hinge
- **Input más rico desde el minuto 1:** aquí el core no es “like a foto”, sino un CV emocional con secciones guiadas, validaciones y referencias.
- **Distribución externa nativa:** el objeto principal está pensado para ser compartido fuera de la app (Instagram/TikTok/WhatsApp), no solo consumo interno.
- **Prueba social estructurada:** “referencias” (amigos/compañeros/ex) moderadas y visibles por nivel de privacidad.
- **Modo dual:**
  - **Modo CV público** (marca personal emocional)
  - **Modo Dating** (descubrimiento y matching)
- **Menos fatiga de swipe:** exploración por compatibilidad narrativa + filtros de valores, no sólo proximidad/foto.

### Propuesta de valor
1. **Para usuarios:** “Me presento en serio en 3 minutos sin parecer un CV frío.”
2. **Para viewers:** “Entiendo rápido si hay fit real, más allá de estética.”
3. **Para creadores/virales:** “Plantilla compartible + score de completitud + badges.”

---

## 2) Arquitectura de pantallas (UX Flow completo)

## Mapa principal
1. Landing pública
2. Auth (email/Google/Apple)
3. Onboarding (objetivo + privacidad + estilo)
4. Builder CV (wizard)
5. Preview + publicar
6. Perfil público
7. Explorar perfiles
8. Interacciones (like, mensaje, solicitud)
9. Monetización (paywall, boosts, créditos)
10. Settings & privacidad

## Flujo paso a paso

### A. Landing → Registro
- **Pantalla:** Hero + ejemplos de CV + CTA “Crear mi CV del Amor”.
- **CTA secundario:** “Ver ejemplos reales”.
- **Estado loading:** skeleton cards de ejemplos.
- **Estado error:** banner “No pudimos cargar ejemplos. Reintentar”.

### B. Auth
- Opciones: Google, Apple, Email magic link.
- **Paso legal explícito:** checkbox términos + privacidad + edad mínima.
- **Error:** email inválido, token expirado, cuenta bloqueada.

### C. Onboarding (4 pasos)
1. **Objetivo** (amistad, dating serio, abierto, networking social).
2. **Visibilidad inicial** (público con link / sólo usuarios / privado borrador).
3. **Tono de perfil** (romántico, directo, divertido, minimal).
4. **Import inicial** (IG bio/manual).

**Estados:**
- Vacío: botones disabled hasta selección.
- Error: “Debes elegir al menos un objetivo”.
- Loading: guardado automático entre pasos.

### D. Builder CV (wizard de 8 módulos)
1. Identidad
2. “Sobre mí” narrativo
3. Estilo de relación
4. Valores y límites
5. Plan de vida
6. Red flags / green flags
7. Media (fotos/video/audio)
8. Referencias

- Barra de progreso + score de completitud.
- Guardado automático.
- IA opcional para mejorar copy (premium limitado).

**Estados:**
- Vacío: placeholders con ejemplos concretos.
- Error: validación inline por campo.
- Loading: autosave con estado “Guardando…/Guardado”.

### E. Preview + Publicar
- Vista móvil y tarjeta story 9:16 descargable.
- Selector de privacidad por sección.
- Publicar con slug personalizado.

### F. Perfil público
- Header (nombre, edad opcional, ciudad aproximada, objetivo)
- Secciones del CV en bloques.
- CTA: “Me interesa”, “Enviar mensaje”, “Compartir”.
- Indicadores de confianza: verificado, referencias aprobadas, perfil completo.

### G. Explorar
- Feed por compatibilidad + filtros.
- Vista tarjeta rápida + vista detallada.
- Filtros premium avanzados (valores, hábitos, intención temporal).

### H. Interacción
- Like simple.
- “Interés argumentado” (mensaje corto obligatorio, reduce spam).
- Chat desbloqueado si interés mutuo o crédito.
- Solicitud de referencia a tercero.

### I. Monetización
- Pantalla paywall contextual:
  - tras X likes diarios,
  - al usar filtros avanzados,
  - al ver analytics detallado.
- Tienda de créditos para boosts y mensajes directos.

### J. Settings
- Cuenta
- Privacidad y visibilidad
- Seguridad (bloqueos/reportes)
- Suscripción y facturación
- Exportar/eliminar datos

---

## 3) Estructura del currículum (detallada)

## Sección 1. Identidad (obligatoria)
- display_name* (obligatorio)
- pronouns (opcional)
- edad_rango* (obligatorio; no fecha completa pública)
- ubicación_aprox* (obligatorio; ciudad/área)
- idiomas (opcional)
- foto_principal* (obligatoria)

**Copy guía:** “Así te gustaría que te conozcan en 10 segundos.”

## Sección 2. Sobre mí (obligatoria)
- bio_corta* (140 chars)
- bio_larga* (500 chars)
- “mi plan ideal de domingo” (opcional)

## Sección 3. Estilo de relación (obligatoria)
- intención* (serio/casual/abierto/amistad)
- ritmo_preferido* (lento/medio/rápido)
- lenguaje_afectivo (multiselect)
- convivencia_futura (sí/no/depende)

## Sección 4. Valores y límites (obligatoria)
- top_5_valores* (multiselect + orden)
- límites_no_negociables* (texto + tags)
- hábitos (tabaco/alcohol/deporte/sueño)

## Sección 5. Vida práctica (opcional fuerte)
- profesión_sector
- estabilidad_geográfica
- deseo_familia
- finanzas_estilo (ahorro/gasto balanceado)

## Sección 6. Compatibilidad express (obligatoria)
- green_flags* (3 mín)
- red_flags* (3 mín)
- “si conectamos, primer plan”*

## Sección 7. Media (obligatoria parcial)
- 3–6 fotos* (mín 3)
- 1 video corto (opcional)
- 1 audio intro 20s (opcional, alta conversión)

## Sección 8. Referencias (opcional verificada)
- tipo_referencia (amistad, laboral, ex-pareja)
- texto referencia
- visibilidad (privada/moderada/pública)
- estado moderación

## Tono editorial global
- Claro, humano, cero vergüenza.
- Prohibido tono corporativo.
- Microcopys empáticos: “No buscamos perfección; buscamos honestidad.”

---

## 4) Modelo de negocio

## Free
- Crear CV ilimitado.
- Compartir link público.
- 10 likes/día.
- 3 filtros básicos.

## Premium Plus (suscripción)
- Likes ilimitados.
- Filtros avanzados por valores/hábitos/objetivos.
- Analytics (quién vio, retención de perfil, CTR de secciones).
- IA para optimizar copy (X usos/mes).
- Modo invisible selectivo.

**Pricing sugerido (US/EU benchmark):**
- Mensual: 14.99 USD
- Trimestral: 29.99 USD
- Anual: 79.99 USD

## Micropagos (créditos)
- 5 USD = 5 créditos
- Usos:
  - Boost 24h: 2 créditos
  - Mensaje directo sin match: 1 crédito
  - Revisión premium de perfil: 3 créditos

## Hipótesis de conversión (12 meses)
- Registro→CV publicado: 55%
- CV publicado→share externo: 35%
- Share→nuevos registros (k-factor parcial): 0.25
- Free→Premium: 3–6%
- Compras de créditos en free: 4–8%

Riesgo: si el producto parece “demasiado serio”, baja activación.
Mitigación: plantillas por tono (fun/serio) + ejemplos aspiracionales.

---

## 5) Base de datos (SQL real)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email CITEXT UNIQUE NOT NULL,
  password_hash TEXT NULL,
  auth_provider VARCHAR(20) NOT NULL DEFAULT 'magic_link',
  is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  birth_date DATE NOT NULL,
  country_code CHAR(2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ NULL
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug VARCHAR(60) UNIQUE NOT NULL,
  display_name VARCHAR(60) NOT NULL,
  pronouns VARCHAR(30),
  age_range VARCHAR(20) NOT NULL,
  city VARCHAR(80) NOT NULL,
  bio_short VARCHAR(140) NOT NULL,
  bio_long TEXT NOT NULL,
  relationship_intent VARCHAR(20) NOT NULL,
  visibility VARCHAR(20) NOT NULL DEFAULT 'public_link',
  is_discoverable BOOLEAN NOT NULL DEFAULT TRUE,
  completion_score SMALLINT NOT NULL DEFAULT 0,
  verified_level SMALLINT NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cv_sections (
  id UUID PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  section_key VARCHAR(40) NOT NULL,
  content JSONB NOT NULL,
  visibility VARCHAR(20) NOT NULL DEFAULT 'public',
  sort_order SMALLINT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, section_key)
);

CREATE TABLE photos (
  id UUID PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  storage_url TEXT NOT NULL,
  blurhash VARCHAR(100),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  moderation_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  sort_order SMALLINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE references (
  id UUID PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  ref_type VARCHAR(20) NOT NULL,
  text_body TEXT NOT NULL,
  visibility VARCHAR(20) NOT NULL DEFAULT 'private',
  moderation_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE profile_views (
  id BIGSERIAL PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewer_user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  source VARCHAR(30) NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  dwell_seconds SMALLINT NULL
);
CREATE INDEX idx_profile_views_profile_time ON profile_views(profile_id, viewed_at DESC);

CREATE TABLE interactions (
  id UUID PRIMARY KEY,
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interaction_type VARCHAR(20) NOT NULL,
  payload JSONB NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'sent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(from_user_id, to_user_id, interaction_type)
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(20) NOT NULL,
  provider_subscription_id VARCHAR(120) UNIQUE NOT NULL,
  plan_code VARCHAR(30) NOT NULL,
  status VARCHAR(20) NOT NULL,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reports (
  id UUID PRIMARY KEY,
  reporter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason_code VARCHAR(30) NOT NULL,
  details TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ NULL
);

CREATE TABLE blocks (
  id UUID PRIMARY KEY,
  blocker_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(blocker_user_id, blocked_user_id)
);
```

## Relaciones clave
- 1 user : 1..n profiles (permite perfiles temáticos a futuro, hoy restringir a 1 activo por negocio).
- 1 profile : n cv_sections / photos / references / profile_views.
- users se relaciona con interacciones, suscripciones, reportes y bloqueos.

---

## 6) Permisos y privacidad (GDPR básico)

## Matriz público/privado
- Público por defecto: display_name, foto principal, bio corta, intención.
- Público opcional: valores, green/red flags.
- Privado por defecto: email, fecha nacimiento completa, analytics sensibles.
- “Solo match”: contacto extendido, referencias detalladas.

## Controles de visibilidad
- Nivel perfil: público link / solo usuarios / privado.
- Nivel sección: público / sólo registrados / sólo match.
- Modo invisible: navegar sin aparecer en vistas (premium).

## GDPR mínimo viable (EU-ready)
- Consentimiento explícito para procesamiento de datos sensibles relacionales.
- Derecho de acceso: export JSON/CSV desde settings.
- Derecho al olvido: hard delete diferido (30 días de gracia, luego purga).
- Minimización: fecha nacimiento solo para age-gating, no pública.
- Retención:
  - logs seguridad: 12 meses,
  - reportes moderación: 24 meses,
  - cuenta eliminada: anonimizar interacciones en 30 días.

## Riesgos y mitigación
- **Doxxing:** mostrar ubicación aproximada, no exacta.
- **Acoso:** mensajes sin match limitados con créditos + rate limit + bloqueo 1 clic.
- **Difamación en referencias:** moderación automática + revisión humana en flags.

---

## 7) Diseño visual

## Dirección estética
- **Premium editorial + social nativo.**
- Layout limpio, tipografía protagonista, tarjetas con fuerte jerarquía.
- Dual theme: light (default) y dark elegante.

## UI tokens propuestos
- Tipografías:
  - Display: `Instrument Serif` (titulares emocionales)
  - UI: `Inter` (legibilidad)
- Paleta:
  - Primary: `#FF4D6D` (romántico moderno)
  - Accent: `#7B61FF` (digital premium)
  - Neutral light bg: `#FFF8F9`
  - Neutral dark bg: `#121217`
  - Success trust: `#1F9D72`
- Radios: 16px tarjetas, 999px pills.
- Sombra: suave, editorial (no neumorphism).

## Sensación emocional buscada
“Intimidad segura + aspiracional.”
No look “hookup agresivo”; sí “cuidado y autenticidad”.

---

## 8) Arquitectura técnica

## Stack recomendado
- **Frontend web:** Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui.
- **Mobile wrapper opcional:** React Native WebView o PWA instalable para MVP.
- **Backend:** NestJS (TypeScript) modular monolith (Auth, Profile, Match, Billing, Moderation).
- **DB:** PostgreSQL 16 + Prisma ORM.
- **Cache/queues:** Redis (BullMQ para colas de moderación, emails, analytics).
- **Storage media:** S3-compatible + CDN (CloudFront/Cloudflare R2).
- **Realtime/chat:** WebSockets (Socket.IO) o Ably/Pusher para acelerar MVP.

## APIs
- REST público para perfil/descubrimiento.
- REST privado para edición y billing.
- Webhooks Stripe para suscripciones y eventos de pago.
- Servicio de moderación:
  - sync (bloqueo inmediato contenido crítico)
  - async (revisión secundaria)

## Seguridad y compliance
- JWT short-lived + refresh tokens rotativos.
- Rate limiting por IP/user/device.
- Hash Argon2id.
- Cifrado en tránsito (TLS) y at-rest (DB + bucket).
- Auditoría de acciones sensibles (admin/moderación).

## Deploy
- Vercel (frontend) + Fly.io/Render/AWS ECS (backend).
- PostgreSQL administrado (Neon/RDS/Supabase).
- Entornos: dev/staging/prod.
- CI/CD: GitHub Actions (test, lint, migration check, deploy).

## Observabilidad
- Logs estructurados (pino).
- Métricas: activación onboarding, publish rate, share rate, match rate, report rate.
- Error tracking: Sentry.
- Product analytics: PostHog/Amplitude.

---

## Problemas críticos detectados y soluciones

1. **Riesgo de baja densidad inicial (marketplace vacío).**
   - Solución: foco geográfico por ciudad, campañas con creators locales, “modo público CV” antes de dating full.
2. **Riesgo legal por contenido sensible y referencias de terceros.**
   - Solución: consentimiento granular, TOS claro, moderación + derecho de réplica/eliminación.
3. **Riesgo de mala calidad de perfiles (spam/low effort).**
   - Solución: score mínimo para ser discoverable + fricción positiva (campos obligatorios narrativos).
4. **Riesgo de monetizar demasiado pronto y romper viralidad.**
   - Solución: paywall contextual después de valor demostrado (no en signup).

---

## MVP en 12 semanas (ejecutable)
- Semana 1–2: Auth, profile base, schema DB, landing.
- Semana 3–4: CV builder, publicación, share card.
- Semana 5–6: feed exploración + likes + match.
- Semana 7–8: chat básico + bloqueos/reportes + moderación v1.
- Semana 9–10: Stripe + premium + créditos.
- Semana 11: analytics + experiment framework.
- Semana 12: hardening seguridad + GDPR ops + beta cerrada.

**Definición de éxito MVP (90 días post-lanzamiento):**
- 10k registros,
- >45% publish rate,
- >30% share externo,
- >15% interacción recibida en perfiles publicados,
- report rate <2% de DAU.
