#!/bin/sh
set -e

cd /app

# Railpack puts deps in /app/.venv; railpack.json adds it to PATH at deploy.
if [ -d /app/.venv/bin ]; then
  export PATH="/app/.venv/bin:$PATH"
fi

alembic upgrade head
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:?PORT is required}"
