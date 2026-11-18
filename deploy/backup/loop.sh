#!/bin/bash
# Roda o backup todo dia no horário BACKUP_AT (fuso do container, TZ).
set -euo pipefail

at="${BACKUP_AT:-03:30}"
echo "Backup diário às ${at} (${TZ:-UTC}), guardando ${BACKUP_KEEP_DAYS:-14} dias em /backups."

while true; do
  now=$(date +%s)
  next=$(date -d "today ${at}" +%s)
  if [ "$next" -le "$now" ]; then next=$(date -d "tomorrow ${at}" +%s); fi
  sleep $((next - now))
  bash /backup/backup.sh || echo "Falha no backup de $(date '+%F %T')" >&2
done
