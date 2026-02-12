#!/usr/bin/env bash
set -euo pipefail

DB_USER="${POSTGRES_USER:-postgres}"
DB_PASSWORD="${POSTGRES_PASSWORD:-postgres}"

echo "[fix-db-auth] Starting db service..."
docker compose up -d db

echo "[fix-db-auth] Resetting role password for user '${DB_USER}'..."
docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "ALTER USER \"${DB_USER}\" WITH PASSWORD '${DB_PASSWORD}';"

echo "[fix-db-auth] Starting api and web services..."
docker compose up -d api web

echo "[fix-db-auth] Done."
docker compose ps
