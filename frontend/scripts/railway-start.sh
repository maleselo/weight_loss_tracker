#!/bin/sh
set -e

cd /app

API_URL="${VITE_API_URL:-}"
API_URL="${API_URL%/}"

# Runtime config: Vite env vars are build-time only; inject at container start.
{
  printf '%s\n' 'window.__API_URL__ = "'"$API_URL"'";'
} > dist/runtime-config.js

exec serve -s dist -l "tcp://0.0.0.0:${PORT:-3000}"
