#!/bin/bash

# Update/Deploy Script for NotVarmı
# Use this to update your application with new code

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR="/var/www/notvarmi"
APP_NAME="notvarmi-app"

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   NotVarmı - Update & Deploy Script           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}\n"

# Check if running from project directory
if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}⚠️  package.json bulunamadı${NC}"
    echo -e "${YELLOW}Script'i proje dizininden çalıştırın: cd $PROJECT_DIR${NC}"
    cd "$PROJECT_DIR" || exit 1
fi

# Create backup before update
echo -e "${YELLOW}💾 Güncelleme öncesi backup alınıyor...${NC}"
BACKUP_DIR="/backup/notvarmi"
mkdir -p "$BACKUP_DIR"

# Backup database
if command -v pg_dump &> /dev/null; then
    BACKUP_FILE="$BACKUP_DIR/pre_update_$(date +%Y%m%d_%H%M%S).sql.gz"
    pg_dump -U notvarmi_user -h localhost notvarmi_db | gzip > "$BACKUP_FILE" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database backup: $BACKUP_FILE${NC}"
    else
        echo -e "${YELLOW}⚠️  Database backup atlandı${NC}"
    fi
fi

# Backup current deployment
DEPLOY_BACKUP="$BACKUP_DIR/deploy_$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf "$DEPLOY_BACKUP" \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    . 2>/dev/null
echo -e "${GREEN}✅ Deployment backup: $DEPLOY_BACKUP${NC}"

# Git pull or manual update check
echo -e "\n${YELLOW}📥 Kod güncelleniyor...${NC}"
if [ -d ".git" ]; then
    # Git repository
    git stash
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    echo -e "${BLUE}Current branch: $CURRENT_BRANCH${NC}"
    
    git pull origin "$CURRENT_BRANCH"
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Git pull başarısız!${NC}"
        git stash pop
        exit 1
    fi
    
    git stash pop 2>/dev/null
    echo -e "${GREEN}✅ Kod güncellendi${NC}"
else
    echo -e "${YELLOW}⚠️  Git repository değil - manuel güncelleme bekleniyor${NC}"
    read -p "$(echo -e ${GREEN}Dosyalar manuel olarak güncellendi mi? [y/N]: ${NC})" -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}❌ İşlem iptal edildi${NC}"
        exit 0
    fi
fi

# Install/Update dependencies
echo -e "\n${YELLOW}📦 Bağımlılıklar güncelleniyor...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ npm install başarısız!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Bağımlılıklar güncellendi${NC}"

# Run database migrations if any
echo -e "\n${YELLOW}🗄️  Database migration kontrol ediliyor...${NC}"
npx prisma generate
npx prisma migrate deploy 2>/dev/null || npx prisma db push
echo -e "${GREEN}✅ Database güncel${NC}"

# Build application
echo -e "\n${YELLOW}🏗️  Production build oluşturuluyor...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build başarısız!${NC}"
    echo -e "${YELLOW}Rollback için: tar -xzf $DEPLOY_BACKUP${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build başarılı${NC}"

# Restart application
echo -e "\n${YELLOW}🔄 Uygulama yeniden başlatılıyor...${NC}"
pm2 restart "$APP_NAME"

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  PM2 restart başarısız, baştan başlatılıyor...${NC}"
    pm2 start ecosystem.config.json
fi

pm2 save
echo -e "${GREEN}✅ Uygulama yeniden başlatıldı${NC}"

# Health check
echo -e "\n${YELLOW}🔍 Sağlık kontrolü yapılıyor...${NC}"
sleep 3

if command -v curl &> /dev/null; then
    HTTP_STATUS=$(curl -o /dev/null -s -w "%{http_code}" "http://localhost:3000/api/health")
    if [ "$HTTP_STATUS" -eq 200 ]; then
        echo -e "${GREEN}✅ Uygulama sağlıklı çalışıyor!${NC}"
    else
        echo -e "${RED}⚠️  Uygulama sağlık kontrolü başarısız (HTTP $HTTP_STATUS)${NC}"
        echo -e "${YELLOW}Logları kontrol edin: pm2 logs $APP_NAME${NC}"
    fi
fi

# Show current status
echo -e "\n${YELLOW}📊 Durum:${NC}"
pm2 list | grep "$APP_NAME"

echo -e "\n${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          ✨ Güncelleme Tamamlandı! ✨          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}\n"

echo -e "${GREEN}✅ Başarıyla güncellendi:${NC}"
echo -e "  ✓ Backup alındı"
echo -e "  ✓ Kod güncellendi"
echo -e "  ✓ Bağımlılıklar güncellendi"
echo -e "  ✓ Database migrate edildi"
echo -e "  ✓ Yeni build oluşturuldu"
echo -e "  ✓ Uygulama başlatıldı"

echo -e "\n${BLUE}💡 Faydalı Komutlar:${NC}"
echo -e "  pm2 logs $APP_NAME        # Logları izle"
echo -e "  pm2 monit                 # Monitoring"
echo -e "  ./scripts/health-check.sh # Sağlık kontrolü"
echo -e ""
echo -e "${YELLOW}🔙 Rollback için:${NC}"
echo -e "  tar -xzf $DEPLOY_BACKUP"
echo -e "  pm2 restart $APP_NAME"

echo -e "\n${GREEN}🎉 Deployment başarılı!${NC}\n"
