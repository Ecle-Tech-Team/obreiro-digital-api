#!/bin/bash
# Dump do banco em /backups/obreiro-AAAA-MM-DD-HHMM.sql.gz e limpeza dos antigos.
# Manual: docker compose exec backup bash /backup/backup.sh
set -euo pipefail

file="/backups/obreiro-$(date +%Y-%m-%d-%H%M).sql.gz"
MYSQL_PWD="$DB_PASSWORD" mysqldump -h db -u "$DB_USER" \
  --single-transaction --no-tablespaces --set-gtid-purged=OFF --default-character-set=utf8mb4 \
  "$DB_NAME" | gzip > "${file}.tmp"
mv "${file}.tmp" "$file"
find /backups -name 'obreiro-*.sql.gz' -mtime +"${BACKUP_KEEP_DAYS:-14}" -delete
echo "Backup salvo: $file ($(du -h "$file" | cut -f1))"
