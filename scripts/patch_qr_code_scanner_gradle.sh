#!/bin/bash
set -e
path=$(dirname $(flutter pub cache list | grep qr_code_scanner | head -n1 | awk '{print $NF}'))/android/build.gradle
if [ -f "$path" ]; then
  if ! grep -q "namespace" "$path"; then
    sed -i "1s/^/ext.set('namespace', 'com.juliuscanute.qr_code_scanner')\n/" "$path"
  fi
  echo "Patched $path"
else
  echo "qr_code_scanner not found in pub cache" >&2
fi
