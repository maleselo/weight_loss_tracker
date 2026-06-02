#!/bin/sh
set -e

cd /app

/app/.venv/bin/python -m alembic upgrade head
exec /app/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port "${PORT:?PORT is required}"
