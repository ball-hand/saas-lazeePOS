<div align="center">
  <img src="https://img.shields.io/badge/LazeePOS-SaaS-3B82F6?style=for-the-badge&logo=react&logoColor=white" alt="LazeePOS Logo"/>
  <h1>LazeePOS SaaS Platform</h1>
  <p><strong>A Modern, Multi-Tenant Point of Sale & Inventory Management System</strong></p>

  <p>
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind" />
    <img src="https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express&logoColor=white" alt="Express" />
    <img src="https://img.shields.io/badge/MySQL-8-4479A1?style=flat-square&logo=mysql&logoColor=white" alt="MySQL" />
    <img src="https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma" />
    <img src="https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white" alt="Redis" />
    <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
    <img src="https://img.shields.io/badge/Architecture-Multi--Tenant-blueviolet?style=flat-square" alt="Multi-Tenant" />
  </p>
</div>

---

## 🌟 Tentang LazeePOS

**LazeePOS** adalah solusi *Point of Sale* (Kasir) modern yang dibangun di atas arsitektur **SaaS Multi-Tenant**. Sistem mampu menampung ribuan bisnis dalam satu instalasi, di mana setiap bisnis mendapatkan privasi data ketat, subdomain unik (`kopisenja.lazeepos.com`), dan Landing Page publik tersendiri.

Dilengkapi antarmuka premium dengan *glassmorphism*, dark/light mode adaptif, dan animasi mulus — LazeePOS dirancang memberikan pengalaman terbaik bagi pemilik platform, pemilik toko, maupun kasir lapangan.

---

## ✨ Fitur Utama (16 Modul)

| Modul | Deskripsi |
|---|---|
| 🏗️ **Multi-Tenant SaaS** | Isolasi subdomain, branding per toko, landing page publik otomatis |
| 🖥️ **Terminal POS** | Checkout cepat, scan barcode, split payment, hold order |
| 🪑 **Manajemen Meja** | Layout drag-and-drop, status real-time, QR Code per meja |
| 👨‍🍳 **Antrean Dapur (KDS)** | Kitchen Display System, status pesanan, notifikasi real-time |
| 📦 **Produk & Gudang** | Katalog SKU, stok terpotong otomatis, audit inventaris |
| 🏷️ **Diskon Cerdas** | BOGO, diskon %, minimum belanja, kupon kondisional |
| 💰 **Buku Kas Ledger** | Arus kas masuk/keluar, setoran kasir, rekonsiliasi harian |
| 🖨️ **Printer & Hardware** | Thermal printer 58mm/80mm, scanner barcode, kalibrasi periferal |
| 🧾 **Struk Kustom** | Logo, pesan penutup, pajak PPN, QR Code di struk |
| 📱 **Menu Pelanggan** | Scan QR → lihat menu digital, pesan langsung dari meja |
| 👥 **Manajemen Staf** | Role-based access (Owner, Admin, Kasir), audit log aksi |
| 💳 **Billing & Langganan** | Midtrans gateway, QRIS, VA Bank, upgrade/downgrade paket |
| 🎫 **Support Ticketing** | Sistem tiket komplain, chat real-time dengan Central Admin |
| 📊 **Dashboard Analytics** | Grafik penjualan, statistik harian, revenue tracking |
| 🎨 **Kustomisasi Tema** | Light/Dark mode, warna aksen, bentuk logo branding |
| 🚀 **Release Management** | Push update ke semua tenant, mandatory update control |

---

## 🏛️ Arsitektur

```
                        ┌──────────────┐
                        │    Nginx     │  ← Reverse Proxy + SSL
                        │  (Port 80)   │
                        └──────┬───────┘
                ┌──────────────┴──────────────┐
                ▼                             ▼
        ┌───────────────┐           ┌─────────────────┐
        │   Frontend    │           │    Backend API  │
        │  React + Vite │           │  Node.js Express│
        │  (Port 5173)  │           │  (Port 5000)    │
        └───────────────┘           └────────┬────────┘
                                             │
                              ┌──────────────┴──────────────┐
                              ▼                             ▼
                       ┌────────────┐             ┌────────────────┐
                       │  MySQL 8   │             │   Redis 7      │
                       │  (Prisma)  │             │  (Cache + WS)  │
                       └────────────┘             └────────────────┘
```

### Stack Teknologi

| Layer | Teknologi |
|---|---|
| **Frontend** | React 19, Vite 6, Tailwind CSS 4, React Router 7 |
| **Backend** | Node.js 20, Express 5, Prisma ORM 6 |
| **Database** | MySQL 8 (multi-tenant shared DB) |
| **Cache** | Redis 7 (session, rate limit, WebSocket) |
| **Auth** | JWT + Role-Based Access Control |
| **Payment** | Midtrans (QRIS, VA Bank, Kartu) |
| **Infra** | Docker Compose, Nginx |

---

## 🚀 Quick Start

### Opsi A: Local Development (tanpa Docker)

