#!/usr/bin/env bash
# Publie l'APK debug sur GitHub Releases.
# Auth : gh auth login  OU  export GITHUB_TOKEN=ghp_...
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APK_SRC="$ROOT/frontend/android/app/build/outputs/apk/debug/app-debug.apk"
APK_NAME="tableau-de-bord-sante.apk"
TAG="${1:-app-v1.0.0}"
REPO="${GITHUB_REPO:-maleselo/weight_loss_tracker}"

GH=""
if command -v gh >/dev/null 2>&1; then
  GH="gh"
elif [ -x "$ROOT/.tools/gh" ]; then
  GH="$ROOT/.tools/gh"
else
  echo "GitHub CLI introuvable." >&2
  echo "  Option 1 : sudo apt install gh" >&2
  echo "  Option 2 : le script télécharge gh dans .tools/ au premier lancement" >&2
  if command -v curl >/dev/null 2>&1; then
    mkdir -p "$ROOT/.tools"
    echo "Téléchargement de gh dans .tools/…" >&2
    tmp="$(mktemp -d)"
    curl -fsSL -o "$tmp/gh.tgz" "https://github.com/cli/cli/releases/download/v2.69.0/gh_2.69.0_linux_amd64.tar.gz"
    tar -xzf "$tmp/gh.tgz" -C "$tmp"
    install -m 755 "$tmp/gh_2.69.0_linux_amd64/bin/gh" "$ROOT/.tools/gh"
    rm -rf "$tmp"
    GH="$ROOT/.tools/gh"
  else
    exit 1
  fi
fi

if [ ! -f "$APK_SRC" ]; then
  echo "APK introuvable. Lancez d'abord : cd frontend && npm run android:build" >&2
  exit 1
fi

if ! "$GH" auth status >/dev/null 2>&1; then
  if [ -z "${GITHUB_TOKEN:-}" ]; then
    echo "Connectez-vous à GitHub :" >&2
    echo "  $GH auth login" >&2
    echo "Ou définissez GITHUB_TOKEN (Personal Access Token avec scope repo)." >&2
    exit 1
  fi
  export GH_TOKEN="$GITHUB_TOKEN"
fi

cp "$APK_SRC" "/tmp/$APK_NAME"

if "$GH" release view "$TAG" --repo "$REPO" >/dev/null 2>&1; then
  echo "Release $TAG existe déjà — mise à jour de l'asset APK…" >&2
  "$GH" release upload "$TAG" "/tmp/$APK_NAME" --repo "$REPO" --clobber
else
  "$GH" release create "$TAG" "/tmp/$APK_NAME" \
    --repo "$REPO" \
    --title "Application Android $TAG" \
    --notes "APK Android pour synchroniser Health Connect (Samsung Health, Fitbit, Garmin…)."
fi

echo "Release : https://github.com/$REPO/releases/tag/$TAG"
