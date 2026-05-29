# Panduan Pengembangan LazeePOS

> **⚠️ PROPRIETARY SOFTWARE** — Kode sumber ini adalah milik eksklusif **Lazee Teknologi**.  
> Distribusi, modifikasi, atau penggunaan di luar izin tertulis dilarang keras. Lihat [LICENSE](../LICENSE).

---

## 1. Arsitektur Sistem

LazeePOS dibangun di atas arsitektur **SaaS Multi-Tenant** dengan pola *Single Database, Shared Schema*.

```
                    ┌──────────────────────────────────┐
                    │           NGINX (Port 80/443)     │
                    │         Reverse Proxy + SSL       │
                    └─────────────┬──────────────────────┘
                                  │
              ┌───────────────────┴───────────────────┐
              ▼                                       ▼
    ┌──────────────────┐                   ┌──────────────────────┐
    │   Frontend SPA   │                   │    Backend REST API   │
    │  React 19 + Vite │                   │  Node.js + Express 5  │
    │   TypeScript     │                   │   Prisma ORM          │
    └──────────────────┘                   └──────────┬───────────┘
                                                      │
                                       ┌──────────────┴──────────────┐
                                       ▼                             ▼
                               ┌──────────────┐           ┌────────────────┐
                               │   MySQL 8    │           │    Redis 7     │
                               │  (Prisma)    │           │ Cache + Pub/Sub│
                               └──────────────┘           └────────────────┘
```

### Tech Stack Lengkap

| Layer | Teknologi | Versi | Fungsi |
|---|---|---|---|
| **Frontend** | React | 19 | UI SPA |
| | Vite | 6 | Build tool + dev server |
| | TypeScript | 5.6 | Type safety |
| | Tailwind CSS | 4 | Styling + CSS Variables tema |
| | React Router | 7 | Client-side routing |
| | Axios | 1.7 | HTTP client ke backend |
| **Backend** | Node.js | 20 LTS | Runtime |
| | Express | 5 | Web framework |
| | Prisma | 6 | ORM + schema migration |
| | JWT | - | Autentikasi stateless |
| | Multer | 2 | Upload file media |
| | Midtrans | - | Payment gateway |
| **Database** | MySQL | 8 | Database utama (multi-tenant) |
| | Redis | 7 | Cache, rate limit, session |
| **Infra** | Docker | - | Containerization |
| | Nginx | 1.27 | Reverse proxy + static serve |

---

## 2. Struktur Folder

```
POS/
├── backend/                        # Node.js + Express API Server
│   ├── prisma/
│   │   ├── schema.prisma           # Definisi seluruh model database
│   │   └── seed.js                 # Data awal (Central Admin + Demo Tenant)
│   ├── routes/
│   │   ├── central/                # Routes khusus Central Admin
│   │   │   ├── platform.js         # CMS & pengaturan platform
│   │   │   ├── tenants.js          # Manajemen tenant
│   │   │   ├── billing.js          # Billing log SaaS
│   │   │   └── ...
│   │   ├── public.js               # Routes publik (landing page, docs CMS)
│   │   ├── auth.js                 # Login, register, logout
│   │   ├── products.js             # Manajemen produk tenant
│   │   ├── transactions.js         # POS checkout & riwayat
│   │   ├── tables.js               # Manajemen meja + QR
│   │   ├── queue.js                # Kitchen Display System
│   │   └── ...
│   ├── middleware/
│   │   ├── auth.js                 # JWT verify + role guard
│   │   ├── tenantResolver.js       # Resolve tenant dari subdomain/header
│   │   └── idempotency.js          # Cegah double-submit checkout
│   ├── utils/
│   │   └── redis.js                # Redis client & helper
│   ├── public/uploads/             # File upload (gambar produk, logo, dll)
│   ├── Dockerfile                  # Production image
│   ├── Dockerfile.dev              # Development image (nodemon)
│   ├── .env.example                # Template env development
│   ├── .env.production.example     # Template env production
│   └── server.js                   # Entry point Express app
│
├── frontend/                       # React SPA
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts           # Axios instance + interceptors
│   │   ├── components/
│   │   │   ├── shared/             # Komponen reusable (RichTextEditor, CustomSelect, dll)
│   │   │   ├── Layout.tsx          # Shell utama dengan sidebar navigasi
│   │   │   └── ProtectedRoute.tsx  # Guard route berdasarkan role
│   │   ├── context/
│   │   │   ├── AuthContext.tsx     # State user + JWT + role
│   │   │   └── ThemeContext.tsx    # State tema (warna, dark/light, logo)
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx     # Halaman publik platform
│   │   │   ├── DocsPage.tsx        # Halaman dokumentasi publik
│   │   │   ├── POS.tsx             # Terminal kasir
│   │   │   ├── Dashboard.tsx       # Analytics tenant
│   │   │   ├── Settings.tsx        # Pengaturan toko
│   │   │   └── central/            # Halaman Central Admin
│   │   └── index.css               # CSS Variables tema global
│   ├── Dockerfile                  # Production (multi-stage → Nginx)
│   ├── Dockerfile.dev              # Development (Vite dev server)
│   └── nginx.conf                  # SPA routing config (try_files)
│
├── nginx/
│   ├── dev.conf                    # Proxy ke Vite dev server
│   └── production.conf             # Proxy ke static Nginx + SSL placeholder
│
├── docker-compose.yml              # Development stack
├── docker-compose.prod.yml         # Production stack
├── LICENSE                         # Proprietary license
└── README.md
```

