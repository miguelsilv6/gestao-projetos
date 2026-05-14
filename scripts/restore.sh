#!/bin/bash
set -euo pipefail

BACKUP_FILE="${1:-}"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file.sql.gz>"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: file not found: $BACKUP_FILE"
  exit 1
fi

echo "[restore] Restoring from: $BACKUP_FILE"
gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL"
echo "[restore] Done."
