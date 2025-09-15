#!/usr/bin/env bash
set -euo pipefail

# Configure PostgreSQL in a Docker container for LAN access.
# - Adds a pg_hba rule for your LAN subnet (scram-sha-256)
# - Sets listen_addresses='*' via ALTER SYSTEM (requires container restart)
# - Restarts the DB container and verifies settings
#
# Usage:
#   scripts/configure-pg-lan-access.sh <LAN_SUBNET_CIDR> [CONTAINER_NAME] [DB_NAME]
# Example:
#   scripts/configure-pg-lan-access.sh 192.168.1.0/24 pathfinder-db-dev pathfinder_dev
#
# Defaults:
#   CONTAINER_NAME: pathfinder-db-dev (from docker-compose.dev.yml)
#   DB_NAME:        pathfinder_dev

LAN_SUBNET=${1:-}
CONTAINER_NAME=${2:-pathfinder-db-dev}
DB_NAME=${3:-pathfinder_dev}
DB_USER=${DB_USER:-pathfinder}

if [[ -z "$LAN_SUBNET" ]]; then
  echo "Error: LAN subnet CIDR is required (e.g., 192.168.1.0/24)." >&2
  echo "Usage: $0 <LAN_SUBNET_CIDR> [CONTAINER_NAME] [DB_NAME]" >&2
  exit 1
fi

echo "[1/6] Checking container: $CONTAINER_NAME"
if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
  echo "Error: Container '$CONTAINER_NAME' is not running." >&2
  echo "Start it first, e.g.: docker compose -f docker-compose.dev.yml up -d db" >&2
  exit 1
fi

echo "[2/6] Adding pg_hba rule for $LAN_SUBNET (scram-sha-256) if missing"
docker exec -u postgres "$CONTAINER_NAME" sh -lc "\
  set -e; \
  HBA=\"\$PGDATA/pg_hba.conf\"; \
  if ! grep -q \"$LAN_SUBNET\" \"\$HBA\"; then \
    echo 'host all all $LAN_SUBNET scram-sha-256' >> \"\$HBA\"; \
    echo 'Added: host all all $LAN_SUBNET scram-sha-256'; \
  else \
    echo 'Rule already exists for $LAN_SUBNET'; \
  fi"

echo "[3/6] Set listen_addresses='*' and password_encryption='scram-sha-256'"
docker exec -u postgres "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -c "ALTER SYSTEM SET listen_addresses = '*'" >/dev/null
docker exec -u postgres "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -c "ALTER SYSTEM SET password_encryption = 'scram-sha-256'" >/dev/null

echo "[4/6] Reloading config (pg_hba)"
docker exec -u postgres "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -c "SELECT pg_reload_conf();" >/dev/null

echo "[5/6] Restarting container to apply listen_addresses"
docker restart "$CONTAINER_NAME" >/dev/null

echo "[6/6] Verifying settings"
# wait until Postgres is ready
for i in {1..30}; do
  if docker exec -u postgres "$CONTAINER_NAME" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
docker exec -u postgres "$CONTAINER_NAME" psql -h localhost -U "$DB_USER" -d "$DB_NAME" -t -A -c "SHOW listen_addresses;"
docker exec -u postgres "$CONTAINER_NAME" psql -h localhost -U "$DB_USER" -d "$DB_NAME" -t -A -c "SELECT inet_server_addr();"

cat <<EOF

Done. Next steps:
- Ensure your host firewall allows TCP 5432.
- Connect from LAN peers using:
  postgresql://<user>:<password>@<YOUR_HOST_LAN_IP>:5432/$DB_NAME

Tip: You can bind the published port to a specific host IP in docker-compose if needed, e.g.:
  ports:
    - "192.168.1.50:5432:5432"
EOF
