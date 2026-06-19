# Prompt 6 · Storage, projects y jobs reales

## Correcciones aplicadas sobre Prompt 5

- **Bootstrap del primer admin:** `supabase/sql/002_fix_admin_bootstrap.sql` permite cambios de rol desde SQL Editor cuando `auth.uid()` es `null`, pero bloquea escalado de rol desde sesiones customer.
- **Versiones fijadas:** `package.json` ya no usa `latest`; se fija Next 16.2.7 + React 19.2.7 y dependencias compatibles.
- **Next 16 Proxy:** se usa `proxy.ts` con export `proxy` para evitar el warning de `middleware.ts` deprecado.
- **Rutas privadas dinámicas:** layouts privados y login usan `dynamic = "force-dynamic"` porque dependen de cookies/Supabase Auth.
- **Reset password completo:** recuperación envía al callback y redirige a `/reset-password`, donde se llama a `supabase.auth.updateUser({ password })`.
- **LocalStorage por usuario:** los mocks restantes usan `rankelia_app_state_${user.id}` y migran el antiguo `rankelia_app_state_v3` una sola vez.
- **Onboarding coherente:** el onboarding crea/actualiza el proyecto default real y guarda país/idioma/plataforma en `projects`.
- **Componentes duplicados:** se eliminó `components/landing/PublicHeader.tsx` porque el header real vive dentro de `PublicLanding`.
- **Audit:** `npm audit` sigue marcando PostCSS dentro de Next 16.2.7; no se ejecutó `npm audit fix --force` porque propone un downgrade peligroso a Next 9. Se revisará al existir versión estable de Next que incluya PostCSS parcheado.

## SQL a ejecutar

Ejecuta en orden:

1. `supabase/sql/001_auth_profiles.sql`
2. `supabase/sql/002_fix_admin_bootstrap.sql`
3. `supabase/sql/003_projects_jobs_storage.sql`

## Buckets privados

La migración 003 intenta crear buckets privados:

- `rankelia-inputs`
- `rankelia-outputs`
- `rankelia-reports`

Estructura esperada:

```txt
rankelia-inputs/{user_id}/{job_id}/input.csv
rankelia-outputs/{user_id}/{job_id}/output.csv
rankelia-outputs/{user_id}/{job_id}/output.html
rankelia-reports/{user_id}/{job_id}/report.txt
```

Si Supabase no permite crear policies de Storage desde tu plan/entorno, crea los buckets manualmente como privados y replica las policies del SQL.

## Probar Auth y primer admin

1. Configura `.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. Ejecuta SQL 001, 002 y 003.
3. Entra a `/login?mode=register` y crea usuario.
4. Confirma email si tu proyecto lo requiere.
5. Entra a `/app` y comprueba topbar con usuario/créditos reales.
6. Prueba logout/login.
7. Prueba `/reset-password` usando el enlace enviado desde “Olvidé mi contraseña”.
8. Entra a `/admin` como customer: debe bloquear.
9. En SQL Editor:

```sql
update public.profiles set role = 'admin' where email = 'TU_EMAIL';
```

10. Vuelve a `/admin`.

## Probar subida CSV real

1. Inicia sesión.
2. Ve a `/app/upload`.
3. Sube un `.csv` o pega CSV.
4. Pulsa “Analizar CSV”.
5. Revisa diagnóstico, columnas, mapping y créditos.
6. Pulsa “Guardar y crear job”.
7. Comprueba en Supabase:
   - archivo en `rankelia-inputs`;
   - registro en `projects`;
   - registro en `file_uploads`;
   - registro en `jobs`;
   - registros en `job_rows`.
8. Ve a `/app/jobs` para ver el job real.

## Admin real inicial

- `/admin/users` lee `profiles` reales con wallets/projects/jobs si RLS permite el join.
- `/admin/jobs` lee todos los jobs reales para perfiles con rol admin.
- El resto de backoffice conserva mocks operativos hasta conectar todos los módulos reales.

## Seguridad

- No hay service role en frontend.
- Los buckets son privados.
- Los usuarios solo ven sus filas por RLS (`user_id = auth.uid()`).
- Los archivos se abren con signed URLs temporales.
- El worker de Prompt 7 revalidará CSV, reservará créditos server-side y generará outputs.

## Pendiente para Prompt 7

- Worker real.
- Progreso real de jobs.
- Reserva/reembolso server-side de créditos.
- Procesamiento de filas.
- Generación de outputs CSV/HTML/report.
- Emails de job completado/fallido.
