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
