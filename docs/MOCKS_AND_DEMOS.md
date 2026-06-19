# Mocks y demos restantes

## Aceptables en beta
- Landing pública: CSV de ejemplo y diagnóstico local para explicar el producto sin cuenta.
- `lib/app-mock.ts`, `lib/admin-mock.ts`, `lib/mock-data.ts`: soporte de pantallas antiguas/demo no críticas; no deben importarse en `/app/upload`, `/app/jobs`, `/app/downloads`, `/app/credits`, `/app/billing`, `/admin/users`, `/admin/jobs`, `/admin/credits` ni `/admin/logs` productivos.
- Fallback template de IA: permitido como resiliencia, pero se registra `fallback_used` y debe comunicarse como fallback.

## No aceptables en producción
- Saldos, billing, Stripe, jobs, downloads, wallets o admin productivo con datos falsos.
- XLSX simulado como si fuese importación real.

## Flag operativo
- `NEXT_PUBLIC_ENABLE_DEMO=false` en producción.
- Si se mantiene una pantalla demo, debe mostrar badge beta/demo explícito y quedar fuera del flujo crítico.
