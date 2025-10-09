# Plataforma social tokenizada - Plan de producto y arquitectura v1

## 1. Resumen ejecutivo
Plataforma web enfocada en interacciones 1:1 y grupos pequeños, monetizada a través de una moneda virtual (TKN). Se prioriza coste operativo ultra-bajo (frontend estático en Cloudflare Pages, backend monolítico en 1 VPS, almacenamiento en S3 económico) y fricción mínima para usuarios adultos (+18). No se implementan lives masivos ni grabaciones en v1.

## 2. Objetivos de la versión inicial (v1)
- Chat aleatorio 1:1 y en grupos (máx. 6 personas) con envío de regalos.
- Perfiles con feed público y contenidos PPV (pago por vista) o restringidos a pase de 30 días.
- Foro estilo LPSG con categorías, hilos y posts con media.
- Economía de tokens TKN para todas las transacciones (regalos, PPV, pases, tickets VIP, pago por minuto).
- Modo invitado con migración de saldo a cuenta registrada.
- Registro básico (email/usuario + password) y SSO (Google/Apple) cuando las políticas lo permitan.
- Sistema de reportes, baneos/shadowban y cumplimiento legal (TOS, Privacidad, Notice & Action).

### Fuera de alcance v1
- Streaming masivo tipo TikTok.
- Grabación de streams.
- Suscripciones bancarias recurrentes (se usa pase de 30 días tokenizado).
- Moderación automática con IA.

## 3. Roles y estados de sesión
| Rol/Estado | Scope JWT | Capacidades clave |
|------------|-----------|-------------------|
| Invitado | `scope:"guest"` | Acceder a `/match`, feeds públicos, foro, comprar y gastar tokens (regalos/PPV/pases), migrar saldo al registrarse. |
| Usuario registrado | `scope:"user"` | Todo lo del invitado + publicar posts/media, fijar precios PPV/pases, abrir hilos en foro, activar pago por minuto en 1:1. |
| Admin/Moderador | `scope:"admin"` (admin) / `scope:"mod"` (moderador) | Admin tiene acceso completo a finanzas y flags; moderador comunitario gestiona reportes/hilos sin tocar payouts ni flags críticos. |

SSO (Google/Apple) opcional según políticas +18; siempre disponible login base email/usuario + password.

### Payouts
- `FEATURE_PAYOUTS=true`: usuarios que reciben tokens acumulan ganancias.
- Flag `PAYOUTS_REQUIRE_KYC` inicialmente `false`, pero arquitectura preparada para activarlo (flujos de verificación previos al retiro).

## 4. Feature flags (configuración build/runtime)
| Flag | Estado v1 | Impacto |
|------|-----------|---------|
| `FEATURE_GUEST` | true | Permite sesiones invitado, compra/gasto de tokens y migración a cuenta. |
| `FEATURE_GROUPS` | true | Activa salas grupales (≤6) y tickets VIP. |
| `FEATURE_FORUM` | true | Habilita foro tipo LPSG. |
| `FEATURE_PASSES` | true | Permite pase de 30 días por perfil. |
| `FEATURE_SSO` | true | Muestra opciones SSO. |
| `FEATURE_LIVE` | false | Oculta UI y endpoints de lives masivos. |
| `FEATURE_RECORDING` | false | Deshabilita cualquier grabación. |
| `FEATURE_PAYOUTS` | true | Habilita wallet de ganancias. |

## 5. Economía de tokens (TKN)
### 5.1 Packs de compra
- Pack S: 500 TKN — 4,99 €
- Pack M: 1.200 TKN — 9,99 €
- Pack L: 3.000 TKN — 24,99 €
- Pack XL: 6.500 TKN — 49,99 €
- Pack XXL: 14.000 TKN — 99,99 €

