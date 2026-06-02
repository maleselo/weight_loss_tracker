#!/bin/sh
set -e

cd /app
. /app/.venv/bin/activate

python -m alembic upgrade head
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:?PORT is required}"
