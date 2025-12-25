# Candid Boys

Plataforma Laravel para un catálogo "tube" con búsqueda y curación de contenidos.

## Requisitos

- PHP 8.3+
- Extensiones: pdo, pdo_pgsql, mbstring, openssl, curl, json
- Composer 2
- Node.js 20+
- Docker + Docker Compose (para servicios externos)
- Redis
- Meilisearch
- (Opcional) Ollama u OpenAI

## Variables de entorno críticas

- `APP_NAME`, `APP_ENV`, `APP_DEBUG`, `APP_URL`, `APP_KEY`
- `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- `CACHE_STORE`, `QUEUE_CONNECTION`, `SESSION_DRIVER`
- `MEILISEARCH_HOST`, `MEILISEARCH_KEY`
- `AI_PROVIDER`, `OLLAMA_HOST`, `OLLAMA_MODEL`, `OPENAI_API_KEY`
- `PARTNER_CAMS_URL`, `PARTNER_MEMBERSHIP_URL`, `PARTNER_DATING_URL`
- `SENTRY_LARAVEL_DSN`, `SENTRY_ENABLED`
- `IFRAME_ALLOWLIST`, `ASSET_CDN_HOST`, `PUBLIC_CAPTCHA_ENABLED`

## Ejemplo de .env (mínimo)

```env
APP_NAME="Candid Boys"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://candidboys.example
APP_KEY=base64:...

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=candidboys
DB_USERNAME=candidboys
DB_PASSWORD=secret

REDIS_HOST=127.0.0.1
REDIS_PORT=6379

CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_KEY=masterKey

AI_PROVIDER=ollama
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b

PARTNER_CAMS_URL=https://partner.example/cams
PARTNER_MEMBERSHIP_URL=https://partner.example/members
PARTNER_DATING_URL=https://partner.example/dating

SENTRY_LARAVEL_DSN=
SENTRY_ENABLED=false

IFRAME_ALLOWLIST=player.example.com,*.cdn.example.com
ASSET_CDN_HOST=cdn.example.com
PUBLIC_CAPTCHA_ENABLED=false
```

## Arranque local

1. Instala dependencias PHP:
   ```bash
   composer install
   ```
2. Instala dependencias front-end y compila assets:
   ```bash
   npm install
   npm run build
   ```
3. Copia el `.env` y configura variables:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```
4. Ejecuta migraciones:
   ```bash
   php artisan migrate
   ```
5. Levanta servicios externos en Docker Compose (Redis, Meilisearch, etc.).

## Docker Compose (pipeline end-to-end)

Comandos principales:

```bash
docker compose up -d
docker compose logs -f worker
docker compose exec ollama ollama pull qwen2.5:7b
```

Servicios expuestos:

- App web: http://localhost:8080
- Meilisearch: http://localhost:7700
- Ollama: http://localhost:11434

Healthchecks y estado:

- Ver estado general:
  ```bash
  docker compose ps
  ```
- Inspeccionar logs:
  ```bash
  docker compose logs -f app
  docker compose logs -f worker
  docker compose logs -f scheduler
  ```

Notas:

- El contenedor `app` ejecuta `composer install` si falta `vendor/`, corre migraciones y arranca `php artisan serve` en `0.0.0.0:8080`.
- Los healthchecks están configurados para `db`, `redis`, `meili` y `ollama`.

## Build assets

En producción el contenedor es solo PHP, por lo que debes generar `public/build` fuera del contenedor:

```bash
npm ci
npm run build
```

Asegura que `public/build/manifest.json` exista antes de desplegar.

## Pipeline end-to-end

Comandos manuales si necesitas ejecutar el pipeline completo:

```bash
php artisan sources:import
php artisan videos:ai --limit=5000
php artisan videos:quality --limit=5000
php artisan videos:publish --daily=3000
php artisan sitemaps:generate
php artisan videos:check-embeds --limit=5000
```

Para ejecución continua usa el scheduler:

```bash
php artisan schedule:work
```

## Admin auth

El acceso admin usa usuarios en la tabla `users` con `is_admin = true`. Para crear/actualizar el admin desde `.env`:

```bash
php artisan admin:sync
```

## Variables .env obligatorias