Requisitos:
- Webhook idempotente (evitar duplicar saldo en reintentos).
- Saldo siempre visible en header.
- Invitado recibe aviso sobre pérdida de saldo si borra cookies y CTA para crear cuenta.
- Localización de precios: mostrar equivalencia en moneda local (EUR/USD/GBP/MXN) sin cambiar el monto en tokens.
- Límites de gasto configurables por usuario (diario/mensual) con bloqueo automático si se exceden; admins pueden suspender compras.

### 5.2 Gastos y rangos
| Funcionalidad | Rango permitido | Valor por defecto |
|---------------|----------------|-------------------|
| Regalos (Heart, Kiss, Rose, Fireworks, Supernova, Meteor Shower) | valores fijos 20–5.000 TKN | según catálogo | 
| PPV media privada | 199–1.999 TKN | 499 / 999 / 1.499 TKN sugeridos |
| Pase 30 días | 499–2.999 TKN | 1.499 TKN |
| Pago por minuto 1:1 | 50–500 TKN/min | 150 TKN/min |
| Entrada grupo VIP | 100–1.000 TKN | 300 TKN |
| Bundle PPV opcional | `3 medios por 999 TKN` |

### 5.3 Comisiones y contabilidad
- Regalos, PPV, 1:1, tickets VIP: 70% creador, 30% plataforma.
- Pase 30 días: 80% creador, 20% plataforma.
- Cada gasto genera dos transacciones en `wallet_tx`: `spend` para comprador y `split` para earnings y fee.
- Hold antifraude: earnings en estado `pending` 7 días → luego `available` (configurable).
- Retiro mínimo: equivalente a 50 € en TKN.

## 6. Módulos y microservicios
### 6.1 Frontend (Cloudflare Pages)
- Framework: Next.js 14 (app router) + Tailwind + shadcn/ui.
- Dark mode por defecto (paleta indicada: `#0B0F14`, `#121820`, `#1B2330`, acentos `#E11D48`, `#7C3AED`).
- Tipografía Inter/Poppins; accesibilidad AA.
- Rutas clave: `/`, `/match`, `/groups`, `/u/[username]`, `/forum`, `/wallet`, `/auth/*`, `/guest/upgrade`, `/legal/*`.
- Header fijo con logo, navegación principal y saldo.

### 6.2 Backend (VPS)
- Lenguaje sugerido: Node.js (NestJS) o Go (Fiber) con WebSocket/WebRTC signalling.
- Servicios:
  - **Auth Service**: gestiona registro, login, SSO, JWT (guest/user/admin), migración de saldo invitado.
  - **Matchmaking Service**: emparejamiento 1:1 y grupos (≤6), gestión de preferencias, signalling WebRTC, SFU ligero (ej. mediasoup) para grupos.
  - **Content Service**: CRUD de posts, foros, media, generación de URLs firmadas S3.
  - **Wallet Service**: saldo TKN, transacciones, comisiones, hold antifraude, retiros.
  - **Payments Service**: integración con PSP adulto (webhooks idempotentes, reconciliación).
  - **Moderation Service**: reportes, bans, shadowban, logs y alertas.

### 6.3 Infraestructura
- **VPS**: Docker Compose orquestando backend monolítico + base de datos + SFU.
- **Base de datos**: PostgreSQL (roles, posts, foro, wallets, flags).
- **Cache/colas**: Redis para colas de match y rate limiting.
- **Storage**: S3 compatible (Wasabi/Backblaze) con buckets privados y URLs firmadas (TTL 5 min) y hotlink prevention (firma ligada a usuario/sesión y referer).
- **CDN**: Cloudflare para frontend y assets públicos.

