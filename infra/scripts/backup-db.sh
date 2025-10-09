#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"
BACKUP_DIR=${BACKUP_DIR:-/var/backups/tuweb}
mkdir -p "$BACKUP_DIR"

STAMP=$(date -u +"%Y%m%dT%H%M%SZ")
FILE="$BACKUP_DIR/postgres-$STAMP.sql.gz"

echo "Creating backup at $FILE"
pg_dump "$DATABASE_URL" | gzip > "$FILE"

find "$BACKUP_DIR" -type f -mtime +30 -name 'postgres-*.sql.gz' -delete
