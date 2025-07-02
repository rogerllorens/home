#!/bin/bash
set -e
path=$(flutter pub cache list | grep photo_manager | head -n1 | awk '{print $NF}')
file="$path/android/build.gradle"
if [ -f "$file" ]; then
  if grep -q "agpJavaVersion" "$file"; then
    sed -i "/def agpJavaVersion/,+4c\    compileOptions {\n        sourceCompatibility JavaVersion.VERSION_1_8\n        targetCompatibility JavaVersion.VERSION_1_8\n    }" "$file"
    echo "Patched $file"
  fi
else
  echo "photo_manager not found in pub cache" >&2
fi