## 7. Modelado de datos (simplificado)
### Entidades principales
- `users`: id, username, email, hash, roles, flags, saldo tokens, preferencias match, estado KYC.
- `guest_sessions`: id, alias, saldo, expiry, device fingerprint (opcional).
- `wallet_tx`: id, user_id, type (purchase/spend/split/earnings/fee/payout), amount, status, related_entity_id, created_at.
- `earnings`: user_id, amount_pending, amount_available, hold_release_at.
- `posts`: id, author_id, title, body, visibility (`free`, `ppv`, `pass_only`), price_ppv, price_pass, media_refs.
- `media_assets`: id, post_id, type (image/video), storage_key, signed_url_ttl, blur_placeholder.
- `passes`: id, user_id, creator_id, start_at, end_at, status.
- `forum_categories`, `forum_threads`, `forum_posts` (con adjunto opcional).
- `match_sessions`: id, type (`1v1`, `group`), participants, state, sfu_room_id.
- `preferences`: user_id o session_id, tags, updated_at.
- `reports`: id, reporter_id, target_type, target_id, reason, status.
- `feature_flags`: name, enabled, audience.

## 8. Flujos clave
### 8.1 Invitado → Match → Compra tokens → Migración
1. Usuario acepta age-gate (+18) y entra como invitado (`FEATURE_GUEST`).
2. Accede a `/match`, define preferencias (chips) y entra a cola. El sistema empareja si existe intersección de ≥1 preferencia.
3. Durante el chat puede enviar regalos (catálogo) con saldo invitado.
4. Al intentar comprar tokens, se muestra modal con aviso de cookies y opción de crear cuenta antes de pagar.
5. Invitado decide crear cuenta → `POST /guest/upgrade` migra saldo y preferencias a nuevo usuario registrado.

### 8.2 Contenido PPV y pase de 30 días
1. Creador publica post con visibilidad `ppv` o `pass_only`, definiendo precio dentro de rangos.
2. Media se sube a S3 mediante URL prefirmada; backend guarda `storage_key`.
3. Visitante ve cards con candado y precios; al pagar con tokens se crean transacciones `spend` y `split`, se actualiza acceso (unlock / pase activo).
4. Backend emite URLs firmadas de 5 min al solicitar media; si expira y el usuario tiene acceso, se regenera.

### 8.3 Pagos por minuto 1:1
1. Ambos usuarios activan flag de pago por minuto.
2. Al iniciar sesión 1:1, se informa del precio y se requiere confirmar.
3. Billing en intervalos (ej. cada 30 s) descontando tokens y aplicando reparto 70/30.
4. Si saldo insuficiente, se pausa sesión y se ofrece CTA comprar tokens.

### 8.4 Foro y moderación
- Usuarios registrados pueden crear hilos y responder con texto + 1 adjunto (máx. 25 MB imagen, 200 MB video).
- Reportes accesibles desde posts, mensajes y perfiles; admin revisa, puede banear o aplicar shadowban.
- Logs de acciones (moderación, payouts) almacenados para auditoría.

## 9. UX/UI y componentes
- Dark theme base (`#0B0F14`), componentes minimalistas (Button, Card, Modal, Tabs, Badge, Chip, Dialog, Input, Select, Toast) con Tailwind + shadcn/ui.
- Microinteracciones: animaciones de regalos ≤2 s sobre video/post; efecto unblur al desbloquear PPV; toast de confirmación o falta de saldo.
- Header siempre muestra saldo; si < precio requerido, toast con CTA a `/wallet`.
- `/wallet`: catálogo de packs, historial de transacciones, botón retiro (si `FEATURE_PAYOUTS`).
- Campana de notificaciones in-app (gift, PPV, pase, comentarios, menciones, referidos, likes) con preferencias por tipo.
- Buscador global (usuarios, tags, hilos) accesible desde el header.
- Botones de seguir/desbloquear en perfiles y hilos para retención.
- Botón “Compartir” en perfiles, posts (free/PPV) y hilos con share sheet (X, Telegram, Reddit, copiar link) y metadatos OG blur para contenido adulto.
- Perfil muestra contadores (posts, likes, gifts, referidos) y badges automáticos (`Nuevo`, `Activo`, `Top Contributor`, `Invitador`).
- Wallet incluye bloque de referidos (contador, link con `?ref=` y CTA “Registrar compra referida”).
- Chats 1:1/grupos con likes, respuestas inline y vista previa del mensaje citado.

