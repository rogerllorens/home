# Rankelia.ai

**Rankelia.ai** es un SaaS B2B de ecommerce SEO con enfoque CSV-first para convertir catálogos de productos y categorías en contenido SEO listo para revisar e importar en Shopify, Prestashop, WooCommerce o CSV genérico.

## Estado de esta fase

El proyecto incluye:

- Landing pública premium con uploader visual, diagnóstico demo, pricing, FAQ y CTAs conectados al registro real.
- App privada cliente con subida CSV real, proyectos/jobs/descargas, wallet/billing y plantillas/settings demo aislados por flag.
- Admin interno separado con backoffice real para usuarios/jobs/créditos/logs y módulos demo privados aislados por flag.
- Supabase Auth real preparado para Next.js App Router con `@supabase/ssr`.
- Rutas `/app/*` protegidas para usuarios autenticados y `/admin/*` restringidas a `profiles.role = 'admin'`.
- SQL base para `profiles`, `credit_wallets`, `credit_transactions`, `projects`, `file_uploads`, `jobs`, `job_rows`, `downloads`, triggers y políticas RLS.

## Ejecutar en local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Configura en `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
SUPABASE_SERVICE_ROLE_KEY=solo_en_worker_local
WORKER_MAX_JOBS_PER_RUN=1
```

Abrir `http://localhost:3000`.

## Configurar Supabase Auth

1. Crea un proyecto en Supabase.
2. Copia `Project URL` y `anon public key` a `.env.local`.
3. Ejecuta el SQL de `supabase/sql/001_auth_profiles.sql`, `supabase/sql/002_fix_admin_bootstrap.sql` y `supabase/sql/003_projects_jobs_storage.sql` en el SQL Editor de Supabase.
4. Revisa en Supabase Auth que Email/Password esté habilitado.
5. Prueba `/login?mode=register` y crea un usuario.
6. Si Supabase requiere confirmación, confirma el email antes de entrar.

## Crear el primer admin

No existe ningún botón público para convertirse en admin. Tras registrar tu usuario, ejecuta manualmente en Supabase:

```sql
update public.profiles set role = 'admin' where email = 'TU_EMAIL';
```

Después entra en `/admin`. Un usuario con rol `customer` será redirigido a la pantalla de acceso restringido.

## Seguridad y RLS

- No se usa `service_role` en frontend.
- `profiles`, `credit_wallets`, `credit_transactions`, `projects`, `file_uploads`, `jobs`, `job_rows` y `downloads` tienen RLS activado.
- Un customer solo puede leer sus propios datos.
- Un customer puede actualizar su perfil básico, pero no su rol ni su saldo.
- Los créditos reales, pagos y ajustes server-side quedan preparados para fases posteriores.


## Prompt 6: Storage y jobs reales

Además de Auth, esta fase añade la base real de proyectos, uploads, jobs, filas y descargas. Ejecuta también:

```bash
# En Supabase SQL Editor
supabase/sql/002_fix_admin_bootstrap.sql
supabase/sql/003_projects_jobs_storage.sql
```

La documentación completa de Storage privado, prueba de subida CSV y verificación en Supabase está en `docs/prompt-6-storage-jobs.md`.


## Prompt 7: Worker y pricing por productos

Esta fase añade worker local template-based sin IA real, progreso de jobs, logs, outputs CSV/HTML/TXT, descargas reales y pricing visible por productos SEO.

```bash
# Solo entorno local/servidor worker; nunca frontend
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
npm run worker:dev
```

Ejecuta también `supabase/sql/004_worker_logs_processing.sql`. La guía completa está en `docs/prompt-7-worker-processing.md`.

## Comandos útiles

```bash
npm run lint
npm run typecheck
npm run build
```

## Próximas fases previstas

- Prompt 9: Stripe Billing, checkout, webhooks y consumo real de productos/créditos internos.
- Prompt 10: hardening de seguridad, legal, performance, deploy y observabilidad.
- Integraciones directas Shopify/Prestashop/WooCommerce y publicación asistida.
- Admin avanzado para plantillas IA editables, equipos y auditoría de costes.


## Prompt 8 — IA real opcional y fallback seguro

Rankelia ya incluye una capa IA server-side preparada para OpenAI/OpenAI-compatible y futuros providers Qwen, DeepSeek, Claude y Gemini. Ejecuta `supabase/sql/005_ai_generation_fields.sql`, configura las variables `AI_*` y `OPENAI_API_KEY` en `.env.local`, y usa `/app/upload` para generar una preview IA de 3-5 filas.

El worker (`npm run worker:dev`) procesa jobs con `generation_engine='ai'` cuando hay provider configurado. Si no hay API key, el coste supera límites o el JSON no valida, se usa la generación template-based del Prompt 7 como fallback y se registran warnings en `job_logs`. Consulta `docs/prompt-8-ai-generation.md` para detalles de providers, JSON validation, anti-invención, costes y pruebas.


## Prompt 9 — Stripe, productos SEO y wallet real

