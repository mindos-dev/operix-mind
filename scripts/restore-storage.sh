#!/usr/bin/env bash
set -euo pipefail

if [[ "${CONFIRM_RESTORE:-false}" != "true" ]]; then
  echo "Defina CONFIRM_RESTORE=true para restaurar."
  exit 1
fi

ARCHIVE_FILE="${1:-}"
TARGET_DIR="${TARGET_DIR:-storage}"
if [[ -z "$ARCHIVE_FILE" ]]; then
  echo "Informe o arquivo .tgz."
  exit 1
fi

mkdir -p "$TARGET_DIR"
tar -xzf "$ARCHIVE_FILE" -C "$TARGET_DIR"
