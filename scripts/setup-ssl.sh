#!/bin/bash

# SSL Setup Script for NotVarmı
# This script automates SSL certificate installation with Let's Encrypt

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DOMAIN_WWW="www.notvarmi.com"
DOMAIN="notvarmi.com"
EMAIL="kaymakcioglu@2006.com"  # DEĞİŞTİRİN!
NGINX_CONFIG="/etc/nginx/sites-available/notvarmi"
WEBROOT="/var/www/certbot"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   SSL Setup - Let's Encrypt           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}\n"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ Bu script root yetkileriyle çalıştırılmalı!${NC}"
   echo -e "${YELLOW}Kullanım: sudo ./setup-ssl.sh${NC}"
   exit 1
fi

# Check email
if [ "$EMAIL" == "your-email@example.com" ]; then
    echo -e "${RED}❌ Lütfen script içindeki EMAIL değişkenini güncelleyin!${NC}"
    exit 1
fi

echo -e "${YELLOW}🔍 Sistem kontrolleri...${NC}\n"

# Check if Nginx is installed
if ! command -v nginx &> /dev/null; then
    echo -e "${RED}❌ Nginx kurulu değil!${NC}"
    echo -e "${YELLOW}Kurulum: sudo apt install nginx${NC}"
    exit 1
fi

# Check if Certbot is installed
if ! command -v certbot &> /dev/null; then
    echo -e "${YELLOW}📦 Certbot kuruluyor...${NC}"
    apt update
    apt install -y certbot python3-certbot-nginx
else
    echo -e "${GREEN}✅ Certbot zaten kurulu${NC}"
fi

# Create webroot for ACME challenge
echo -e "\n${YELLOW}📁 Webroot dizini oluşturuluyor...${NC}"
mkdir -p $WEBROOT

# Check if domains are accessible
echo -e "\n${YELLOW}🌐 Domain erişilebilirliği kontrol ediliyor...${NC}"
for domain in $DOMAIN_WWW $DOMAIN; do
    if ping -c 1 -W 2 $domain &> /dev/null 2>&1; then
        echo -e "${GREEN}✅ $domain erişilebilir${NC}"
    else
        echo -e "${YELLOW}⚠️  $domain erişilemiyor (DNS yayılması bekleniyor olabilir)${NC}"
    fi
done

# Ask for confirmation
echo -e "\n${YELLOW}SSL sertifikası aşağıdaki domainler için alınacak:${NC}"
echo -e "  - $DOMAIN_WWW"
echo -e "  - $DOMAIN"
echo -e "${YELLOW}Email: $EMAIL${NC}\n"
read -p "$(echo -e ${GREEN}Devam etmek istiyor musunuz? [y/N]: ${NC})" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}❌ İşlem iptal edildi.${NC}"
    exit 0
fi

# Stop Nginx temporarily
echo -e "\n${YELLOW}⏸️  Nginx durduruluyor...${NC}"
systemctl stop nginx

# Obtain SSL certificate
echo -e "\n${YELLOW}🔐 SSL sertifikası alınıyor...${NC}"
certbot certonly \
    --standalone \
    --preferred-challenges http \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN_WWW \
    -d $DOMAIN

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ SSL sertifikası alınamadı!${NC}"
    systemctl start nginx
    exit 1
fi

echo -e "${GREEN}✅ SSL sertifikası başarıyla alındı!${NC}"

# Copy Nginx SSL config
echo -e "\n${YELLOW}📝 Nginx SSL konfigürasyonu uygulanıyor...${NC}"
if [ -f "/var/www/notvarmi/config/nginx-ssl.conf" ]; then
    cp /var/www/notvarmi/config/nginx-ssl.conf $NGINX_CONFIG
    echo -e "${GREEN}✅ Nginx config kopyalandı${NC}"
else
    echo -e "${RED}⚠️  nginx-ssl.conf bulunamadı - manuel konfigürasyon gerekli${NC}"
fi

# Test Nginx configuration
echo -e "\n${YELLOW}🧪 Nginx konfigürasyonu test ediliyor...${NC}"
nginx -t

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Nginx konfigürasyonu hatalı!${NC}"
    exit 1
fi

# Start Nginx
echo -e "\n${YELLOW}▶️  Nginx başlatılıyor...${NC}"
systemctl start nginx
systemctl enable nginx

# Setup auto-renewal
echo -e "\n${YELLOW}🔄 Otomatik sertifika yenileme ayarlanıyor...${NC}"

# Test renewal
certbot renew --dry-run

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Otomatik yenileme testi başarılı${NC}"
    
    # Add cron job for auto-renewal
    CRON_JOB="0 0,12 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'"
    (crontab -l 2>/dev/null | grep -v "certbot renew"; echo "$CRON_JOB") | crontab -
    echo -e "${GREEN}✅ Cron job eklendi (günde 2 kez kontrol)${NC}"
else
    echo -e "${RED}⚠️  Otomatik yenileme testi başarısız${NC}"
fi

# Display certificate info
echo -e "\n${BLUE}════════════════════════════════════════${NC}"
echo -e "${GREEN}✨ SSL Kurulumu Tamamlandı! ✨${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}📋 Sertifika Bilgileri:${NC}"
certbot certificates

echo -e "\n${YELLOW}🔗 Siteye erişim:${NC}"
echo -e "  https://$DOMAIN_WWW"
echo -e "  https://$DOMAIN"

echo -e "\n${YELLOW}💡 Faydalı Komutlar:${NC}"
echo -e "  Sertifika yenile:      ${GREEN}sudo certbot renew${NC}"
echo -e "  Sertifikaları listele: ${GREEN}sudo certbot certificates${NC}"
echo -e "  Sertifika sil:         ${GREEN}sudo certbot delete${NC}"
echo -e "  Nginx reload:          ${GREEN}sudo systemctl reload nginx${NC}"

echo -e "\n${GREEN}✅ HTTPS artık aktif!${NC}\n"
