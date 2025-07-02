#!/bin/bash
set -e
for file in android/app/build.gradle android/app/build.gradle.kts; do
  if [ -f "$file" ]; then
    if ! grep -q ndkVersion "$file"; then
      sed -i "/android {/a\    ndkVersion '27.0.12077973'" "$file"
      echo "Inserted ndkVersion in $file"
    fi
  fi
done
