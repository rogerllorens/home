#!/bin/bash
set -e

# Create platform folders if missing
if [ ! -d android ]; then
  flutter create . --platforms=android,ios
fi
flutter pub get
scripts/patch_flutter_tesseract_gradle.sh
scripts/patch_photo_manager_gradle.sh
scripts/patch_qr_code_scanner_gradle.sh
scripts/patch_whatsapp_share_gradle.sh
scripts/patch_app_ndk.sh
scripts/patch_kotlin_jvm.sh
flutter build apk --debug
