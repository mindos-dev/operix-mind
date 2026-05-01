#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="${SOURCE_DIR:-storage}"
BACKUP_DIR="${BACKUP_DIR:-backups/$(date +%F)}"
mkdir -p "$BACKUP_DIR"

tar -czf "$BACKUP_DIR/storage.tgz" -C "$SOURCE_DIR" .
echo "Backup de storage salvo em $BACKUP_DIR/storage.tgz"
