#!/bin/bash
set -e
path=$(dirname $(flutter pub cache list | grep flutter_tesseract_ocr | head -n1 | awk '{print $NF}'))/android/build.gradle
if [ -f "$path" ]; then
  if ! grep -q "namespace" "$path"; then
    sed -i "1s/^/ext.set('namespace', 'io.paratoner.flutter_tesseract_ocr')\n/" "$path"
  fi
  echo "Patched $path"
else
  echo "flutter_tesseract_ocr not found in pub cache" >&2
fi