- `APP_URL`
- `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- `MEILISEARCH_HOST`, `MEILISEARCH_KEY`
- `AI_PROVIDER` (por defecto `ollama`)
- `OLLAMA_HOST`, `OLLAMA_MODEL` (si usas `ollama`)
- `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL` (si usas `openai`)
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- `CTA_UTM_SOURCE`, `CTA_UTM_MEDIUM` (tracking CTAs)
- `ASSET_CDN_HOST` (si sirves estáticos desde CDN)

## Sanitización HTML

Se usa `mews/purifier`, que integra HTMLPurifier con una configuración segura y mantenida para limpiar embeds HTML. Esto ofrece un enfoque robusto frente a XSS, cumpliendo con el requisito de seguridad del pipeline.

## Configurar sources.settings

Ejemplo de settings para un feed JSON:

```json
{
  "items_path": "items",
  "mappings": {
    "external_id": "id",
    "embed_url": "embedUrl",
    "thumbnail_url": "thumb",
    "raw_title": "title",
    "raw_description": "description",
    "raw_tags": "tags",
    "duration_seconds": "duration",
    "source_url": "url"
  },
  "allow_iframe_domains": ["player.example.com"],
  "deny_keywords": ["banned", "copyright"]
}
```

## Ejemplos sources.settings

**FEED_JSON**

```json
{
  "items_path": "items",
  "mappings": {
    "external_id": "id",
    "embed_url": "embedUrl",
    "thumbnail_url": "thumb",
    "raw_title": "title",
    "raw_description": "description",
    "raw_tags": "tags",
    "duration_seconds": "duration",
    "source_url": "url"
  },
  "allow_iframe_domains": ["player.example.com", "*.cdn.example.com"],
  "deny_keywords": ["illegal", "underage"],
  "iframe_sandbox": "allow-scripts allow-same-origin allow-forms",
  "iframe_allow": "autoplay; fullscreen; picture-in-picture"
}
```

**FEED_XML**

```json
{
  "items_path": "//item",
  "mappings": {
    "external_id": "guid",
    "embed_url": "embedUrl",
    "thumbnail_url": "thumbnail",
    "raw_title": "title",
    "raw_description": "description",
    "raw_tags": "tags",
    "duration_seconds": "duration",
    "source_url": "link"
  },
  "allow_iframe_domains": ["player.example.com", "*.cdn.example.com"],
  "deny_keywords": ["illegal", "underage"],
  "iframe_sandbox": "allow-scripts allow-same-origin allow-forms",
  "iframe_allow": "autoplay; fullscreen; picture-in-picture"
}
```

## Monetización

Configura las CTAs en `config/candidboys.php` o vía variables de entorno:

- `PARTNER_CAMS_URL`, `PARTNER_CAMS_TEMPLATE`
- `PARTNER_MEMBERSHIP_URL`, `PARTNER_MEMBERSHIP_TEMPLATE`
- `PARTNER_DATING_URL`, `PARTNER_DATING_TEMPLATE`

Los clicks se registran en `cta_clicks` y se redirigen con UTM + `click_id`.

### Nuevos partners y personalización por categoría

- Partners globales:
  - Actualiza `config/candidboys.php` en `monetization.partner_links` o usa variables `PARTNER_*` para URLs y labels.
- Textos por categoría:
  - Edita `monetization.cta_templates` para definir copys por `category_slug`.
  - Ejemplo:
    ```php
    'cta_templates' => [
        'default' => 'Descubre más contenido y ofertas exclusivas.',
        'massage' => 'Más escenas premium de masaje.',
        'kink-soft' => 'Explora contenido exclusivo y seguro.',
    ],
    ```
- Overrides por source (opcional):
  - En `sources.settings` puedes definir `partner_links` para sobrescribir URLs/labels por feed:
    ```json
    {
      "partner_links": {
        "cams": { "url": "https://partner.example/cams", "label": "Watch live" },
        "membership": { "url": "https://partner.example/members", "label": "Watch full scene" },
        "dating": { "url": "https://partner.example/dating", "label": "Meet guys" }
      }
    }
    ```

## Monitoreo (Sentry)

Para activar el monitoreo de errores:

1. Añade `SENTRY_LARAVEL_DSN` en `.env`.
2. Define `SENTRY_ENABLED=true` (recomendado solo en `APP_ENV=production`).
3. (Opcional) ajusta `SENTRY_TRACES_SAMPLE_RATE` para performance tracing.

Para verificar:

- Genera un error controlado y valida que aparece en el panel de Sentry.

## Producción

- Define `APP_DEBUG=false`.
- Usa claves seguras y rotación de secrets.
- Recomienda un reverse proxy con HTTPS (Nginx/Traefik) delante de la app.

## Checklist de lanzamiento

- Configurar variables `PARTNER_*` para CTAs.
- Crear sources con allowlist correcto.
- Ejecutar `php artisan admin:sync` para el usuario admin.

## Checklist para producción

- Ejecutar tests:
  ```bash
  php artisan test
  ```
- Migraciones y seeders (si aplica):
  ```bash
  php artisan migrate --force
  php artisan db:seed --force
  ```
- Indexación de búsqueda:
  - Meilisearch (Scout):
    ```bash
    php artisan scout:import "App\\Models\\Video"
    ```
  - Fallback SQL: verificar que `MEILISEARCH_HOST` esté vacío o inaccesible para forzar fallback.
- Colas:
  ```bash
  php artisan queue:work --queue=default --sleep=3 --tries=3
  ```
  - Supervisor/systemd recomendado:
    - Supervisor: `command=php /path/to/artisan queue:work --queue=default --sleep=3 --tries=3`
    - systemd: `ExecStart=/usr/bin/php /path/to/artisan queue:work --queue=default --sleep=3 --tries=3`
- Cron / scheduler:
  ```bash
  * * * * * php /path/to/artisan schedule:run >> /dev/null 2>&1
  ```
  - Verifica tareas periódicas:
    - `php artisan sitemaps:generate`
    - `php artisan videos:check-embeds --limit=5000`
    - pipeline diario: `php artisan videos:publish --daily=3000`
- Monitoreo:
  - Configurar `SENTRY_LARAVEL_DSN` y `SENTRY_ENABLED=true`.
  - Validar logs en `storage/logs/laravel.log` y panel de Sentry.

## Runbook operativo

1. **Sincronizar admin**
   ```bash
   php artisan admin:sync
   ```
2. **Pipeline completo**
   ```bash
   php artisan sources:import
   php artisan videos:ai --limit=5000
   php artisan videos:quality --limit=5000
   php artisan videos:publish --daily=3000
   php artisan sitemaps:generate
   php artisan videos:check-embeds --limit=5000
   ```
3. **Troubleshooting rápido**
   - Si no hay sitemaps: verificar `public/sitemaps` y `storage/logs/laravel.log`.
   - Si no hay clicks: revisar `cta_clicks` y la URL de partner en `PARTNER_*`.
   - Si el admin no accede: ejecutar `php artisan admin:sync` y validar `is_admin`.

## Seguridad y proxy

- Configura el proxy/HTTPS en producción (`APP_URL` con https) y usa `ASSET_CDN_HOST` si sirves assets desde CDN.
- En entornos con proxy reverso, asegúrate de reenviar `X-Forwarded-*`.
- Ejecutar pipeline: import -> ai -> quality -> publish -> sitemaps -> check-embeds.
- Reindex Meilisearch: `php artisan scout:import "App\\Models\\Video"`.

## Diseño UI

- Mobile-first y responsivo.
- Header sticky con logo + búsqueda.
- Tarjetas con thumbnail 16:9.
- Tipografía legible y contraste alto.
- Espaciado amplio para lectura cómoda.
- Grid adaptable (1/2/3 columnas).
- Chips de tags/categorías claramente visibles.
- Footer con enlaces legales placeholders.
- Hover suave en tarjetas para indicar interacción.
- Imágenes con `loading="lazy"`.

## Admin (MVP)

- Login en `/admin/login` usando `ADMIN_EMAIL` y `ADMIN_PASSWORD`.
- Los videos al despublicar pasan a `ready` y **mantienen** `published_at` para conservar historial.
- Si el chequeo de embed falla, se marca `embed_ok=false` y tras 3 fallos consecutivos el video pasa a `broken`.

## Reindex en Meilisearch (Scout)

```bash
php artisan scout:import "App\\Models\\Video"
```

## Notas de configuración

- `config/candidboys.php` centraliza parámetros de seguridad, SEO, IA y monetización.
- Completa `categories_controlled` con la lista exacta de categorías definida en `SPEC.md`.

## Hotfixes

- Click-to-load del player sin JS inline (CSP compatible).
- /v/ renderiza BROKEN/QUARANTINE con noindex y aviso de disponibilidad.
- CSP soporta wildcards y dominios con esquema.
- Assets se compilan fuera del contenedor (no se ejecuta npm en Docker).

## Production hardening

- `/search` usa Meilisearch (Scout) si está disponible; si falla, hace fallback a SQL.
- Reindex manual:
  ```bash
  php artisan scout:import "App\\Models\\Video"
  ```
- Scheduler con `withoutOverlapping` + `onOneServer` y lock `pipeline:daily` para calidad/publicación/sitemaps.
- Compat layer en modelo `Video`: `seo_title`, `seo_description`, `quality_score`, `embed_last_checked_at` y `embed_last_ok_at` se normalizan vía accessors.

## Ops improvements

- El admin de sources muestra un diagnóstico de allow_iframe_domains con los últimos 10 videos y su estado.
- Ejemplos de allow_iframe_domains válidos: `example.com`, `*.example.com`, `https://player.example.com`.
