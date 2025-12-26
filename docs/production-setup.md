# Production setup

> Esta guía es operativa y no sustituye asesoría legal ni de seguridad. Ajusta los valores según tu infraestructura.

## Requisitos del servidor
- PHP 8.2+ con extensiones comunes (pdo, mbstring, openssl, json, curl).
- Base de datos (PostgreSQL o MySQL compatible con Laravel).
- Redis (cache, sesiones y colas).
- Meilisearch (búsqueda).
- Supervisor/daemon para workers de cola.
- Node.js para build de assets (Vite).

## Pasos de deploy
1. `composer install --no-dev --optimize-autoloader`
2. `php artisan key:generate` (si no existe `APP_KEY`)
3. `php artisan migrate --force`
4. `npm ci && npm run build`
5. `php artisan config:cache && php artisan route:cache && php artisan view:cache`
6. Ejecutar workers de cola (ej. `php artisan queue:work --tries=3 --timeout=90`)
7. Configurar cron/Job scheduler si aplica (`php artisan schedule:run`)

## Variables .env críticas
- `APP_ENV=production`, `APP_KEY`, `APP_URL`
- `DB_*` (host, database, username, password)
- `REDIS_*`
- `QUEUE_CONNECTION=redis`
- `SCOUT_DRIVER=meilisearch`, `MEILISEARCH_HOST`, `MEILISEARCH_KEY`
- `SENTRY_ENABLED=true|false`, `SENTRY_LARAVEL_DSN`
- `ANALYTICS_PROVIDER=none|plausible|ga4`
  - `PLAUSIBLE_DOMAIN` o `GA_MEASUREMENT_ID`
- CSP allowlists:
  - `CSP_SCRIPT_HOSTS`, `CSP_STYLE_HOSTS`, `CSP_IMG_HOSTS`, `CSP_CONNECT_HOSTS`, `CSP_FRAME_HOSTS`
  - `ANALYTICS_HOSTS` (para scripts externos de analítica)
- Captcha:
  - `PUBLIC_CAPTCHA_ENABLED`, `CAPTCHA_SITE_KEY`, `CAPTCHA_SECRET_KEY`
  - `ADMIN_LOGIN_CAPTCHA_ENABLED`
- UI legal:
  - `SHOW_ADULT_WARNING=true|false`
  - `COOKIE_BANNER_ENABLED=true|false`

## Rate limiting
Configurado en `config/candidboys.php` → `security.rate_limits` y aplicado desde `app/Providers/AppServiceProvider.php` (no se usa `app/Http/Kernel.php` en esta estructura):
- `/search` → `search`
- `/events/video` → `video_events`
- `/r/{video}/{ctaKey}` → CTA tracking
- `POST /contact` → `public_contact`
- `POST /takedown` → `public_takedown`
- `POST /admin/login` → `admin_login`
- `/admin/*` → `admin`

## Seguridad y observabilidad
- CSP y headers en `app/Http/Middleware/CspHeaders.php`.
- Health/metrics en `/health` y `/metrics`.
- Logs configurables en `config/logging.php`.

## Sitemaps y robots
- Sitemaps: `/sitemaps/index.xml` (categorías, tags, vídeos).
- `public/robots.txt` bloquea rutas internas sensibles.
