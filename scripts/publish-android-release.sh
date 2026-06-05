#!/usr/bin/env bash
# Publie l'APK debug sur GitHub Releases (nécessite gh auth login).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APK_SRC="$ROOT/frontend/android/app/build/outputs/apk/debug/app-debug.apk"
APK_NAME="tableau-de-bord-sante.apk"
TAG="${1:-app-v1.0.0}"

if ! command -v gh >/dev/null 2>&1; then
  echo "Installez GitHub CLI : https://cli.github.com/" >&2
  exit 1
fi

if [ ! -f "$APK_SRC" ]; then
  echo "APK introuvable. Lancez d'abord : cd frontend && npm run android:build" >&2
  exit 1
fi

cp "$APK_SRC" "/tmp/$APK_NAME"
gh release create "$TAG" "/tmp/$APK_NAME" \
  --repo maleselo/weight_loss_tracker \
  --title "Application Android $TAG" \
  --notes "APK Android pour synchroniser Health Connect (Samsung Health, Fitbit, Garmin…)."

echo "Release : https://github.com/maleselo/weight_loss_tracker/releases/tag/$TAG"
