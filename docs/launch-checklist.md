# Launch checklist beta

## Técnico
- `npm run typecheck` OK.
- `npm run lint` OK.
- `npm run build` OK.
- Tests básicos OK.
- Envs de Supabase, Stripe, IA, worker, email y analytics configuradas.
- Migraciones aplicadas y buckets privados creados.
- Webhook Stripe test y producción verificado.
- Worker ejecutado con service role.

## Producto
- Landing revisada en móvil/tablet/desktop.
- Pricing por productos SEO revisado.
- Productos extra hasta 10.000 revisados.
- Legal links visibles.
- Soporte definido.
- Onboarding y mensajes de revisión humana claros.

## Seguridad
- No secrets en repo.
- Service role no frontend.
- RLS revisado.
- Signed URLs privadas.
- Wallet no mutable desde cliente.
- Admin interno protegido.

## Beta
- 5 usuarios test creados.
- CSV pequeño y mediano procesados.
- Job fallido libera reserva.
- Compra test y suscripción test verificadas.
- Admin revisa logs, IA cost y billing.

## Cierre de mocks
- `NEXT_PUBLIC_ENABLE_DEMO=false` en producción.
- App/Admin demo providers no persisten localStorage ni ejecutan acciones mock sensibles con demo desactivado.
- Settings/templates bloqueados o marcados v1.1 salvo que se conecten a backend real.
