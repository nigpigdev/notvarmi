#!/bin/bash

# Local Deploy Script
# Run this locally to deploy changes to production server

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SERVER_USER="root"
SERVER_HOST="YOUR_SERVER_IP"  # Sunucu IP'nizi buraya yazın
PROJECT_DIR="/var/www/notvarmi"

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Local → Production Deploy                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}\n"

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}⚠️  Uncommitted changes bulundu!${NC}\n"
    git status -s
    echo -e "\n${YELLOW}Bu değişiklikler deploy edilmeyecek.${NC}"
    read -p "$(echo -e ${GREEN}Devam etmek istiyor musunuz? [y/N]: ${NC})" -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

# Current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo -e "${BLUE}📍 Current branch: ${YELLOW}$CURRENT_BRANCH${NC}"

# Push to GitHub
echo -e "\n${YELLOW}📤 Pushing to GitHub...${NC}"
git push origin "$CURRENT_BRANCH"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Git push başarısız!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Code pushed to GitHub${NC}"

# SSH to server and deploy
echo -e "\n${YELLOW}🚀 Deploying to production server...${NC}"
ssh "$SERVER_USER@$SERVER_HOST" << 'ENDSSH'
cd /var/www/notvarmi
./scripts/update.sh
ENDSSH

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}╔════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║          ✨ Deploy Başarılı! ✨                ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}\n"
    
    echo -e "${GREEN}✅ Deployment tamamlandı!${NC}"
    echo -e "${BLUE}🔗 Site: https://www.notvarmi.com${NC}"
else
    echo -e "\n${RED}❌ Deployment başarısız!${NC}"
    echo -e "${YELLOW}Sunucu loglarını kontrol edin: ssh $SERVER_USER@$SERVER_HOST 'pm2 logs notvarmi-app'${NC}"
    exit 1
fi
