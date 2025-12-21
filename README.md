# Candid Boys

Plataforma Laravel para un catálogo "tube" con búsqueda y curación de contenidos.

## Requisitos

- PHP 8.3+
- Composer 2
- Node.js 20+
- Docker + Docker Compose (para servicios externos)
- Redis
- Meilisearch

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

## Variables .env obligatorias

- `APP_URL`
- `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- `MEILISEARCH_HOST`, `MEILISEARCH_KEY`
- `AI_PROVIDER` (por defecto `ollama`)
- `OLLAMA_HOST`, `OLLAMA_MODEL` (si usas `ollama`)
- `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL` (si usas `openai`)
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`

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

## Producción

- Define `APP_DEBUG=false`.
- Usa claves seguras y rotación de secrets.
- Recomienda un reverse proxy con HTTPS (Nginx/Traefik) delante de la app.

## Checklist de lanzamiento

- Configurar variables `PARTNER_*` para CTAs.
- Crear sources con allowlist correcto.
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
