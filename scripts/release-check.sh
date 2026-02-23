#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

find includes dist/taxid-guard dist/taxid-guard-pro -name '*.php' -print0 | xargs -0 -n1 php -l

if command -v composer >/dev/null 2>&1; then
  composer run lint:phpcs
  composer run lint:phpstan
fi

if command -v phpunit >/dev/null 2>&1; then
  phpunit -c phpunit.xml.dist
else
  echo "phpunit not installed; skipping" >&2
fi
