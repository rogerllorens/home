# Variables de entorno

| Variable | Obligatoria | Ámbito | Uso | Ejemplo seguro |
|---|---:|---|---|---|
| APP_URL / NEXT_PUBLIC_APP_URL | Sí | server/client | URLs de callbacks, metadata, Stripe | `https://rankelia.ai` |
| NEXT_PUBLIC_ENABLE_DEMO | Sí | client | Desactiva demos en producción | `false` |
| NEXT_PUBLIC_MAX_ROWS_PER_JOB | Recomendada | client | Muestra límite beta por job | `5000` |
| NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY | Sí | client/server | Supabase Auth/RLS | valores del dashboard |
| SUPABASE_SERVICE_ROLE_KEY | Sí server/worker | server only | Worker, webhooks y rutas seguras | nunca exponer |
| STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET | Sí billing | server only | Checkout, Portal, firma webhook | `sk_live_...` |
| STRIPE_PRICE_* | Sí billing | server only | Planes y productos extra | `price_...` |
| AI_PROVIDER / OPENAI_API_KEY / QWEN_* | Recomendada | server/worker | IA real | claves proveedor |
| AI_USE_FALLBACK | Recomendada | server/worker | Fallback si falla IA | `true` beta |
| WORKER_MAX_* / WORKER_STALE_JOB_MINUTES / WORKER_MAX_ATTEMPTS | Sí worker | worker | Lotes, recuperación de jobs colgados y seguridad | `5000`, `30`, `3` |
| RESEND_API_KEY / EMAIL_FROM / SUPPORT_EMAIL | Recomendada | server/worker | Emails reales o noop | `soporte@...` |
| NEXT_PUBLIC_ANALYTICS_PROVIDER / GA / POSTHOG | Opcional | client | Analítica sin CSV sensible | vacío si no se usa |
| SENTRY_DSN / SENTRY_ENVIRONMENT | Opcional | server/client | Errores | vacío en dev |
| UPSTASH_REDIS_REST_URL / TOKEN | Recomendada prod | server | Rate limit multi-instancia | Upstash |
| HELICONE_API_KEY / LANGFUSE_* | Opcional v1.1 | server/worker | Trazabilidad LLM externa si se activa | vacío si no se usa |

`npm run validate:env` avisa en desarrollo. Usa `VALIDATE_ENV_MODE=production npm run validate:env` para fallo estricto antes de producción.
