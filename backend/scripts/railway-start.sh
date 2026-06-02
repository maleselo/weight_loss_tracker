#!/bin/sh
set -e

cd /app

# Railpack installs packages under /app/.venv, but .venv/bin/python is often a
# broken symlink to mise at runtime. Use mise python + venv site-packages instead.
if [ -d /app/.venv/lib ]; then
  SITE_PACKAGES=$(ls -d /app/.venv/lib/python*/site-packages 2>/dev/null | head -1)
  if [ -n "$SITE_PACKAGES" ]; then
    export PYTHONPATH="$SITE_PACKAGES${PYTHONPATH:+:$PYTHONPATH}"
  fi
fi

python -m alembic upgrade head
exec python -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT:?PORT is required}"
