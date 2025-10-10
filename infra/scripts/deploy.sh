#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/opt/app/infra/compose"
SSH_HOST="${SSH_HOST:-}" 

if [[ -z "$SSH_HOST" ]]; then
  echo "SSH_HOST env var required" >&2
  exit 1
fi

ssh "$SSH_HOST" <<'REMOTE'
set -euo pipefail
cd /opt/app/infra/compose
if [ ! -d .git ]; then
  echo "Warning: expected git repo with infra files" >&2
fi
docker compose pull
docker compose up -d
REMOTE

echo "Deployment triggered on $SSH_HOST"
