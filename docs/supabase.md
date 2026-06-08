# Supabase Rankelia

Ejecuta migraciones en orden `001` a `007`. Mantén privados los buckets `rankelia-inputs`, `rankelia-outputs` y `rankelia-reports`.

Tablas principales: profiles, wallets, transactions, reservations, projects, uploads, jobs, rows, downloads, logs, billing y subscriptions.

RLS esperado: usuarios leen sus datos, admin global, operaciones sensibles por service role/RPC/worker.


La migración `007_final_security_hardening.sql` bloquea escalada de roles por clientes y refuerza revokes sobre wallet, transacciones, reservas, eventos de pago y downloads.
