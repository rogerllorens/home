#!/bin/bash
set -e
for file in android/app/build.gradle android/app/build.gradle.kts; do
  [ -f "$file" ] || continue
  if [[ $file == *.kts ]]; then
    replace='ndkVersion = "27.0.12077973"'
  else
    replace="ndkVersion '27.0.12077973'"
  fi
  if grep -q ndkVersion "$file"; then
    sed -i -E "s/ndkVersion[^\n]*/$replace/" "$file"
  else
    sed -i "/android {/a\    $replace" "$file"
  fi
  echo "Ensured ndkVersion in $file"
done
