#!/bin/bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="gpi_backup_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[backup] Starting backup: $FILENAME"

pg_dump "$DATABASE_URL" | gzip > "${BACKUP_DIR}/${FILENAME}"

echo "[backup] Done: ${BACKUP_DIR}/${FILENAME}"

# Keep only the last 30 backups
ls -t "${BACKUP_DIR}"/gpi_backup_*.sql.gz 2>/dev/null | tail -n +31 | xargs -r rm --
echo "[backup] Cleanup done."
