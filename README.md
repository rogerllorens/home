# Currículum del Amor - Beta Launch Ready

## Requisitos
- Node 20+
- Proyecto Supabase
- Bucket `profile-photos`

## Variables de entorno
Copiar `.env.example` a `.env.local` y completar:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (solo server)
- `NEXT_PUBLIC_SITE_URL`

## Setup local
1. `npm install`
2. Ejecutar SQL: `supabase/schema.sql` y `supabase/policies.sql`
3. Crear bucket `profile-photos`
4. `npm run dev`

## Deploy Vercel
1. Importar repo en Vercel.
2. Configurar variables de entorno del proyecto.
3. Definir `NEXT_PUBLIC_SITE_URL` con dominio final.
4. Deploy.

## Seguridad y privacidad implementada
- Middleware para rutas privadas.
- RLS en tablas de dominio.
- Validación server-side para guardado, export y reportes.
- Límite básico de rate limit para reportes.
- Perfil público/privado respetado en perfil público.
- Página safety/cookies/privacy/terms.

## QA checklist pre-beta
- Registro/login
- Crear/editar CV
- Subida foto
- Perfil público y privado
- Story export 9:16
- Reportar perfil
- Borrar cuenta
- Mobile responsive

## Notas
- Analytics preparado en `lib/analytics.ts` para integración con PostHog/Plausible.
- SEO base listo con metadata global, robots y sitemap.

## Buzón de Currículums (nuevo)
- Rutas: `/dashboard/inbox`, `/dashboard/inbox/[id]`, `/dashboard/sent`, `/dashboard/sent/[id]`.
- En perfil público se habilita “Solicitar entrevista” con formulario seguro.
- Anti-spam: límite diario, bloqueo de duplicados pendientes y rate limit API.
- Estados: pending, accepted, rejected, archived, cancelled.

## Checklist de pruebas buzón
- [ ] Enviar candidatura desde `/u/[username]`
- [ ] Ver candidatura en inbox receptor
- [ ] Aceptar/rechazar/archivar desde detalle
- [ ] Ver estado en candidaturas enviadas
- [ ] Evitar auto-solicitud
- [ ] Evitar duplicado pendiente
- [ ] Límite de 5 solicitudes/día (gratis)