Rankelia incluye endpoints server-side para Stripe Checkout de planes y productos extra, Customer Portal y webhook verificado. Ejecuta `supabase/sql/006_billing_stripe_wallet.sql`, configura `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, los `STRIPE_PRICE_*` y `APP_URL`, y usa `/app/credits` o `/app/billing` para abrir Checkout.

El saldo no se concede desde `success_url`: solo el webhook añade créditos internos mediante RPCs idempotentes. El worker reserva créditos antes de procesar jobs y consume o libera la reserva al finalizar. Consulta `docs/prompt-9-stripe-products-wallet-billing.md` para Stripe CLI, productos, precios y pruebas.

## Prompt 10 — Beta pública / producción inicial

Rankelia.ai queda preparada para beta con hardening final: páginas legales (`/privacy`, `/terms`, `/cookies`, `/support`), metadata SEO, robots/sitemap, error/loading boundaries, analítica opcional, tests básicos y documentación operativa.

### Scripts principales

```bash
npm run dev
npm run typecheck
npm run lint
npm run test
npm run build
npm run worker:dev
npm run worker:job -- <JOB_ID>
```

### Documentación final

- `docs/supabase.md`: migraciones, RLS y buckets privados.
- `docs/stripe.md`: Checkout, Portal, webhooks e idempotencia.
- `docs/ai.md`: IA real, JSON validado y fallback.
- `docs/worker.md`: ejecución del worker y reprocesos.
- `docs/deploy.md`: deploy en Vercel + worker externo.
- `docs/qa-checklist.md`: QA manual por área.
- `docs/smoke-test-e2e.md`: prueba completa antes de beta.
- `docs/security-checklist.md`: revisión de secretos, RLS, Stripe y Storage.
- `docs/launch-checklist.md`: checklist final de lanzamiento.

### Producción inicial

Antes de abrir beta: aplica migraciones `001` a `010`, crea buckets privados, configura webhook Stripe real, despliega worker con `SUPABASE_SERVICE_ROLE_KEY`, revisa que no hay secretos en frontend y ejecuta el smoke test E2E completo.

## Cierre beta: garantías de producción inicial

- La creación productiva de jobs pasa por `POST /api/jobs/create`: el cliente sube el CSV a Storage privado, pero el servidor descarga el archivo, recalcula filas/créditos, inserta `job_rows` en batches, crea la reserva de créditos y solo deja el job en `queued` si la reserva existe.
- En beta solo se procesa CSV real. XLSX queda bloqueado con mensaje explícito y documentado para v1.1.
- El límite por job se controla con `WORKER_MAX_ROWS_PER_JOB` y `NEXT_PUBLIC_MAX_ROWS_PER_JOB`; ambos deben coincidir para evitar discrepancias entre filas subidas, cobradas y procesadas.
- `npm run validate:env` valida configuración local; usa `VALIDATE_ENV_MODE=production npm run validate:env` antes de producción.
- Consulta `docs/PRODUCTION_CHECKLIST.md`, `docs/ENVIRONMENT.md`, `docs/MOCKS_AND_DEMOS.md`, `docs/QA_SMOKE_TEST.md` y `docs/REMAINING_MANUAL_SETUP.md` antes de abrir beta.

## Exports ecommerce CSV

El worker genera Rankelia Generic CSV y, cuando aplica, un CSV orientado a Shopify, WooCommerce o PrestaShop. No es integración API ni publicación automática; consulta `docs/EXPORTS.md` para columnas, warnings y limitaciones por plataforma.


## Quality Engine SEO/GEO

Rankelia recalcula scores propios y añade audit columns para metadatos, slug, schema, claims, missing data, E-E-A-T, GEO/AI readiness y publish readiness. Consulta `docs/QUALITY_ENGINE.md` y `docs/OBSERVABILITY.md`.

- Free SEO Audit Engine: lead magnet público para analizar una URL ecommerce con protección SSRF, safe fetch, robots/sitemap, schema, imágenes y scoring básico. Ver `docs/FREE_SEO_AUDIT.md`.

- PageSpeed enrichment: optional mobile/desktop PSI diagnostics for the Free SEO Audit, with Core Web Vitals, opportunities, cache and non-blocking fallback. See `docs/PAGESPEED_AUDIT.md`.

- Advanced Schema/GEO/AEO/llms.txt audit: structured data diagnostics, AI-readiness scoring and downloadable llms.txt proposal for the free audit.

### Image SEO + ALT text

Rankelia detecta columnas de imagen/ALT en CSV, preserva ALT existentes, genera sugerencias prudentes cuando faltan, calcula `image_seo_score` y exporta campos de ALT para Rankelia Generic, Shopify y columnas orientativas para WooCommerce/PrestaShop. No comprime imágenes, no analiza visualmente la imagen ni publica cambios automáticamente.

## Human review proposals

Rankelia now supports a proposals workflow: generated `job_rows.output_data` remains for legacy exports, while new jobs also create catalog items, optimization proposals and proposal versions. Users can compare original vs active output, regenerate fields, save manual edits as versions, approve a version and export approved-only CSV/report files.

## Dashboard privado

La app privada incluye dashboard real, catálogo, oportunidades internas, propuestas versionadas, jobs detail y descargas agrupadas. Las oportunidades actuales no usan Search Console: se basan en scores, warnings, propuestas y estado de aprobación/exportación.
