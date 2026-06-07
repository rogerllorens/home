# Supabase Rankelia

Ejecuta migraciones en orden `001` a `006`. Mantén privados los buckets `rankelia-inputs`, `rankelia-outputs` y `rankelia-reports`.

Tablas principales: profiles, wallets, transactions, reservations, projects, uploads, jobs, rows, downloads, logs, billing y subscriptions.

RLS esperado: usuarios leen sus datos, admin global, operaciones sensibles por service role/RPC/worker.
