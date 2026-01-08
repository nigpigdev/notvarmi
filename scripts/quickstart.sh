#!/bin/bash

# Quick Start Deployment Script for NotVarmı
# This script automates the entire deployment process
# Run on VPS server: sudo ./quickstart.sh

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   NotVarmı - Hızlı Deployment Script          ║${NC}"
echo -e "${BLUE}║   Tüm adımları otomatik yapılandırır          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}\n"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ Bu script root yetkileriyle çalıştırılmalı!${NC}"
   echo -e "${YELLOW}Kullanım: sudo ./quickstart.sh${NC}"
   exit 1
fi

# Get user input
echo -e "${YELLOW}📝 Kurulum Bilgileri:${NC}\n"

read -p "$(echo -e ${GREEN}PostgreSQL veritabanı adı [notvarmi_db]: ${NC})" DB_NAME
DB_NAME=${DB_NAME:-notvarmi_db}

read -p "$(echo -e ${GREEN}PostgreSQL kullanıcı adı [notvarmi_user]: ${NC})" DB_USER
DB_USER=${DB_USER:-notvarmi_user}

read -sp "$(echo -e ${GREEN}PostgreSQL şifresi (güvenli): ${NC})" DB_PASS
echo

read -p "$(echo -e ${GREEN}Email adresiniz (SSL için): ${NC})" EMAIL

read -p "$(echo -e ${GREEN}Proje dizini [/var/www/notvarmi]: ${NC})" PROJECT_DIR
PROJECT_DIR=${PROJECT_DIR:-/var/www/notvarmi}

echo -e "\n${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Kurulum Özeti:${NC}"
echo -e "  Database: ${GREEN}$DB_NAME${NC}"
echo -e "  User: ${GREEN}$DB_USER${NC}"
echo -e "  Email: ${GREEN}$EMAIL${NC}"
echo -e "  Directory: ${GREEN}$PROJECT_DIR${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}\n"

read -p "$(echo -e ${GREEN}Devam etmek istiyor musunuz? [y/N]: ${NC})" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}❌ İşlem iptal edildi.${NC}"
    exit 0
fi

# Step 1: System dependencies
echo -e "\n${BLUE}[1/9]${NC} ${YELLOW}📦 Sistem bağımlılıkları kuruluyor...${NC}"
apt update
apt install -y curl git nginx postgresql postgresql-contrib

# Step 2: Node.js installation
echo -e "\n${BLUE}[2/9]${NC} ${YELLOW}📦 Node.js kuruluyor...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi
echo -e "${GREEN}✅ Node.js $(node -v) kuruldu${NC}"

# Step 3: PM2 installation
echo -e "\n${BLUE}[3/9]${NC} ${YELLOW}📦 PM2 kuruluyor...${NC}"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi
echo -e "${GREEN}✅ PM2 kuruldu${NC}"

# Step 4: PostgreSQL setup
echo -e "\n${BLUE}[4/9]${NC} ${YELLOW}🐘 PostgreSQL yapılandırılıyor...${NC}"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
echo -e "${GREEN}✅ PostgreSQL hazır${NC}"

# Step 5: Create .env file
echo -e "\n${BLUE}[5/9]${NC} ${YELLOW}⚙️  Environment variables oluşturuluyor...${NC}"
if [ ! -f "$PROJECT_DIR/.env" ]; then
    cat > "$PROJECT_DIR/.env" << EOF
DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME?schema=public"
NEXTAUTH_URL="https://www.notvarmi.com"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NODE_ENV="production"
EOF
    chmod 600 "$PROJECT_DIR/.env"
    echo -e "${GREEN}✅ .env dosyası oluşturuldu${NC}"
else
    echo -e "${YELLOW}⚠️  .env zaten mevcut, atlanıyor${NC}"
fi

# Step 6: Install dependencies and build
echo -e "\n${BLUE}[6/9]${NC} ${YELLOW}📦 Proje bağımlılıkları kuruluyor...${NC}"
cd "$PROJECT_DIR"
npm install
echo -e "${GREEN}✅ Bağımlılıklar kuruldu${NC}"

echo -e "\n${BLUE}[6/9]${NC} ${YELLOW}🗄️  Veritabanı şeması oluşturuluyor...${NC}"
npx prisma generate
npx prisma db push
echo -e "${GREEN}✅ Database schema uygulandı${NC}"

echo -e "\n${BLUE}[6/9]${NC} ${YELLOW}🏗️  Production build oluşturuluyor...${NC}"
npm run build
echo -e "${GREEN}✅ Build tamamlandı${NC}"

