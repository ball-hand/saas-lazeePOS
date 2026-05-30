# 🚀 Panduan Hosting & Deployment LazeePOS (Ubuntu Server VM)

Karena LazeePOS adalah aplikasi SaaS Multi-Tenant (menggunakan *subdomain* dinamis untuk setiap toko), proses *hosting*-nya sedikit berbeda dari aplikasi web biasa. Anda diwajibkan melakukan konfigurasi **Wildcard DNS** dan **Wildcard SSL**.

Berikut adalah panduan langkah demi langkah dari nol untuk melakukan *hosting* LazeePOS di VPS / VM Ubuntu Anda.

---

## Tahap 1: Konfigurasi DNS (Sangat Kritis)
Lakukan ini di panel manajemen domain Anda (Niagahoster, Cloudflare, Namecheap, dll).

Anda harus mengarahkan IP Public dari Ubuntu VM Anda ke domain yang Anda miliki. Buat 3 buah **A Record** berikut:

| Tipe Record | Host / Name | Value / Target | Keterangan |
| :--- | :--- | :--- | :--- |
| **A** | `@` | `IP_PUBLIC_VM` | Mengarah untuk domain utama (misal: lazeepos.com) |
| **A** | `www` | `IP_PUBLIC_VM` | Mengarah untuk versi www |
| **A** | `*` | `IP_PUBLIC_VM` | **WILDCARD**: Menangani semua subdomain (toko1.lazeepos.com, dsb) |

> **PERHATIAN**: Tunggu proses propagasi DNS (biasanya 5 menit hingga beberapa jam) sebelum melanjutkan ke pembuatan SSL. Anda bisa cek dengan *ping* `sembarang.domainanda.com` untuk memastikan IP-nya sudah mengarah ke VM.

---

## Tahap 2: Persiapan Server (Ubuntu)

Masuk ke VM Anda melalui SSH:
```bash
ssh root@IP_PUBLIC_VM
```

### 1. Update Server & Amankan Port
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install ufw curl git -y

# Buka akses untuk Web dan SSH
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Install Docker & Docker Compose
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose Plugin
sudo apt-get install docker-compose-plugin -y

# Aktifkan service
sudo systemctl enable docker
sudo systemctl start docker
```

---

## Tahap 3: Pembuatan Sertifikat SSL Wildcard
Karena kita menggunakan subdomain otomatis, SSL biasa tidak akan mempan. Kita butuh **Let's Encrypt Wildcard SSL** yang dibuat melalui metode *DNS Challenge*.

```bash
# Install Certbot
sudo apt install certbot -y

# Minta sertifikat wildcard (ganti domainanda.com dengan domain asli Anda)
sudo certbot certonly --manual --preferred-challenges dns -d "domainanda.com" -d "*.domainanda.com"
```

> **WARNING**: Certbot akan mem-pause proses dan meminta Anda menambahkan sebuah **TXT Record** beraneka huruf acak dengan nama `_acme-challenge` ke panel DNS Anda. 
> 
> **PENTING**: Buka panel DNS Anda, masukkan kode TXT tersebut, lalu tunggu 2-3 menit sebelum menekan `ENTER` di terminal agar Let's Encrypt bisa mendeteksinya.

Jika berhasil, SSL akan tersimpan di:
- Certificate: `/etc/letsencrypt/live/domainanda.com/fullchain.pem`
- Private Key: `/etc/letsencrypt/live/domainanda.com/privkey.pem`

---

## Tahap 4: Deploy Aplikasi LazeePOS

### 1. Unduh Source Code ke VM
```bash
cd /var/www
# Anda bisa menggunakan git clone atau upload file via SFTP (FileZilla)
git clone https://github.com/repo-anda/lazeepos.git
cd lazeepos
```

### 2. Konfigurasi Environtment Variables
Salin file example dan sesuaikan isinya:
```bash
cp backend/.env.production.example backend/.env.production
nano backend/.env.production
```

Pastikan konfigurasi kunci berikut diatur dengan benar:
```env
# Ganti dengan domain asli Anda
FRONTEND_URL=https://domainanda.com
CENTRAL_DOMAIN=domainanda.com

# Ganti secret key
JWT_SECRET=GantiDenganStringRahasiaYangSangatPanjang123!
SESSION_SECRET=RahasiaSesiSangatKuat456!

# Email Service (Wajib untuk Lupa Password)
MAIL_SERVICE=gmail
MAIL_USER=email.anda@gmail.com
MAIL_PASSWORD=app_password_gmail_16_karakter
```

### 3. Konfigurasi Nginx Production
Jika kode Anda belum memiliki konfigurasi Nginx production, pastikan Nginx me-*routing* permintaan masuk dengan membaca Header *Host* agar sistem *multi-tenant* bekerja. File ini nanti diletakkan di `nginx/prod.conf`.

*Pastikan reverse proxy meneruskan Host Header yang asli:*
```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
```
*(File docker-compose.prod.yml akan me-mount sertifikat SSL dari /etc/letsencrypt ke dalam container Nginx).*

### 4. Jalankan Server!
Kita akan menggunakan versi production `docker-compose.prod.yml` yang sudah meng-compile React dan menjalankan backend dalam mode produksi.

```bash
# Jalankan di background
docker compose -f docker-compose.prod.yml up -d --build

# (Opsional) Jalankan Prisma Seed untuk akun Super Admin pertama kali
docker compose -f docker-compose.prod.yml exec backend npx prisma db seed
```

---

## Tahap 5: Pengecekan & Troubleshooting

Cek apakah server berjalan mulus:
```bash
docker compose -f docker-compose.prod.yml logs -f
```

### Panduan Cek DNS
Buka browser dan ketik:
1. `https://domainanda.com` -> Harus masuk ke halaman *Landing Page / Central Login*.
2. `https://toko1.domainanda.com` -> Harus masuk ke halaman toko *Tenant* (jika toko1 belum terdaftar, akan ada halaman "Toko Tidak Ditemukan").

> **TIPS: Masalah File Hilang Saat Restart?**
> Jika logo atau foto hilang saat kontainer direstart, pastikan folder `/public/uploads` di backend sudah menggunakan *named volume* atau *bind mount* di `docker-compose.prod.yml`.
