# Observabilidad Rankelia.ai

## Actualmente preparado

- `job_logs` para worker, IA, admin y errores operativos.
- Métricas por job/fila: provider, model, prompt version, tokens estimados, coste IA estimado, fallback count, validation errors y unsupported claims.
- `payment_events` con payload Stripe sanitizado.
- `preview_usage` para límites diarios atómicos de preview IA.
- `audit_events` para eventos de preview y acciones operativas ligeras.

## Variables opcionales

- `SENTRY_DSN` y `SENTRY_ENVIRONMENT` para errores app/worker.
- `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` para rate limit distribuido.
- `HELICONE_API_KEY`, `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY` quedan preparados para v1.1 si se quiere trazabilidad LLM externa.

## Alertas recomendadas

- Jobs `processing` sin heartbeat > `WORKER_STALE_JOB_MINUTES`.
- Webhook Stripe con error.
- Fallback IA alto.
- Coste IA por job por encima del umbral interno.
- Reservas bloqueadas durante demasiado tiempo.
