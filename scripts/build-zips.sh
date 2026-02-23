#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/dist-release"
VERSION="${1:-}"

rm -rf "$OUT"
mkdir -p "$OUT"

LITE_STAGE="$(mktemp -d)/taxid-guard"
PRO_STAGE="$(mktemp -d)/taxid-guard-pro"
mkdir -p "$LITE_STAGE" "$PRO_STAGE"

copy_plugin () {
  local src="$1"; local dst="$2"
  rsync -a "$src/" "$dst/" \
    --exclude='.git' \
    --exclude='.github' \
    --exclude='tests' \
    --exclude='dist' \
    --exclude='node_modules' \
    --exclude='composer.*' \
    --exclude='phpstan*' \
    --exclude='phpcs*' \
    --exclude='README.md' \
    --exclude='CHANGELOG.md' \
    --exclude='scripts' \
    --exclude='build' \
    --exclude='dist-release'
}

copy_plugin "$ROOT" "$LITE_STAGE"
rm -f "$LITE_STAGE/uninstall.php" || true
cp "$ROOT/uninstall.php" "$LITE_STAGE/uninstall.php"

copy_plugin "$ROOT/dist/taxid-guard-pro" "$PRO_STAGE"

if [[ -n "$VERSION" ]]; then
  perl -0pi -e "s/(Version:\s*)[0-9.]+/\${1}$VERSION/" "$LITE_STAGE/taxid-guard.php"
  perl -0pi -e "s/(TG_VERSION',\s*')[0-9.]+(')/\${1}$VERSION\${2}/" "$LITE_STAGE/taxid-guard.php"
  perl -0pi -e "s/(Version:\s*)[0-9.]+/\${1}$VERSION/" "$PRO_STAGE/taxid-guard-pro.php"
  perl -0pi -e "s/(TG_PRO_VERSION',\s*')[0-9.]+(')/\${1}$VERSION\${2}/" "$PRO_STAGE/taxid-guard-pro.php"
fi

( cd "$(dirname "$LITE_STAGE")" && zip -qr "$OUT/taxid-guard.zip" "taxid-guard" )
( cd "$(dirname "$PRO_STAGE")" && zip -qr "$OUT/taxid-guard-pro.zip" "taxid-guard-pro" )

echo "Created release packages in $OUT"
