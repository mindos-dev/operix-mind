# Backup and Restore

Scripts:

- `scripts/backup-postgres.sh`
- `scripts/restore-postgres.sh`
- `scripts/backup-storage.sh`
- `scripts/restore-storage.sh`

Backups should write to `backups/YYYY-MM-DD/`.

Restore operations should require explicit confirmation through environment variables.
