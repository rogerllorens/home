# Rankelia.ai

**Rankelia.ai** es un SaaS B2B de ecommerce SEO con enfoque CSV-first para convertir catálogos de productos y categorías en contenido SEO listo para revisar e importar en Shopify, Prestashop, WooCommerce o CSV genérico.

## Estado de esta fase

El proyecto incluye:

- Landing pública premium con uploader visual, diagnóstico demo, pricing, FAQ y CTAs conectados al registro real.
- App privada cliente con mocks de CSV, jobs, descargas, créditos, plantillas, facturación y ajustes.
- Admin interno separado con backoffice mock para usuarios, jobs, créditos, plantillas, logs y operaciones.
- Supabase Auth real preparado para Next.js App Router con `@supabase/ssr`.
- Rutas `/app/*` protegidas para usuarios autenticados y `/admin/*` restringidas a `profiles.role = 'admin'`.
- SQL base para `profiles`, `credit_wallets`, `credit_transactions`, trigger de bienvenida y políticas RLS.

## Ejecutar en local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Configura en `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
```

Abrir `http://localhost:3000`.

## Configurar Supabase Auth

1. Crea un proyecto en Supabase.
2. Copia `Project URL` y `anon public key` a `.env.local`.
3. Ejecuta el SQL de `supabase/sql/001_auth_profiles.sql` en el SQL Editor de Supabase.
4. Revisa en Supabase Auth que Email/Password esté habilitado.
5. Prueba `/login?mode=register` y crea un usuario.
6. Si Supabase requiere confirmación, confirma el email antes de entrar.

## Crear el primer admin

No existe ningún botón público para convertirse en admin. Tras registrar tu usuario, ejecuta manualmente en Supabase:

```sql
update public.profiles set role = 'admin' where email = 'TU_EMAIL';
```

Después entra en `/admin`. Un usuario con rol `customer` será redirigido a la pantalla de acceso restringido.

## Seguridad y RLS

- No se usa `service_role` en frontend.
- `profiles`, `credit_wallets` y `credit_transactions` tienen RLS activado.
- Un customer solo puede leer sus propios datos.
- Un customer puede actualizar su perfil básico, pero no su rol ni su saldo.
- Los créditos reales, pagos y ajustes server-side quedan preparados para fases posteriores.

## Comandos útiles

```bash
npm run lint
npm run typecheck
npm run build
```

## Próximas fases previstas

- Prompt 6: Storage, subida CSV real, jobs reales, descargas reales y persistencia de lotes.
- Worker IA y procesamiento en segundo plano.
- Stripe Billing y compra de créditos.
- Admin conectado a datos reales, logs reales y costes IA.
