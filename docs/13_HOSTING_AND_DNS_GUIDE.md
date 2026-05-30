# 🚀 Panduan Hosting & Deployment LazeePOS (Tanpa Docker)

Karena LazeePOS adalah aplikasi SaaS Multi-Tenant (menggunakan *subdomain* dinamis untuk setiap toko), *routing* dan DNS memegang peranan sangat penting. Jika Anda mengalami kesulitan dengan *routing* Docker, **metode konvensional (menggunakan PM2 dan Nginx secara langsung)** adalah pilihan yang paling stabil dan mudah untuk di- *debug*.

Berikut adalah panduan lengkap melakukan *hosting* LazeePOS di VPS / VM Ubuntu Anda secara konvensional.

---

## Tahap 1: Konfigurasi DNS (Sangat Kritis)
Lakukan ini di panel manajemen domain Anda (Niagahoster, Cloudflare, Namecheap, dll). Anda harus mengarahkan IP Public dari Ubuntu VM Anda ke domain yang Anda miliki. Buat 3 buah **A Record** berikut:

| Tipe Record | Host / Name | Value / Target | Keterangan |
| :--- | :--- | :--- | :--- |
| **A** | `@` | `IP_PUBLIC_VM` | Mengarah untuk domain utama (misal: lazeepos.com) |
| **A** | `www` | `IP_PUBLIC_VM` | Mengarah untuk versi www |
| **A** | `*` | `IP_PUBLIC_VM` | **WILDCARD**: Menangani semua subdomain (toko1.lazeepos.com, dsb) |

> **PERHATIAN**: Tunggu proses propagasi DNS (biasanya 5 menit hingga beberapa jam) sebelum melanjutkan. Anda bisa cek dengan *ping* `sembarang.domainanda.com` di terminal komputer Anda.

---

## Tahap 2: Persiapan Server (Ubuntu)

Masuk ke VM Anda melalui SSH:
```bash
ssh root@IP_PUBLIC_VM
```

### 1. Update Server & Install Kebutuhan Dasar
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install curl git ufw nginx certbot python3-certbot-nginx mysql-server redis-server -y

# Buka akses untuk Web dan SSH
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Install Node.js & PM2
```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 secara global
sudo npm install -g pm2
```

---

## Tahap 3: Pembuatan Sertifikat SSL Wildcard
Kita butuh **Let's Encrypt Wildcard SSL** yang dibuat melalui metode *DNS Challenge* agar seluruh subdomain tenant otomatis mendapatkan HTTPS.

```bash
# Minta sertifikat wildcard (ganti domainanda.com dengan domain asli Anda)
sudo certbot certonly --manual --preferred-challenges dns -d "domainanda.com" -d "*.domainanda.com"
```

> **WARNING**: Certbot akan meminta Anda menambahkan sebuah **TXT Record** dengan nama `_acme-challenge` ke panel DNS Anda. Buka panel DNS Anda, tambahkan kodenya, lalu tunggu 2-3 menit sebelum menekan `ENTER` di terminal agar tervalidasi.

Lokasi sertifikat Anda jika sukses:
- Certificate: `/etc/letsencrypt/live/domainanda.com/fullchain.pem`
- Private Key: `/etc/letsencrypt/live/domainanda.com/privkey.pem`

---

## Tahap 4: Deploy Aplikasi LazeePOS

### 1. Unduh Source Code ke Server
```bash
cd /var/www
# Sesuaikan link dengan repo Github Anda
git clone https://github.com/repo-anda/lazeepos.git
cd lazeepos
```

### 2. Setup Backend & PM2
```bash
cd /var/www/lazeepos/backend

# Install dependensi
npm install

# Setup env
cp .env.production.example .env.production
nano .env.production
```

Pastikan Anda mengubah isi `.env.production` untuk menyesuaikan:
- `FRONTEND_URL=https://domainanda.com`
- `CENTRAL_DOMAIN=domainanda.com`
- Kredensial Database MySQL & Redis yang sudah Anda siapkan di server.

Jalankan Database Migration & Seeding:
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

Jalankan backend menggunakan PM2:
```bash
pm2 start server.js --name "lazeepos-backend"
pm2 save
pm2 startup
```

### 3. Build Frontend (React / Vite)
Kita akan menjadikan frontend statis agar langsung di- *serve* oleh Nginx (Jauh lebih cepat daripada mode dev).

```bash
cd /var/www/lazeepos/frontend

# Install dependensi
npm install

# Pastikan environment api menunjuk ke origin yang sama, karena Nginx akan proxy /api/v1
echo "VITE_API_URL=/api/v1" > .env.production

# Build aplikasi React
npm run build
```

Hasil build akan ada di `/var/www/lazeepos/frontend/dist`. Folder inilah yang akan kita ekspos via Nginx.

---

## Tahap 5: Konfigurasi Nginx (Inti Routing Multi-Tenant)

Inilah rahasia mengapa *subdomain* bisa berjalan lancar tanpa Docker. Kita akan meminta Nginx menangkap **SEMUA** domain (`server_name .domainanda.com`), melayani *file statis* React, dan meneruskan ` /api` ke Node.js (PM2).

```bash
sudo nano /etc/nginx/sites-available/lazeepos
```

Masukkan konfigurasi berikut (jangan lupa ganti `domainanda.com` dengan domain asli Anda):

```nginx
server {
    listen 80;
    # Menangkap domain utama dan SEMUA subdomain (*)
    server_name domainanda.com *.domainanda.com;
    
    # Redirect HTTP ke HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name domainanda.com *.domainanda.com;

    # Masukkan path SSL Wildcard dari Tahap 3
    ssl_certificate /etc/letsencrypt/live/domainanda.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/domainanda.com/privkey.pem;

    # Folder hasil build React
    root /var/www/lazeepos/frontend/dist;
    index index.html;

    # 1. Routing Frontend (React Router SPA fallback)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 2. Routing Uploads Gambar / File Statis Backend
    location /uploads/ {
        alias /var/www/lazeepos/backend/public/uploads/;
        access_log off;
        expires max;
    }

    # 3. Routing API ke Node.js (PM2)
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # PENTING: Meneruskan Host header ke backend agar Node.js tahu ini subdomain siapa
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Aktifkan konfigurasi Nginx dan muat ulang:
```bash
sudo ln -s /etc/nginx/sites-available/lazeepos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Selesai! 🎉
Aplikasi LazeePOS Anda sekarang sudah berjalan di Production. Nginx akan bertugas mendeteksi apakah yang mengakses adalah `toko1.domainanda.com` atau `domainanda.com`, dan meneruskan `Host` tersebut ke Backend Node.js yang berjalan di PM2. Node.js kemudian membaca `req.hostname` di middleware untuk menentukan database Tenant mana yang harus dilayani. 

Semua ini berjalan rapi dan sangat optimal tanpa perlu isolasi Docker yang kadang menyulitkan manajemen *network* & HTTPS di lingkungan Node.js awal!
