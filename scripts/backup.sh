#!/bin/bash

# ═══════════════════════════════════════════════════════════════════
# LazeePOS Database Backup Script
# ═══════════════════════════════════════════════════════════════════
# 
# Usage: 
#   Local backup:  ./backup.sh
#   With remote:   BACKUP_REMOTE_PATH="s3://my-bucket/backups" ./backup.sh
#
# Cron job (daily at 2 AM):
#   0 2 * * * cd /home/user/POS && ./scripts/backup.sh >> /var/log/lazeepos_backup.log 2>&1
#
# ═══════════════════════════════════════════════════════════════════

set -e

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | xargs)
fi

# Configuration
BACKUP_DIR="${BACKUP_DIR:-.backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/lazeepos_${TIMESTAMP}.sql"
LOG_FILE="${LOG_FILE:-/tmp/lazeepos_backup.log}"

# MySQL Configuration (from docker-compose or .env)
DB_HOST="${DB_HOST:-mysql}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-pos_db}"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASS:-}"

# Optional: Remote backup destination (S3, GCS, etc.)
# Example: BACKUP_REMOTE_PATH="s3://my-bucket/backups"
# Or: BACKUP_REMOTE_PATH="gs://my-bucket/backups"
BACKUP_REMOTE_PATH="${BACKUP_REMOTE_PATH:-}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting database backup..." | tee -a "$LOG_FILE"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Perform backup
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Dumping database to $BACKUP_FILE..." | tee -a "$LOG_FILE"

if [ -n "$DB_PASS" ]; then
  # With password
  mysqldump \
    -h "$DB_HOST" \
    -u "$DB_USER" \
    -p"$DB_PASS" \
    --port="$DB_PORT" \
    --single-transaction \
    --quick \
    --lock-tables=false \
    "$DB_NAME" > "$BACKUP_FILE"
else
  # Without password
  mysqldump \
    -h "$DB_HOST" \
    -u "$DB_USER" \
    --port="$DB_PORT" \
    --single-transaction \
    --quick \
    --lock-tables=false \
    "$DB_NAME" > "$BACKUP_FILE"
fi

# Check if backup was successful
if [ -f "$BACKUP_FILE" ]; then
  SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Backup successful! Size: $SIZE" | tee -a "$LOG_FILE"
  
  # Compress backup
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Compressing backup..." | tee -a "$LOG_FILE"
  gzip "$BACKUP_FILE"
  BACKUP_FILE="${BACKUP_FILE}.gz"
  SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Compressed size: $SIZE" | tee -a "$LOG_FILE"
  
  # Upload to remote if configured
  if [ -n "$BACKUP_REMOTE_PATH" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Uploading to remote: $BACKUP_REMOTE_PATH..." | tee -a "$LOG_FILE"
    
    # Try AWS CLI if S3 path
    if [[ "$BACKUP_REMOTE_PATH" == "s3://"* ]]; then
      if command -v aws &> /dev/null; then
        aws s3 cp "$BACKUP_FILE" "$BACKUP_REMOTE_PATH/$(basename $BACKUP_FILE)" \
          && echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Uploaded to S3" | tee -a "$LOG_FILE" \
          || echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  S3 upload failed" | tee -a "$LOG_FILE"
      else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  AWS CLI not installed, skipping S3 upload" | tee -a "$LOG_FILE"
      fi
    fi
    
    # Try gsutil if GCS path
    if [[ "$BACKUP_REMOTE_PATH" == "gs://"* ]]; then
      if command -v gsutil &> /dev/null; then
        gsutil cp "$BACKUP_FILE" "$BACKUP_REMOTE_PATH/" \
          && echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Uploaded to GCS" | tee -a "$LOG_FILE" \
          || echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  GCS upload failed" | tee -a "$LOG_FILE"
      else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  gsutil not installed, skipping GCS upload" | tee -a "$LOG_FILE"
      fi
    fi
  fi
  
  # Clean up old backups (keep only last N days)
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cleaning up old backups (keeping last $RETENTION_DAYS days)..." | tee -a "$LOG_FILE"
  find "$BACKUP_DIR" -name "lazeepos_*.sql.gz" -mtime +$RETENTION_DAYS -delete
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Old backups cleaned" | tee -a "$LOG_FILE"
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ Backup failed!" | tee -a "$LOG_FILE"
  exit 1
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup completed successfully!" | tee -a "$LOG_FILE"
