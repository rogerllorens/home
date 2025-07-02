#!/bin/bash
set -e
# Set Kotlin jvmTarget to 17 across gradle scripts
find "$HOME/.pub-cache" -path '*/android/build.gradle' -o -path '*/android/build.gradle.kts' | while read -r file; do
  if [ -f "$file" ]; then
    if ! grep -q "jvmTarget" "$file"; then
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
      echo "Patched $file"
    fi
  fi
done

for file in android/build.gradle android/build.gradle.kts android/app/build.gradle android/app/build.gradle.kts; do
  if [ -f "$file" ] && ! grep -q "jvmTarget" "$file"; then
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
    echo "Patched $file"
  fi
done
