#!/bin/bash
BACKUP_DIR="/opt/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_URL="$DATABASE_URL"

mkdir -p $BACKUP_DIR

# Backup database
pg_dump "$DB_URL" | gzip > "$BACKUP_DIR/supachat_backup_$TIMESTAMP.sql.gz"

# Keep only last 7 days
find $BACKUP_DIR -name "supachat_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/supachat_backup_$TIMESTAMP.sql.gz"