## 10. Seguridad y cumplimiento
- Age-gate +18 en landing.
- JWT firmados (Access + Refresh). Cookies httpOnly para web.
- Límites de subida y validación de formatos.
- URLs firmadas S3 con TTL corto y binding a sesión.
- Registro de consentimientos y logs de reporte/acción.
- Póliticas legales: `/legal/tos`, `/legal/privacy`, `/legal/content`, `/legal/notice`.
- GDPR-ready: export/delete account flows (no priorizados pero planificados).
- Banner de consentimiento de cookies para analítica opcional.
- Backoffice protegido por TOTP obligatorio para admins y allowlist de IP.

## 11. Observabilidad y resiliencia
- Sentry habilitado en frontend, API y Signal con `X-Request-ID` propagado para
  correlacionar trazas y errores. Métricas clave (p95/p99 de `/match`, latencia
  Signal, tasa de éxito ICE) se exponen vía OTEL/Prometheus.
- Logs estructurados JSON con `request_id`, `session_scope` y `feature` para
  facilitar análisis forense.
- Scripts `infra/scripts/backup-db.sh` y `infra/scripts/restore-test.sh`
  soportan backups diarios + ensayo de restauración trimestral documentado en el
  runbook.
- Alarmas Sentry + Cloudflare Health Checks alertan si `/health` o `/healthz`
  fallan, o si la tasa de `INSUFFICIENT_TOKENS` supera el umbral esperado.

## 12. Entornos, QA y pruebas de red
- Staging dedicado (`stg.www|api|signal.tuweb.com`) replica producción con PSP
  en sandbox para pruebas WebRTC (4G↔WiFi, firewalls corporativos) y smoke tests
  automatizados (ticket create → match → leave).
- QA continuo: Lighthouse/axe para accesibilidad, pruebas E2E de compras,
  desbloqueos PPV/pase y salas VIP; auditoría manual de WebRTC en redes reales
  antes de cada release mayor.
- Límites de almacenamiento por usuario (cuota semanal) y limpieza de media
  huérfana documentados como tareas cron.

## 13. Operación y soporte
- Admins requieren TOTP + header `ADMIN_API_SECRET`; IP allowlist restringe el
  panel backoffice. Moderadores comunitarios (`scope:"mod"`) gestionan contenido
  sin acceso a pagos.
- Correo de soporte dedicado (`soporte@tuweb.com`) con plantillas para pérdida
  de saldo invitado, acreditación de tokens y abusos en match. SLA 24–48h.
- Página pública de transparencia (DSA light) con nº de retiradas/mes,
  procedimientos DMCA y cómo apelar decisiones.
- Copys educativos in-app: qué es PPV, beneficios del Pase, por qué existen
  límites de gasto y cómo usar bloqueos/mutes para seguridad.
- CAPTCHA (hCaptcha) en registro, upgrade invitado y publicación masiva para frenar spam.
- Blocklist de términos sensibles y hashes de media retirada para impedir re-subidas inmediatas.
- Página de transparencia con métricas mensuales (DSA light) y contactos dedicados (`notice@`, `appeals@`).

## 11. Observabilidad y operaciones
- Logs estructurados (pino/winston) enviados a Loki/ELK.
- Alerting básico (errores 5xx, fallos de pago, colas de match saturadas).
- Backups diarios de PostgreSQL (S3 con retención 30 días).
- Scripts de mantenimiento para liberar medias expiradas, revisar holds.

## 12. Roadmap post-v1
- Activar `PAYOUTS_REQUIRE_KYC` con proveedor externo.
- Moderación asistida con IA.
- Lives ampliados o eventos especiales.
- Watermark dinámico en media de pago.
- Apps móviles (cuando se evalúe viabilidad en stores +18).

