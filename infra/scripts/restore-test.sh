#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <backup-file.sql.gz>" >&2
  exit 1
fi

BACKUP_PATH="$1"
if [[ ! -f "$BACKUP_PATH" ]]; then
  echo "Backup file not found: $BACKUP_PATH" >&2
  exit 1
fi

STAGING_URL="${STAGING_DB_URL:-postgres://app:password@staging-postgres:5432/app}"

echo "[restore] dropping temp schema on staging"
PGPASSWORD="${STAGING_DB_PASSWORD:-app}" psql "$STAGING_URL" -c 'DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;'

echo "[restore] restoring $BACKUP_PATH"
gzip -dc "$BACKUP_PATH" | PGPASSWORD="${STAGING_DB_PASSWORD:-app}" psql "$STAGING_URL"

echo "[restore] running migrations"
if [[ -d ../../api ]]; then
  ( cd ../../api && npm run prisma:migrate deploy )
else
  echo "Warning: prisma migrate skipped (api not checked out)"
fi

echo "[restore] completed"
