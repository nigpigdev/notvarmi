#!/bin/bash

# Rollback Script for NotVarmı
# Restore previous deployment or database

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BACKUP_DIR="/backup/notvarmi"
PROJECT_DIR="/var/www/notvarmi"

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   NotVarmı - Rollback Script                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}\n"

# List available backups
echo -e "${YELLOW}📋 Mevcut Backuplar:${NC}\n"

echo -e "${GREEN}Database Backups:${NC}"
ls -lht "$BACKUP_DIR"/*.sql.gz 2>/dev/null | head -5 || echo "  Backup bulunamadı"

echo -e "\n${GREEN}Deployment Backups:${NC}"
ls -lht "$BACKUP_DIR"/deploy_*.tar.gz 2>/dev/null | head -5 || echo "  Backup bulunamadı"

echo -e "\n${YELLOW}Rollback Seçenekleri:${NC}"
echo -e "  ${GREEN}1)${NC} Database rollback"
echo -e "  ${GREEN}2)${NC} Deployment rollback (kod)"
echo -e "  ${GREEN}3)${NC} Hem database hem deployment"
echo -e "  ${GREEN}4)${NC} İptal"

read -p "$(echo -e ${GREEN}Seçiminiz [1-4]: ${NC})" choice

case $choice in
    1)
        echo -e "\n${YELLOW}📝 Database backup dosyası seçin:${NC}"
        select backup in "$BACKUP_DIR"/*.sql.gz; do
            if [ -n "$backup" ]; then
                echo -e "${RED}⚠️  DİKKAT: Mevcut database silinecek!${NC}"
                read -p "$(echo -e ${RED}Devam etmek istediğinize emin misiniz? [y/N]: ${NC})" -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    echo -e "${YELLOW}Restoring from: $backup${NC}"
                    "$PROJECT_DIR/scripts/restore-postgres.sh" "$backup"
                fi
                break
            fi
        done
        ;;
    2)
        echo -e "\n${YELLOW}📝 Deployment backup dosyası seçin:${NC}"
        select backup in "$BACKUP_DIR"/deploy_*.tar.gz; do
            if [ -n "$backup" ]; then
                cd "$PROJECT_DIR" || exit 1
                pm2 stop notvarmi-app
                tar -xzf "$backup"
                npm install
                npm run build
                pm2 restart notvarmi-app
                echo -e "${GREEN}✅ Deployment rollback tamamlandı${NC}"
                break
            fi
        done
        ;;
    3)
        echo -e "${YELLOW}Hem database hem deployment rollback yapılacak...${NC}"
        # Database rollback
        echo -e "\n${YELLOW}Database backup seçin:${NC}"
        select db_backup in "$BACKUP_DIR"/*.sql.gz; do
            if [ -n "$db_backup" ]; then
                break
            fi
        done
        
        # Deployment rollback  
        echo -e "\n${YELLOW}Deployment backup seçin:${NC}"
        select deploy_backup in "$BACKUP_DIR"/deploy_*.tar.gz; do
            if [ -n "$deploy_backup" ]; then
                break
            fi
        done
        
        echo -e "\n${RED}⚠️  DİKKAT: Hem database hem deployment geri alınacak!${NC}"
        read -p "$(echo -e ${RED}Emin misiniz? [y/N]: ${NC})" -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            # Restore database
            "$PROJECT_DIR/scripts/restore-postgres.sh" "$db_backup"
            
            # Restore deployment
            cd "$PROJECT_DIR" || exit 1
            pm2 stop notvarmi-app
            tar -xzf "$deploy_backup"
            npm install
            npm run build
            pm2 restart notvarmi-app
            
            echo -e "${GREEN}✅ Tam rollback tamamlandı${NC}"
        fi
        ;;
    4)
        echo -e "${YELLOW}İşlem iptal edildi${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}Geçersiz seçim${NC}"
        exit 1
        ;;
esac

echo -e "\n${GREEN}✨ Rollback işlemi tamamlandı!${NC}\n"
