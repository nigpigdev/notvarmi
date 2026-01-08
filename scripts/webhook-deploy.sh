#!/bin/bash

# Webhook Deploy Handler
# This script runs on the server and handles webhook deployments

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR="/var/www/notvarmi"
LOG_FILE="/var/log/notvarmi/webhook-deploy.log"

# Log function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "========================================="
log "Webhook deployment triggered"
log "========================================="

cd "$PROJECT_DIR" || exit 1

# Run update script
log "Running update script..."
./scripts/update.sh >> "$LOG_FILE" 2>&1

if [ $? -eq 0 ]; then
    log "✅ Deployment successful"
    echo "OK"
else
    log "❌ Deployment failed"
    echo "ERROR"
    exit 1
fi
