# Setup manual pendiente

- Crear proyecto Supabase, copiar URL/anon/service role y ejecutar migraciones `001` a `009`.
- Crear buckets privados `rankelia-inputs`, `rankelia-outputs`, `rankelia-reports`.
- Registrar usuario propietario y convertirlo en admin desde SQL Editor.
- Crear productos/precios Stripe para Starter, Pro, Growth, Agency y packs 25-10000 productos; copiar price IDs.
- Configurar Stripe webhook producción a `/api/stripe/webhook` y Customer Portal.
- Configurar proveedor IA real y límites de coste.
- Configurar Resend (`RESEND_API_KEY`, `EMAIL_FROM`) si se quieren emails reales.
- Configurar Sentry y Upstash para producción multi-instancia.
- Desplegar web en Vercel y worker en Railway/Render/VPS con `SUPABASE_SERVICE_ROLE_KEY`.
- Revisar textos legales con abogado/gestor y completar datos fiscales.
