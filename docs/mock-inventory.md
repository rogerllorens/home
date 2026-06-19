# Inventario de mocks y datos demo

## Sustituidos por datos reales
- `/app`: dashboard real de jobs, downloads, wallet y plan.
- `/app/upload`: CSV real, Storage, projects, jobs, rows y saldo insuficiente.
- `/app/jobs`: jobs, filas, logs y estados reales.
- `/app/downloads`: downloads reales con signed URLs.
- `/app/credits` y `/app/billing`: wallet, transacciones, reservas, Stripe Checkout/Portal.
- `/admin`: overview real de usuarios, jobs, logs, wallets, ingresos checkout y coste IA.
- `/admin/users`, `/admin/jobs`, `/admin/credits`, `/admin/logs`: datos reales protegidos por rol admin.

## Mocks aceptables explícitos para beta
- Landing pública: CSV demo y diagnóstico local para explicar el valor sin backend.
- `lib/app-mock.ts`, `lib/admin-mock.ts` y `lib/mock-data.ts`: soporte visual de pantallas no críticas o fallback demo.
- `/app/templates`, `/app/settings`, `/admin/templates`, `/admin/settings`: muestran badge demo/pendiente y no se presentan como mutaciones productivas.
- Fallback template-based de IA: comportamiento productivo de seguridad cuando falla IA o falta API key.

## Pendiente v1.1
- Persistencia de settings de workspace/proyecto.
- Editor visual de prompts conectado a DB.
- Acciones admin de ajustes reales server-side.
- Eliminación progresiva de páginas demo cuando esos módulos tengan backend real.
