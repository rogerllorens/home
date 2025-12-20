#!/usr/bin/env sh
set -e

if [ ! -d vendor ]; then
  composer install --no-interaction --prefer-dist
fi

if [ "${APP_ENV:-}" = "local" ] && [ -z "${APP_KEY:-}" ]; then
  php artisan key:generate --force
fi

php artisan migrate --force

if [ "${APP_ENV:-}" != "local" ] && [ ! -f public/build/manifest.json ]; then
  echo "WARNING: public/build/manifest.json is missing. Build assets before production deploy."
fi

php artisan serve --host=0.0.0.0 --port=8080