**Prasyarat:** Node.js 20+, MySQL 8+

```bash
# 1. Clone & setup backend
cd backend
cp .env.example .env       # Sesuaikan DATABASE_URL
npm install
npx prisma db push
npm run db:seed
npm run dev                # API berjalan di http://localhost:5000

# 2. Setup frontend (terminal baru)
cd frontend
npm install
npm run dev                # Vite berjalan di http://localhost:5173
```

### Opsi B: Docker Development (direkomendasikan)

**Prasyarat:** Docker + Docker Compose

```bash
# Tambahkan ke /etc/hosts:
# 127.0.0.1 lazeepos.local

docker compose up -d
# Akses: http://lazeepos.local
```

### Opsi C: Docker Production

```bash
# 1. Siapkan environment
cp backend/.env.production.example backend/.env.production
nano backend/.env.production  # Isi dengan nilai production

# 2. Build & jalankan
docker compose -f docker-compose.prod.yml up -d --build

# 3. Jalankan migrasi database
docker compose -f docker-compose.prod.yml exec backend npx prisma db push

# 4. HTTPS (opsional, butuh domain)
sudo certbot --nginx -d lazeepos.com -d www.lazeepos.com
```

---

## 🔐 Akses Default

| Role | URL | Email | Password |
|---|---|---|---|
| **Central Admin** | `/central-login` | `admin@lazeepos.com` | `Admin123!` |
| **Tenant Owner** | `/login` | `demo@lazeepos.com` | `Demo123!` |

> ⚠️ **Ganti password default segera** sebelum deploy ke production!

---

## 📁 Struktur Proyek

```
POS/
├── backend/                    # Node.js + Express API
│   ├── prisma/                 # Schema & seed database
│   ├── routes/                 # REST API routes
│   │   ├── central/            # Central Admin routes
│   │   └── public.js           # Public landing page routes
│   ├── middleware/             # Auth, rate limit, idempotency
│   ├── utils/                  # Redis, helpers
│   ├── Dockerfile              # Production image
│   ├── Dockerfile.dev          # Development image
│   └── server.js               # Entry point
│
├── frontend/                   # React + Vite SPA
│   ├── src/
│   │   ├── pages/              # Halaman (POS, Dashboard, Landing, Docs)
│   │   │   └── central/        # Central Admin pages
│   │   ├── components/         # Shared components
│   │   ├── context/            # Auth & Theme context
│   │   └── api/                # Axios client
│   ├── Dockerfile              # Production (multi-stage)
│   ├── Dockerfile.dev          # Development (Vite dev server)
│   └── nginx.conf              # SPA config untuk production
│
├── nginx/
│   ├── dev.conf                # Reverse proxy untuk development
│   └── production.conf         # Reverse proxy untuk production + SSL
│
├── docker-compose.yml          # Development stack
├── docker-compose.prod.yml     # Production stack
└── README.md
```

---

## 📚 Dokumentasi

| Dokumen | Deskripsi |
|---|---|
| 📖 [Development Guide](docs/1_DEVELOPMENT_GUIDE.md) | Setup, struktur folder, env vars, API conventions |
| 🚀 [Feature Documentation](docs/2_FEATURE_DOCUMENTATION.md) | Detail semua fitur per peran (Central, Tenant, Kasir) |
| 🗄️ [Database Schema](docs/3_DATABASE_SCHEMA.md) | Diagram relasi + semua model Prisma |
| 🧪 [Testing Guide](docs/4_TESTING_GUIDE.md) | Setup test, best practices, cakupan test |
| 🔍 [Black Box Testing](docs/5_BLACKBOX_TESTING.md) | 40+ skenario test manual tanpa kode |
| 📝 [User Docs Guide](docs/6_USER_DOCS_GUIDE.md) | Panduan menulis dokumentasi untuk pengguna awam |
| ⚠️ [Evaluasi & Perbaikan](docs/7_EVALUATION_AND_IMPROVEMENTS.md) | 20 masalah kritis yang harus diselesaikan sebelum launch |
| 🗺️ [Roadmap & Changelog](docs/Next_features.md) | Fitur yang direncanakan & riwayat versi |

---

## 🤝 Kontribusi

1. Fork repository ini
2. Buat branch fitur: `git checkout -b feature/nama-fitur`
3. Commit dengan pesan deskriptif: `git commit -m 'feat: tambah fitur X'`
4. Push ke branch: `git push origin feature/nama-fitur`
5. Buat Pull Request

---

<div align="center">
  <p><i>Didesain dengan ♥️ untuk pengalaman operasional bisnis yang lebih baik.</i></p>
  <p>
    <img src="https://img.shields.io/badge/License-Proprietary-red?style=flat-square" alt="License" />
    <img src="https://img.shields.io/badge/Status-Active_Development-brightgreen?style=flat-square" alt="Status" />
    <img src="https://img.shields.io/badge/%C2%A9_Lazee_Teknologi-2024--2025-blue?style=flat-square" alt="Copyright" />
  </p>
</div>
