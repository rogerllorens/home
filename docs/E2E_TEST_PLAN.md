# Plan E2E manual

- Auth: register, login, logout, reset password, admin denied/customer denied.
- CSV: válido, vacío, sin cabeceras, delimitador `;`, comillas, > límite de filas, extensión XLSX bloqueada con mensaje claro.
- Jobs: crear con saldo, crear sin saldo, cancelar antes de worker, worker completed, worker failed y liberación de reserva.
- IA: preview con API key, fallback sin API key, JSON inválido/reparado, warnings anti-claims.
- Stripe: checkout pack, checkout subscription, portal, webhook duplicado, payment failed.
- Storage: signed URL propia, signed URL ajena denegada, bucket privado.
- Admin: overview, users, jobs, credits, logs, billing events.
