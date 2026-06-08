# QA smoke test beta

1. Ejecutar migraciones `001`-`008` y crear buckets privados.
2. Crear usuario A, iniciar sesión y confirmar wallet Free (3 productos estándar).
3. Entrar en `/app/upload`, subir CSV válido, revisar mapeo y preview IA/fallback.
4. Confirmar job: `/api/jobs/create` debe crear job, insertar todas las filas permitidas y reservar créditos server-side.
5. Ejecutar `npm run worker:once`; comprobar progreso, job_rows, downloads y consumo/liberación de reserva.
6. Descargar CSV, HTML y TXT con signed URLs; usuario B no debe poder acceder.
7. Probar CSV inválido, CSV > `WORKER_MAX_ROWS_PER_JOB` y saldo insuficiente.
8. Comprar productos extra con Stripe test y reenviar webhook duplicado: saldo solo aumenta una vez.
9. Contratar plan test y verificar grant por invoice.
10. Entrar como admin y revisar usuarios, jobs, wallets, reservations, payment_events y logs.
