# Prompt 7 · Worker, outputs reales y pricing por productos

## Qué añade esta fase

- Worker local ejecutable con `npm run worker:dev`.
- Procesa jobs `queued` y `ready_for_processing` creados en `/app/upload`.
- Descarga el CSV original privado desde Supabase Storage.
- Genera resultados SEO template-based sin IA real.
- Actualiza `job_rows`, progreso en `jobs`, logs en `job_logs` y downloads reales.
- Sube `output.csv`, `output.html`, `report.txt` y `errors.csv` si aplica.
- Cambia pricing visible de créditos a productos SEO, manteniendo créditos internos.

## Variables nuevas

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
WORKER_POLL_INTERVAL_MS=5000
WORKER_MAX_JOBS_PER_RUN=1
WORKER_MAX_ROWS_PER_JOB=5000
```

`SUPABASE_SERVICE_ROLE_KEY` es solo para el worker local/servidor. Nunca debe exponerse en frontend.

## SQL a ejecutar

Ejecuta después de las migraciones de Prompt 6:

```sql
-- Supabase SQL Editor
supabase/sql/004_worker_logs_processing.sql
```

La migración añade `job_logs`, nuevos campos de worker/progreso/uso a `jobs`, `completed_with_warnings` y metadatos de calidad en `downloads`.

## Cómo probar el flujo completo

1. Configura `.env.local` con anon key y service role key.
2. Ejecuta SQL 001, 002, 003 y 004.
3. Inicia sesión en `/login`.
4. Ve a `/app/upload`.
5. Sube o pega un CSV.
6. Analiza y crea el job.
7. Si el job queda `ready_for_processing`, ejecuta:

```bash
npm run worker:dev
```

8. Ve a `/app/jobs` y comprueba progreso, status, logs y score.
9. Ve a `/app/downloads` y descarga CSV/HTML/TXT con signed URL privada.
10. Entra como admin a `/admin/jobs` y `/admin/logs` para ver cola, acciones y logs reales.

## Estados del worker

- `ready_for_processing`: job creado y listo.
- `queued`: reintento/cola manual admin.
- `processing`: worker reclamó el job.
- `completed`: outputs generados sin fallos de fila.
- `completed_with_warnings`: outputs generados con warnings o filas fallidas.
- `failed`: error global de procesamiento.
- `cancelled`: cancelado desde UI/admin.

## Pricing actualizado

Rankelia comunica productos SEO, no créditos como propuesta principal:

- Producto estándar = 1 producto visible = 500 créditos internos.
- Producto Pro = 2 productos visibles = 1.000 créditos internos.
- Producto Premium = 4 productos visibles = 2.000 créditos internos.
- Solo metadatos = 50 créditos internos.
- Categoría SEO = 5.000 créditos internos.

Planes visibles:

- Free: 3 productos estándar.
- Starter: 50 productos/mes por 19 €.
- Pro: 150 productos/mes por 39 €.
- Growth: 350 productos/mes por 69 €.
- Agency: 1.000 productos/mes por 149 €.

Packs extra disponibles por tramos de 25 a 10.000 productos. Stripe real queda para Prompt 9.

## Seguridad

- Service role solo en `scripts/process-jobs.ts`.
- Buckets siguen privados.
- Descargas se sirven con signed URLs tras validar sesión/ownership en `/api/downloads/[id]/signed-url`.
- RLS mantiene aislamiento por `user_id`.
- Admin solo accede si `profiles.role = 'admin'`.

## Pendiente para Prompt 8

- IA real.
- Prompts y modelos.
- Validación JSON estricta.
- Reintentos por modelo.
- Métricas reales de coste IA.
