#!/usr/bin/env sh
# Backup sidecar loop: runs backup-db.sh every BACKUP_INTERVAL_HOURS (default 24).
set -eu
INTERVAL="${BACKUP_INTERVAL_HOURS:-24}"
while true; do
  /scripts/backup-db.sh scheduled || echo "[backup] FAILED at $(date -u)"
  sleep $((INTERVAL * 3600))
done
