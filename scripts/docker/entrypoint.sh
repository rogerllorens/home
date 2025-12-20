#!/usr/bin/env sh
set -e

if [ ! -d vendor ]; then
  composer install --no-interaction --prefer-dist
fi

if [ "${APP_ENV:-}" = "local" ] && [ -z "${APP_KEY:-}" ]; then
  php artisan key:generate --force
fi

php artisan migrate --force

if [ "${APP_ENV:-}" = "local" ] && [ -f package-lock.json ]; then
  if command -v npm >/dev/null 2>&1; then
    npm ci
    npm run build
  fi
fi

php artisan serve --host=0.0.0.0 --port=8080
