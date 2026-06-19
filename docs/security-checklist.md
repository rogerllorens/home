# Security checklist

- No secrets reales en repositorio.
- `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` y AI keys solo server/worker.
- Route handlers sensibles `force-dynamic`.
- Webhook Stripe verifica firma y usa idempotencia.
- Success URL nunca concede créditos.
- RPCs de wallet revocadas a `anon` y `authenticated`; solo `service_role`.
- RLS activa en tablas de usuarios, jobs, downloads, billing y logs.
- Buckets privados y signed URLs con ownership.
- Admin protegido por rol.
- No logging de CSV completo, tarjetas, tokens ni claves.
- IA con fallback y warnings anti-invención.
- Ejecutar `supabase/sql/007_final_security_hardening.sql` para bloquear escalada de `profiles.role` por clientes y reforzar revokes de wallet/downloads.

## Signed URLs
- Descargas y archivos originales deben firmarse desde route handlers server-side con autenticación, rol admin si aplica y `validateStoragePathOwnership`; no crear signed URLs privadas directamente desde componentes cliente.
- Mantener expiración corta (10 minutos por defecto) y buckets privados.
