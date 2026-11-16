#!/usr/bin/env sh
# Verifies a backup: checksum, readable archive, and expected tables in the table of contents.
set -eu
FILE="${1:?usage: verify-backup.sh <file.dump>}"
[ -s "$FILE" ] || { echo "[verify] missing or empty: $FILE"; exit 1; }
if [ -f "$FILE.sha256" ]; then sha256sum -c "$FILE.sha256" >/dev/null || { echo "[verify] checksum mismatch"; exit 1; }; fi
TOC="$(pg_restore --list "$FILE")" || { echo "[verify] archive unreadable"; exit 1; }
for t in accounts profiles posts products services conversations notifications media_files; do
  echo "$TOC" | grep -q "TABLE DATA public $t " || { echo "[verify] table $t missing from backup"; exit 1; }
done
echo "$TOC" | grep -q "__drizzle_migrations" || { echo "[verify] migration history missing"; exit 1; }
echo "[verify] OK $FILE"