---

## 3. Menjalankan Aplikasi

### Opsi A: Local Development (tanpa Docker)

**Prasyarat:** Node.js 20+, MySQL 8+, Redis 7+

```bash
# 1. Setup Backend
cd backend
cp .env.example .env
# Edit .env: sesuaikan DATABASE_URL dengan MySQL lokal Anda

npm install
npx prisma db push     # Sinkronisasi schema ke database
npm run db:seed        # Insert data awal (Central Admin + Demo Tenant)
npm run dev            # Berjalan di http://localhost:5000

# 2. Setup Frontend (terminal baru)
cd frontend
npm install
npm run dev            # Berjalan di http://localhost:5173
```

### Opsi B: Docker Development

**Prasyarat:** Docker + Docker Compose

```bash
# 1. Tambahkan ke /etc/hosts:
echo "127.0.0.1 lazeepos.local" | sudo tee -a /etc/hosts

# 2. Jalankan semua service
docker compose up -d

# 3. Pertama kali: jalankan migrasi & seeding
docker compose exec backend npx prisma db push
docker compose exec backend npm run db:seed

# Akses: http://lazeepos.local
```

### Opsi C: Docker Production (VPS)

```bash
# 1. Copy & isi file env production
cp backend/.env.production.example backend/.env.production
nano backend/.env.production

# 2. Build & jalankan
docker compose -f docker-compose.prod.yml up -d --build

# 3. Inisialisasi database
docker compose -f docker-compose.prod.yml exec backend npx prisma db push
docker compose -f docker-compose.prod.yml exec backend npm run db:seed

# 4. HTTPS (butuh domain & Certbot)
sudo certbot --nginx -d lazeepos.com -d www.lazeepos.com
```

---

## 4. Environment Variables

### Backend (`.env`)

| Variable | Contoh | Keterangan |
|---|---|---|
| `PORT` | `5000` | Port Express server |
| `DATABASE_URL` | `mysql://root:@localhost:3306/pos_db` | Koneksi MySQL |
| `JWT_SECRET` | *(64+ karakter acak)* | Kunci signing JWT |
| `JWT_EXPIRES_IN` | `7d` | Masa berlaku token |
| `REDIS_URL` | `redis://localhost:6379` | Koneksi Redis |
| `CENTRAL_DOMAIN` | `lazeepos.com` | Domain utama platform |
| `FRONTEND_URL` | `http://localhost:5173` | URL frontend (untuk CORS) |
| `MIDTRANS_ENV` | `sandbox` / `production` | Mode payment gateway |
| `MIDTRANS_SERVER_KEY` | `SB-Mid-server-...` | Midtrans server key |
| `MIDTRANS_CLIENT_KEY` | `SB-Mid-client-...` | Midtrans client key |

### Frontend (`.env`)

| Variable | Contoh | Keterangan |
|---|---|---|
| `VITE_API_URL` | `/api/v1` | Base URL backend API |
| `VITE_MIDTRANS_ENV` | `sandbox` | Mode Midtrans di frontend |
| `VITE_MIDTRANS_CLIENT_KEY` | `SB-Mid-client-...` | Client key Midtrans |

---

## 5. Database Management

```bash
# Generate Prisma Client setelah mengubah schema.prisma
npx prisma generate

# Sinkronisasi schema ke database (development)
npx prisma db push

# Jalankan seeder
npm run db:seed

# Buka Prisma Studio (GUI database)
npx prisma studio
```

---

## 6. Workflow Pengembangan

```bash
# Format kode (pastikan ESLint config sudah diset)
cd frontend && npm run lint

# Jalankan unit tests
cd backend && npm run test
cd frontend && npm run test

# Build production (cek apakah ada TypeScript error)
cd frontend && npm run build
```

---

## 7. API Conventions

Semua endpoint menggunakan prefix `/api/v1/` dan mengembalikan response JSON:

```json
{
  "status": "success",
  "data": { ... },
  "message": "Operasi berhasil"
}
```

**Auth Headers:**
```
Authorization: Bearer <JWT_TOKEN>
X-Tenant-ID: <tenant_uuid>          # Untuk request tenant-spesifik
Idempotency-Key: <uuid>             # Wajib untuk POST checkout
```

**Role Middleware:**
- `protect` — semua authenticated user
- `requireAdmin` — Tenant Owner/Admin saja
- `requireCentral` — Central Admin saja

---

## 8. Kontak & Lisensi

Software ini adalah milik eksklusif **Lazee Teknologi**.  
Untuk pertanyaan lisensi: **legal@lazeepos.com**  
Untuk dukungan teknis: **support@lazeepos.com**

> Lihat [LICENSE](../LICENSE) untuk detail hak cipta dan ketentuan penggunaan.
