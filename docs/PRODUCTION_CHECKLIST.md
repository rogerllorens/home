# Production checklist Rankelia.ai

## Preflight técnico
- `npm install`, `npm run lint`, `npm run typecheck`, `npm test` y `NEXT_TELEMETRY_DISABLED=1 npm run build` deben pasar.
- Ejecutar `npm run validate:env` en local y `VALIDATE_ENV_MODE=production npm run validate:env` antes de desplegar.
- `NEXT_PUBLIC_ENABLE_DEMO=false` en producción.
- `WORKER_MAX_ROWS_PER_JOB` y `NEXT_PUBLIC_MAX_ROWS_PER_JOB` deben coincidir para no cobrar filas que el worker no procese.

## Supabase
- Ejecutar migraciones `001` a `010` en orden.
- Confirmar RLS activo en perfiles, proyectos, uploads, jobs, job_rows, downloads, wallets, transactions, reservations, billing y audit_events.
- Crear buckets privados `rankelia-inputs`, `rankelia-outputs`, `rankelia-reports`.
- Verificar que customer solo lee sus datos y no puede insertar/update en `jobs`, `job_rows`, wallets, transactions, payment_events ni downloads.
- Crear primer admin desde SQL Editor tras registrar usuario.

## Stripe
- Crear productos/precios de planes y productos extra en Stripe Dashboard.
- Copiar price IDs a `.env`.
- Configurar webhook hacia `/api/stripe/webhook` con firma.
- Probar duplicados: reenviar el mismo evento no debe duplicar saldo.
- Customer Portal debe estar configurado en Stripe.

## Worker, IA, email y observabilidad
- Desplegar worker fuera de Vercel serverless (Railway/Render/VPS) con service role e IA keys.
- Configurar Resend (`RESEND_API_KEY`, `EMAIL_FROM`) o asumir noop documentado.
- Configurar Sentry y Upstash/Redis antes de multi-instancia; el rate limit in-memory es solo beta/dev.
- Confirmar que sin IA key se usa fallback explícito y no se vende como IA real.

## Exports CSV ecommerce
- Probar manualmente Rankelia Generic CSV y el formato elegido en una tienda de prueba.
- Shopify/WooCommerce/PrestaShop son exports CSV orientados; no son sincronización API ni importación garantizada.
- Revisar `Rankelia Warnings` por fila antes de importar.

## Free SEO Audit

- [ ] Ejecutar migración `011_free_seo_audits.sql`.
- [ ] Verificar rate limit con Upstash en producción.
- [ ] Probar auditoría con 3 tiendas reales y URLs bloqueadas SSRF.
- [ ] Confirmar que auditorías anónimas no son listables públicamente.

## PageSpeed

- [ ] Create Google PageSpeed Insights API key.
- [ ] Set `PAGESPEED_ENABLED=true` and `PAGESPEED_API_KEY`.
- [ ] Configure Upstash rate limit before public traffic.
- [ ] Verify PageSpeed failure does not block basic audit.

## Schema/GEO/llms.txt

- [ ] Run migration `013_schema_geo_llms_audit.sql`.
- [ ] Test Product, Organization, Breadcrumb and FAQ schema examples.
- [ ] Verify llms.txt download/copy on mobile and desktop.
- [ ] Confirm copy does not promise rich results, rankings or AI visibility.

## Prompt 0 hardening checks

- Configure Upstash Redis; production validation fails without it.
- Keep `NEXT_PUBLIC_ENABLE_DEMO=false` in production.
- Confirm security headers/CSP in staging.
- Verify Free Audit DNS rebinding protection with redirect/private-IP tests.
- Schedule `npm run cleanup:orphan-uploads` as a daily trusted cron.
- Use `Idempotency-Key` for job creation retries/double-clicks.

## Proposals/versioning

- Apply migration `015_optimization_proposals_versions.sql`.
- Run `npm run backfill:proposals -- --dry-run` against staging before backfilling legacy jobs.
- Verify `/app/proposals` only shows user-owned proposals.
- Verify approved-only exports reject jobs with zero approved versions.

## Dashboard privado

- Aplicar migraciones hasta `015_optimization_proposals_versions.sql` antes de usar catálogo/propuestas.
- Validar `/api/app/dashboard`, `/api/app/catalog`, `/api/app/opportunities` y `/api/app/jobs/[id]` con usuarios reales y RLS.
- Confirmar que `NEXT_PUBLIC_ENABLE_DEMO=false` no expone rutas inactivas en navegación privada.

## GSC production checklist
- Configure Google OAuth consent and authorized redirect URI.
- Use readonly Search Console scope only.
- Generate a base64 32-byte `GOOGLE_TOKEN_ENCRYPTION_KEY` and keep it secret.
- Run a staging OAuth connection and 28/90 sync before exposing the nav.
- Configure daily cron with `npm run sync:gsc` and conservative limits.
- Verify user A cannot view/sync user B properties or metrics.

## Universal import checklist

- Keep file size, column, row, pasted-character and XML node/depth limits enabled.
- Verify private Storage remains the only persisted input path for normalized job files.
- Confirm `.xls` legacy files show the safe rejection message unless a binary XLS parser is explicitly added and tested.
- Re-run the import smoke test for CSV, Windows-1252, XLSX, pasted tables and XML before launch.
