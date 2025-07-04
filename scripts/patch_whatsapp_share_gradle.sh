#!/bin/bash
set -e
path=$(dirname $(flutter pub cache list | grep whatsapp_share | head -n1 | awk '{print $NF}'))/android/build.gradle
if [ -f "$path" ]; then
  if ! grep -q "namespace" "$path"; then
    sed -i "1s/^/ext.set('namespace', 'com.cybrix.chatshare')\n/" "$path"
  fi
  echo "Patched $path"
else
  echo "whatsapp_share not found in pub cache" >&2
fi
