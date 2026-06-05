#!/usr/bin/env bash
# Test local de POST /api/health-sync
# Usage :
#   export HEALTH_SYNC_TOKEN="votre-token"
#   ./scripts/test-health-sync.sh
#   ./scripts/test-health-sync.sh http://127.0.0.1:8000

set -euo pipefail

API_BASE="${1:-http://127.0.0.1:8000}"
TOKEN="${HEALTH_SYNC_TOKEN:-}"

if [ -z "$TOKEN" ]; then
  echo "Définir HEALTH_SYNC_TOKEN (identique à backend/.env)" >&2
  exit 1
fi

TODAY="$(date +%Y-%m-%d)"

echo "→ Sync vers ${API_BASE}/api/health-sync (date=${TODAY})"

curl -sS -w "\nHTTP %{http_code}\n" -X POST "${API_BASE}/api/health-sync" \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: ${TOKEN}" \
  -d "{
    \"date\": \"${TODAY}\",
    \"weight\": 78.4,
    \"step_count\": 8432,
    \"resting_heart_rate\": 62,
    \"body_fat_percentage\": 22.1,
    \"workout\": true,
    \"notes\": \"Sync test Samsung Health / Tasker\"
  }"

echo ""
echo "Alternative Bearer :"
echo "curl -X POST ${API_BASE}/api/health-sync \\"
echo "  -H 'Authorization: Bearer \${HEALTH_SYNC_TOKEN}' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"date\":\"${TODAY}\",\"step_count\":9000}'"
