#!/bin/bash
set -e
# Set Kotlin jvmTarget to 17 across gradle scripts
PUB_CACHE_DIR="${PUB_CACHE:-$HOME/.pub-cache}"
if [ -d "$LOCALAPPDATA/Pub/Cache" ]; then
  PUB_CACHE_DIR="$LOCALAPPDATA/Pub/Cache"
fi
find "$PUB_CACHE_DIR" -path '*/android/build.gradle' -o -path '*/android/build.gradle.kts' | while read -r file; do
  if [ -f "$file" ]; then
    if grep -q "jvmTarget" "$file"; then
      sed -i "s/jvmTarget *= *['\"]\?[0-9]\+['\"]\?/jvmTarget = '17'/" "$file"
    else
      if grep -n "kotlinOptions" "$file" >/dev/null; then
        sed -i "/kotlinOptions {/a\        jvmTarget = '17'" "$file"
      else
        cat >> "$file" <<'EOT'

tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
    kotlinOptions {
        jvmTarget = "17"
    }
}
EOT
      fi
    fi
    echo "Patched $file"
  fi
done

for file in android/build.gradle android/build.gradle.kts android/app/build.gradle android/app/build.gradle.kts; do
  if [ -f "$file" ]; then
    if grep -q "jvmTarget" "$file"; then
      sed -i "s/jvmTarget *= *['\"]\?[0-9]\+['\"]\?/jvmTarget = '17'/" "$file"
    elif grep -n "kotlinOptions" "$file" >/dev/null; then
      sed -i "/kotlinOptions {/a\        jvmTarget = '17'" "$file"
    else
      cat >> "$file" <<'EOT'

tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
    kotlinOptions {
        jvmTarget = "17"
    }
}
EOT
    fi
    if grep -q "sourceCompatibility" "$file"; then
      sed -i "s/sourceCompatibility .*/sourceCompatibility JavaVersion.VERSION_17/" "$file"
      sed -i "s/targetCompatibility .*/targetCompatibility JavaVersion.VERSION_17/" "$file"
    fi
    echo "Patched $file"
  fi
done
