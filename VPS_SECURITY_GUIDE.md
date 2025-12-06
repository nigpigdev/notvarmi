# VPS Güvenlik Rehberi - XMRig Temizliği ve Kalıcı Koruma

Bu rehber, sunucunuzda tespit edilen XMRig (kripto madenciliği) zararlısının temizlenmesi ve gelecekte benzer saldırıların önlenmesi için adım adım talimatlar içerir.

---

## BÖLÜM 1: ACİL TEMİZLİK (İlk 10 Dakika)

### 1.1. Zararlı Process'i Durdur
```bash
# XMRig ve benzer madenci süreçlerini bul ve durdur
pkill -9 xmrig
pkill -9 miner
pkill -9 minerd

# Tüm şüpheli süreçleri kontrol et
ps aux | grep -E "xmrig|miner|crypto|mine" | grep -v grep
```

### 1.2. Zararlı Dosyaları Sil
```bash
# XMRig dosyasını sil
rm -rf /var/www/cnspocket/build-new/

# Başka şüpheli dizinleri kontrol et
find /var/www -name "xmrig*" -o -name "*miner*" 2>/dev/null
find /tmp -name "xmrig*" -o -name "*miner*" 2>/dev/null
find /home -name "xmrig*" -o -name "*miner*" 2>/dev/null

# Tüm bulunan dosyaları sil
# rm -rf [bulunan_dosya_yolu]
```

### 1.3. Crontab Kontrolü
```bash
# Kullanıcı crontab'larını kontrol et
crontab -l
cat /etc/crontab
ls -la /etc/cron.d/
ls -la /etc/cron.daily/
ls -la /etc/cron.hourly/

# Şüpheli girişleri göreceksin, bunları sil
crontab -e  # ve şüpheli satırları sil
```

### 1.4. SSH Anahtarlarını Kontrol Et
```bash
# Root ve kullanıcı SSH anahtarlarını kontrol et
cat /root/.ssh/authorized_keys
cat ~/.ssh/authorized_keys

# Tanımadığın anahtarları sil!
nano /root/.ssh/authorized_keys
nano ~/.ssh/authorized_keys
```

---

## BÖLÜM 2: ŞİFRE DEĞİŞİKLİKLERİ

### 2.1. Tüm Şifreleri Değiştir
```bash
# Root şifresi
passwd root

# Kendi kullanıcı şifren
passwd

# Veritabanı şifresi (PostgreSQL için)
sudo -u postgres psql
\password postgres
# Yeni şifre gir

# .env dosyasındaki DATABASE_URL'i güncelle
nano /var/www/cnspocket/.env
```

---

## BÖLÜM 3: SSH GÜVENLİĞİ

### 3.1. SSH Ayarları
```bash
# SSH config dosyasını düzenle
nano /etc/ssh/sshd_config
```

Aşağıdaki ayarları değiştir/ekle:
```
# Root login'i kapat
PermitRootLogin no

# Şifre ile girişi kapat (SSH anahtarı kullan)
PasswordAuthentication no

# Port değiştir (opsiyonel ama önerilir)
Port 2222

# Boş şifreleri engelle
PermitEmptyPasswords no

# Max authentication deneme sayısı
MaxAuthTries 3
```

### 3.2. SSH Anahtarı Oluştur (Yerel PC'den)
```bash
# Kendi bilgisayarında çalıştır
ssh-keygen -t ed25519 -C "your_email@example.com"

# Anahtarı sunucuya kopyala
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@server_ip
```

### 3.3. SSH'ı Yeniden Başlat
```bash
sudo systemctl restart sshd
```

> ⚠️ **ÖNEMLİ**: SSH anahtarını eklemeden ve test etmeden PasswordAuthentication'ı kapatma! Aksi halde sunucuya erişimi kaybedersin.

---

## BÖLÜM 4: FIREWALL (UFW)

### 4.1. UFW Kurulumu ve Yapılandırması
```bash
# UFW'yi kur (kurulu değilse)
apt update && apt install ufw -y

# Varsayılan kurallar
ufw default deny incoming
ufw default allow outgoing

# SSH'a izin ver (port değiştirdiysen yeni portu yaz)
ufw allow 22/tcp
# veya port değiştirdiysen:
# ufw allow 2222/tcp

# HTTP ve HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Firewall'u etkinleştir
ufw enable

# Durumu kontrol et
ufw status verbose
```

---

## BÖLÜM 5: FAIL2BAN (Brute Force Koruması)

### 5.1. Kurulum
```bash
apt install fail2ban -y
```

### 5.2. Yapılandırma
```bash
# Yerel konfigürasyon dosyası oluştur
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
nano /etc/fail2ban/jail.local
```

Aşağıdaki ayarları ekle/değiştir:
```ini
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 3

[sshd]
enabled = true
port = ssh
# veya port değiştirdiysen:
# port = 2222
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 86400
```

### 5.3. Fail2Ban'ı Başlat
```bash
systemctl enable fail2ban
systemctl restart fail2ban
systemctl status fail2ban

# Banlanan IP'leri görmek için
fail2ban-client status sshd
```

---

## BÖLÜM 6: SİSTEM GÜNCELLEMELERİ

```bash
# Sistemi güncelle
apt update && apt upgrade -y

# Otomatik güvenlik güncellemelerini etkinleştir
apt install unattended-upgrades -y
dpkg-reconfigure --priority=low unattended-upgrades
```

---

## BÖLÜM 7: CLOUDFLARE SSL DÜZELTMESİ

CPU'nun %100 olmasının bir diğer sebebi SSL redirect loop'uydu. Bunu düzeltmek için:

1. Cloudflare Dashboard'a gir
2. **SSL/TLS** menüsüne tıkla
3. **Encryption mode** ayarını **Full (strict)** yap

Bu, Cloudflare'in sunucunuza HTTPS ile bağlanmasını sağlar ve sonsuz yönlendirme döngüsünü kırar.

---

## BÖLÜM 8: UYGULAMAYI GÜNCELLE

Kod tarafındaki güvenlik güncellemelerini sunucuya çek:

```bash
cd /var/www/cnspocket

# Git ile güncellemeleri çek
git pull origin main

# Bağımlılıkları güncelle
npm install

# Uygulamayı yeniden build et
npm run build

# PM2 ile yeniden başlat
pm2 restart all
```

---

## BÖLÜM 9: İZLEME VE KONTROL

### 9.1. CPU/Memory Kontrolü
```bash
# Anlık durum
htop

# veya
top

# Disk kullanımı
df -h
```

### 9.2. Log İzleme
```bash
# SSH giriş denemeleri
tail -f /var/log/auth.log

# Nginx erişim logları
tail -f /var/log/nginx/access.log

# Uygulama logları (PM2)
pm2 logs
```

### 9.3. Aktif Bağlantıları Kontrol Et
```bash
# Aktif ağ bağlantıları
netstat -tulpn

# Dışarıya açık portlar
ss -tulpn
```

---

## KONTROL LİSTESİ

- [ ] XMRig ve ilgili dosyalar silindi
- [ ] Crontab temizlendi
- [ ] SSH anahtarları kontrol edildi
- [ ] Tüm şifreler değiştirildi
- [ ] SSH güvenlik ayarları yapılandırıldı
- [ ] UFW firewall aktif
- [ ] Fail2Ban kuruldu ve aktif
- [ ] Sistem güncellemeleri yapıldı
- [ ] Cloudflare SSL ayarı Full (strict) yapıldı
- [ ] Uygulama güncellemeleri çekildi ve deploy edildi
- [ ] CPU/Memory normale döndü
