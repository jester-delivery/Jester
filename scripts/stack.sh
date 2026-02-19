#!/usr/bin/env bash
# Unified stack control: start/stop tot mediul local din root.
# Usage: ./scripts/stack.sh start | stop

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
COMPOSE="docker compose -f infra/docker/docker-compose.yml"

wait_for_postgres() {
  echo "  Aștept Postgres..."
  for i in 1 2 3 4 5 6 7 8 9 10; do
    if docker exec jester-postgres pg_isready -U postgres -q 2>/dev/null; then
      return 0
    fi
    sleep 1
  done
  echo "  Postgres nu a răspuns în 10s; continui oricum."
  return 0
}

cmd_start() {
  echo "=== Jester stack – start ==="
  $COMPOSE up -d
  wait_for_postgres
  echo "  DB status OK (Postgres)"

  echo "  Prisma generate + db push..."
  (cd "$ROOT/services/api" && npx prisma generate && npx prisma db push) || { echo "  Eroare Prisma."; exit 1; }

  echo "  Seed (dacă DB goală)..."
  (cd "$ROOT/services/api" && node scripts/seed-if-empty.js) || true

  (cd "$ROOT/services/api" && npm run dev) &
  (cd "$ROOT/apps/storefront" && npm run dev) &
  sleep 6

  HEALTH="$(curl -s -w "\n%{http_code}" http://localhost:4000/health 2>/dev/null)" || true
  HTTP_CODE="$(echo "$HEALTH" | tail -n1)"
  BODY="$(echo "$HEALTH" | head -n-1)"
  if [ "$HTTP_CODE" != "200" ] || [ -z "$BODY" ] || ! echo "$BODY" | grep -q '"status":"ok"'; then
    echo "  API failed to start (health: $HTTP_CODE)"
    fuser -k 4000/tcp 3001/tcp 2>/dev/null || true
    exit 1
  fi
  echo "  API running on http://localhost:4000"

  if curl -s -o /dev/null -w "" http://localhost:3001/ 2>/dev/null; then
    echo "  Web running on http://localhost:3001"
  else
    echo "  Web pornit (verifică http://localhost:3001)"
  fi
  echo "=== Stack pornit. Oprire: npm run stop ==="
}

cmd_stop() {
  echo "=== Jester stack – stop ==="
  fuser -k 4000/tcp 3001/tcp 2>/dev/null || true
  $COMPOSE down
  echo "=== Stack oprit ==="
}

case "${1:-}" in
  start) cmd_start ;;
  stop)  cmd_stop ;;
  *)    echo "Usage: $0 start | stop"; exit 1 ;;
esac
