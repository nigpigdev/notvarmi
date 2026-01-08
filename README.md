# NotVarmı - Üniversite Öğrenci Platformu

NotVarmı, üniversite öğrencileri için ders notları paylaşma, forum, mesajlaşma ve görev yönetimi platformudur.

## 🚀 Özellikler

- 📝 **Forum**: Ders konuları hakkında soru-cevap
- 📚 **Not Paylaşımı**: Ders notlarını yükle ve paylaş
- 💬 **Mesajlaşma**: Öğrenciler arası direkt mesajlaşma
- ✅ **Görev Yönetimi**: Ödev ve projeleri takip et
- 🎨 **Tema Desteği**: Light/Dark mode
- 🔒 **Güvenli**: Modern güvenlik standartları
- 📱 **Responsive**: Mobil ve masaüstü uyumlu

## 💻 Teknolojiler

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js
- **UI**: React 18, Custom CSS
- **Deployment**: Node.js, PM2, Nginx

## 📋 Sistem Gereksinimleri

- Node.js 18.x veya üzeri
- PostgreSQL 14.x veya üzeri
- npm veya yarn

## 🛠️ Lokal Development

```bash
# Repository'yi klonla
git clone <repo-url>
cd notvarmi

# Bağımlılıkları kur
npm install

# .env dosyası oluştur
cp .env.example .env
# .env dosyasını düzenle (DATABASE_URL, NEXTAUTH_SECRET vb.)

# Veritabanı şemasını oluştur
npx prisma db push

# Development server'ı başlat
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışacak.

## 🚀 Production Deployment

**Detaylı deployment talimatları için**: [`SUNUCU_KURULUM.md`](./SUNUCU_KURULUM.md)

### Hızlı Başlangıç

1. VPS sunucunuza bağlanın
2. PostgreSQL ve Node.js kurun
3. Projeyi klonlayın
4. `.env` dosyası oluşturun
5. `npm install && npm run build`
6. PM2 ile başlatın
7. Nginx reverse proxy kurun
8. SSL sertifikası alın

**Tahmini süre**: 30-45 dakika

### 📚 Deployment Dokümantasyonu

- **[SUNUCU_KURULUM.md](./SUNUCU_KURULUM.md)** - Sunucuda yapılacaklar (özet)
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Detaylı deployment rehberi
- **[BACKUP_GUIDE.md](./BACKUP_GUIDE.md)** - Veritabanı yedekleme

## 💾 Backup & Restore

```bash
# Backup al
cd scripts
./backup-postgres.sh

# Restore et
./restore-postgres.sh /backup/notvarmi/backup_YYYYMMDD.sql.gz
```

Otomatik günlük backup için cron job kurulumu: [`BACKUP_GUIDE.md`](./BACKUP_GUIDE.md)

## 📁 Proje Yapısı

```
notvarmi/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── forum/             # Forum sayfaları
│   ├── messages/          # Mesajlaşma
│   ├── notes/             # Not yönetimi
│   └── ...
├── components/            # React bileşenleri
├── lib/                   # Yardımcı fonksiyonlar
│   ├── auth.js           # NextAuth config
│   └── prisma.js         # Prisma client
├── prisma/
│   └── schema.prisma     # Database schema
├── public/               # Statik dosyalar
├── scripts/              # Yardımcı scriptler
│   ├── backup-postgres.sh
│   └── restore-postgres.sh
└── styles/               # CSS dosyaları
```

## 🔧 Kullanışlı Komutlar

```bash
# Development
npm run dev              # Dev server başlat
npm run build           # Production build
npm start               # Production mode başlat

# Database
npx prisma studio       # Database GUI
npx prisma db push      # Schema'yı DB'ye uygula
npx prisma generate     # Prisma client oluştur
npx prisma migrate dev  # Migration oluştur

# Linting
npm run lint            # ESLint çalıştır
```

## 🔐 Güvenlik

- HTTPS zorunlu (HSTS header)
- XSS koruması
- SQL injection koruması (Prisma ORM)
- CSRF koruması (NextAuth)
- Rate limiting (API routes)
- Secure headers (next.config.js)

## 🐛 Sorun Giderme

### Build Hatası
```bash
rm -rf node_modules .next
npm install
npm run build
```

### Database Bağlantı Hatası
- `DATABASE_URL` formatını kontrol edin
- PostgreSQL servisinin çalıştığını doğrulayın

### Production'da Hata
```bash
# PM2 loglarını kontrol et
pm2 logs notvarmi

# Nginx loglarını kontrol et
sudo tail -f /var/log/nginx/error.log
```

## 📞 Destek ve Katkı

Sorularınız için GitHub Issues kullanabilirsiniz.

## 📄 Lisans

[MIT License](LICENSE)

---

**Not**: Production deployment öncesi mutlaka [`SUNUCU_KURULUM.md`](./SUNUCU_KURULUM.md) dosyasını okuyun.
