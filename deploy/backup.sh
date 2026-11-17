#!/bin/sh
# Backup do banco: a cada BACKUP_INTERVAL_SECONDS grava um arquivo em /backups e apaga os
# mais velhos que BACKUP_RETENTION_DAYS dias. Roda no serviço "backup" do docker-compose.prod.yml.
# Formato custom do pg_dump (já comprimido). Restaurar: veja docs/04-deploy.md.
set -eu

RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
INTERVAL="${BACKUP_INTERVAL_SECONDS:-86400}"

while true; do
  ts="$(date -u +%Y%m%dT%H%M%SZ)"
  file="/backups/onlytasks-${ts}.dump"

  # Grava num arquivo temporário e só "publica" se o pg_dump terminou bem
  if pg_dump --format=custom --file="${file}.tmp"; then
    mv "${file}.tmp" "${file}"
    echo "backup ok: ${file} ($(wc -c < "${file}") bytes)"
  else
    rm -f "${file}.tmp"
    echo "backup FALHOU em ${ts}" >&2
  fi

  find /backups -name 'onlytasks-*.dump' -type f -mtime "+${RETENTION_DAYS}" -delete
  sleep "${INTERVAL}"
done
