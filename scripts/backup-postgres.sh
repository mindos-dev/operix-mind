#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL não configurado."
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-backups/$(date +%F)}"
mkdir -p "$BACKUP_DIR"

pg_dump "$DATABASE_URL" > "$BACKUP_DIR/postgres.sql"
echo "Backup salvo em $BACKUP_DIR/postgres.sql"
