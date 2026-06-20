# Deploy beta / producción inicial

## Vercel
1. Importar repositorio.
2. Configurar `APP_URL` y `NEXT_PUBLIC_APP_URL` con el dominio final.
3. Añadir Supabase, Stripe, IA, email y analytics env vars desde `.env.example`.
4. Ejecutar `npm run build` en CI/Vercel.
5. Configurar dominio y HTTPS.

## Supabase
1. Ejecutar migraciones `001` a `010` en orden.
2. Crear buckets privados: `rankelia-inputs`, `rankelia-outputs`, `rankelia-reports`.
3. Revisar RLS: usuarios solo leen sus datos, admin global, wallets no mutables desde cliente.
4. Crear primer admin con SQL controlado.

## Stripe
1. Crear precios de suscripción Starter/Pro/Growth/Agency.
2. Crear precios one-time para packs 25 a 10.000 productos.
3. Copiar `price_...` a env vars.
4. Configurar webhook production: `/api/stripe/webhook`.
5. Activar eventos: checkout, subscription e invoice.

## Worker
No ejecutar jobs largos dentro del frontend Vercel. Desplegar worker en Railway, Render, VPS o cron controlado con:
- `SUPABASE_SERVICE_ROLE_KEY`
- Supabase URL
- AI keys
- envs worker

Comando recomendado: `npm run worker:dev` para loop puntual o `npm run worker:job -- <JOB_ID>` para reprocesos controlados.
