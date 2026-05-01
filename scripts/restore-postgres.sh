#!/usr/bin/env bash
set -euo pipefail

if [[ "${CONFIRM_RESTORE:-false}" != "true" ]]; then
  echo "Defina CONFIRM_RESTORE=true para restaurar."
  exit 1
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL não configurado."
  exit 1
fi

BACKUP_FILE="${1:-}"
if [[ -z "$BACKUP_FILE" ]]; then
  echo "Informe o arquivo de backup."
  exit 1
fi

psql "$DATABASE_URL" < "$BACKUP_FILE"
