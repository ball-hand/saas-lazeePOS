<div align="center">
  <img src="https://img.shields.io/badge/LazeePOS-SaaS-3B82F6?style=for-the-badge&logo=react&logoColor=white" alt="LazeePOS Logo"/>
  <h1>LazeePOS SaaS Platform</h1>
  <p><strong>A Modern, Multi-Tenant Point of Sale & Inventory Management System</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Frontend-React%20Vite-61DAFB?style=flat-square&logo=react&logoColor=black" alt="Frontend" />
    <img src="https://img.shields.io/badge/Styling-Tailwind%20CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind" />
    <img src="https://img.shields.io/badge/Backend-Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Backend" />
    <img src="https://img.shields.io/badge/Database-MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white" alt="MySQL" />
    <img src="https://img.shields.io/badge/ORM-Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma" />
    <img src="https://img.shields.io/badge/Architecture-Multi--Tenant-blueviolet?style=flat-square" alt="Multi-Tenant" />
  </p>
</div>

---

## 🌟 Tentang LazeePOS

**LazeePOS** adalah solusi *Point of Sale* (Kasir) modern yang dibangun di atas arsitektur perangkat lunak berbasis **SaaS Multi-Tenant**. Ini berarti sistem mampu menampung ribuan bisnis (Toko/Tenant) dalam satu instalasi *database* tunggal, di mana setiap bisnis mendapatkan privasi data yang ketat dan subdomain unik mereka sendiri (misal: `kopisenja.lazeepos.com`).

Berbekal antarmuka **Minimalis Premium** dengan *glassmorphism* dan animasi mulus, LazeePOS dirancang untuk memberikan pengalaman penggunaan (*UX*) terbaik, baik untuk pemilik platform, pemilik toko, maupun kasir lapangan.

---

## ✨ Fitur Utama

- **🏗️ Multi-Tenant Subdomain Routing:** Pemisahan halaman publik dan internal berdasarkan URL subdomain tanpa memerlukan server terpisah.
- **🎨 White-labeling Terintegrasi:** Tiap toko dapat menyesuaikan skema warna (tema *light/dark*), bentuk logo, hingga jargon toko yang teraplikasikan secara instan ke UI menggunakan CSS Variables.
- **🖥️ Central Control Plane:** Dashboard *Super Admin* untuk mengawasi operasional SaaS, menangani langganan (MRR), CMS Landing Page terpusat, dan layanan *support ticketing*.
- **📦 Warehouse & POS Terpusat:** Penjualan di terminal kasir secara *real-time* otomatis mengurangi stok fisik di gudang dengan validasi keamanan.
- **🔐 Sistem Keamanan Modern:** Autentikasi JWT dengan pemisahan peran yang ketat (Central Admin, Tenant Admin, Tenant Kasir) serta implementasi kunci *Idempotency* untuk mencegah order ganda.

---

## 📚 Pusat Dokumentasi
Bagi para *developer* yang ingin berkontribusi atau melanjutkan pengembangan aplikasi ini, silakan baca rincian teknis pada dokumen berikut:

1. 📖 **[Panduan Pengembangan & Menjalankan Source Code](docs/1_DEVELOPMENT_GUIDE.md)**
2. 🚀 **[Dokumentasi Fitur Fungsional & Hierarki](docs/2_FEATURE_DOCUMENTATION.md)**
3. 🗄️ **[Struktur Model Database & Relasi (Prisma ORM)](docs/3_DATABASE_SCHEMA.md)**

---

## 🚀 Mulai Cepat (Quick Start)

Ikuti langkah-langkah di bawah untuk mencoba lingkungan *development* di sistem lokal Anda.

### 1. Prasyarat
- Node.js (v18 atau lebih baru)
- MySQL Server berjalan secara lokal (port 3306)

### 2. Jalankan Backend
Buka terminal dan navigasi ke `backend/`:
```bash
cd backend
npm install

# Sesuaikan URL MySQL di .env
cp .env.example .env

# Migrasi Skema & Seeding Dummy Data (Demo Tenant)
npx prisma db push
npm run db:seed

# Mulai server API (Port 5000)
npm run dev
```

### 3. Jalankan Frontend
Buka terminal baru dan navigasi ke `frontend/`:
```bash
cd frontend
npm install

# Mulai Vite Server (Port 5173)
npm run dev
```

### 4. Akses Aplikasi
- **SaaS SuperAdmin:** `http://localhost:5173/central-login` (admin@lazeepos.com / Admin123!)
- **Halaman Publik Demo Tenant:** `http://demo.localhost:5173/`
- **Dashboard Toko Demo:** `http://demo.localhost:5173/login` (demo@lazeepos.com / Demo123!)

---
<div align="center">
  <p><i>Didesain dengan ♥️ untuk pengalaman operasional bisnis yang lebih baik.</i></p>
</div>
