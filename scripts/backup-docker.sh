#!/bin/bash

# ═══════════════════════════════════════════════════════════════════
# LazeePOS Database Backup Script (Docker Version)
# ═══════════════════════════════════════════════════════════════════
#
# This script runs inside the Docker container via docker-compose exec
#
# Usage:
#   docker-compose exec -T mysql bash -c /app/backup-docker.sh
#
# Or add to host crontab:
#   0 2 * * * cd /path/to/POS && docker-compose exec -T mysql bash -c /app/backup-docker.sh >> /var/log/lazeepos_backup.log 2>&1
#
# ═══════════════════════════════════════════════════════════════════

set -e

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/lazeepos_${TIMESTAMP}.sql"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting database backup inside container..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Dump database
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Dumping database..."
mysqldump \
  -h localhost \
  -u "${MYSQL_USER:-root}" \
  -p"${MYSQL_PASSWORD:-}" \
  --single-transaction \
  --quick \
  --lock-tables=false \
  "${MYSQL_DATABASE:-pos_db}" > "$BACKUP_FILE"

# Compress
gzip "$BACKUP_FILE"
BACKUP_FILE="${BACKUP_FILE}.gz"
SIZE=$(du -h "$BACKUP_FILE" | cut -f1)

echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Backup complete! Size: $SIZE"

# Clean up old backups
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Done!"