# Step 7: PM2 setup
echo -e "\n${BLUE}[7/9]${NC} ${YELLOW}🚀 PM2 ile uygulama başlatılıyor...${NC}"
mkdir -p /var/log/notvarmi
chown -R $SUDO_USER:$SUDO_USER /var/log/notvarmi

pm2 delete notvarmi-app 2>/dev/null || true
pm2 start "$PROJECT_DIR/ecosystem.config.json"
pm2 save
pm2 startup systemd -u $SUDO_USER --hp /home/$SUDO_USER > /tmp/pm2_startup.sh
bash /tmp/pm2_startup.sh
echo -e "${GREEN}✅ PM2 yapılandırıldı${NC}"

# Step 8: Nginx configuration
echo -e "\n${BLUE}[8/9]${NC} ${YELLOW}🌐 Nginx yapılandırılıyor...${NC}"
cp "$PROJECT_DIR/config/nginx-ssl.conf" /etc/nginx/sites-available/notvarmi
ln -sf /etc/nginx/sites-available/notvarmi /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
echo -e "${GREEN}✅ Nginx yapılandırıldı${NC}"

# Step 9: SSL setup
echo -e "\n${BLUE}[9/9]${NC} ${YELLOW}🔐 SSL sertifikası yapılandırılıyor...${NC}"
echo -e "${BLUE}Not: SSL kurulumu için setup-ssl.sh scriptini çalıştırın${NC}"
echo -e "${YELLOW}Komut: cd $PROJECT_DIR/scripts && sudo ./setup-ssl.sh${NC}"

# Setup backup cron
echo -e "\n${YELLOW}📅 Otomatik backup ayarlanıyor...${NC}"
chmod +x "$PROJECT_DIR/scripts"/*.sh
CRON_JOB="0 2 * * * $PROJECT_DIR/scripts/backup-postgres.sh >> /var/log/notvarmi-backup.log 2>&1"
(crontab -u $SUDO_USER -l 2>/dev/null | grep -v "backup-postgres.sh"; echo "$CRON_JOB") | crontab -u $SUDO_USER -
echo -e "${GREEN}✅ Backup cron job eklendi${NC}"

# Firewall setup
echo -e "\n${YELLOW}🔥 Firewall ayarlanıyor...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
echo -e "${GREEN}✅ Firewall aktif${NC}"

# Final summary
echo -e "\n${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          ✨ Kurulum Tamamlandı! ✨              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}\n"

echo -e "${GREEN}✅ Tamamlanan adımlar:${NC}"
echo -e "  ✓ Node.js, PostgreSQL, Nginx kuruldu"
echo -e "  ✓ Database oluşturuldu"
echo -e "  ✓ Uygulama build edildi"
echo -e "  ✓ PM2 ile başlatıldı"
echo -e "  ✓ Nginx yapılandırıldı"
echo -e "  ✓ Otomatik backup ayarlandı"

echo -e "\n${YELLOW}📋 Sonraki Adımlar:${NC}"
echo -e "  1. SSL sertifikası kur:"
echo -e "     ${GREEN}cd $PROJECT_DIR/scripts${NC}"
echo -e "     ${GREEN}sudo ./setup-ssl.sh${NC}"
echo -e ""
echo -e "  2. DNS ayarlarını kontrol et:"
echo -e "     ${GREEN}notvarmi.com     A    SUNUCU_IP${NC}"
echo -e "     ${GREEN}www.notvarmi.com A    SUNUCU_IP${NC}"
echo -e ""
echo -e "  3. Durum kontrol:"
echo -e "     ${GREEN}pm2 status${NC}"
echo -e "     ${GREEN}pm2 logs notvarmi-app${NC}"
echo -e ""
echo -e "  4. Siteye eriş:"
echo -e "     ${GREEN}http://SUNUCU_IP:3000${NC} (geçici)"
echo -e "     ${GREEN}https://www.notvarmi.com${NC} (SSL sonrası)"

echo -e "\n${BLUE}💡 Faydalı Komutlar:${NC}"
echo -e "  pm2 restart notvarmi-app  # Uygulamayı yeniden başlat"
echo -e "  pm2 logs notvarmi-app     # Logları görüntüle"
echo -e "  ./scripts/health-check.sh # Sağlık kontrolü"
echo -e "  ./scripts/backup-postgres.sh # Manuel backup"

echo -e "\n${GREEN}🎉 NotVarmı başarıyla deploy edildi!${NC}\n"
