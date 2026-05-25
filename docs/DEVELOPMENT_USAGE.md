# Dokumentasi Pengembangan & Penggunaan LazeePOS (Update Terakhir)

LazeePOS adalah sistem *Point of Sale* (POS) berbasis **SaaS Multi-Tenant**. Sistem ini dirancang untuk melayani ribuan toko (tenant) dalam satu platform, di mana setiap toko mendapatkan subdomain terisolasi, halaman landing publik mereka sendiri, dan fungsionalitas manajemen kasir yang independen.

---

## 1. Arsitektur Sistem

### 1.1 Stack Teknologi
- **Frontend:** React (Vite), TypeScript, Tailwind CSS, Lucide React (Icons), React Router DOM.
- **Backend:** Node.js, Express, Prisma ORM, MySQL.
- **Infrastruktur/Dev:** Nginx (untuk *routing* subdomain di tahap produksi), Nodemon.

### 1.2 Konsep Multi-Tenancy & Subdomain
LazeePOS menggunakan arsitektur *Single Database, Shared Schema* dengan isolasi pada tingkat aplikasi (berdasarkan `tenantId`).
- Setiap *Request* ke backend dilewatkan melalui *middleware* `tenantIdentificator.js` yang mengekstrak subdomain dari URL dan memuat konteks Tenant ke dalam *Request Object*.
- **Subdomain Routing:**
  - `lazeepos.com` / `localhost` -> Merender Central SaaS Landing Page & Central Login.
  - `<namatoko>.lazeepos.com` / `<namatoko>.localhost` -> Merender Halaman Publik Toko (Katalog) & Login Kasir Toko.

### 1.3 Hak Akses (Role-Based Access Control)
1. **Central (`central`):** Pemilik platform (SaaS Admin). Mengatur skema berlangganan (Plans), memantau seluruh tenant, dan melihat metrik platform.
2. **Admin Toko (`admin`):** Pemilik tenant. Mengatur katalog produk, melihat arus kas, mengelola stok, mengubah tema, dan mengatur Landing Page.
3. **Kasir (`kasir`):** Karyawan tenant. Terbatas pada akses Terminal POS, Riwayat Struk, dan Sinkronisasi Stok Harian.

---

## 2. Struktur Direktori Utama

### Backend (`/backend`)
- `prisma/schema.prisma` : Skema database lengkap (Tenant, User, Product, Transaction, dll).
- `prisma/seed.js` : Skrip seeder untuk membuat Plan bawaan, Akun Central, dan Tenant Demo.
- `routes/central/` : Endpoint khusus untuk SaaS Admin (`/api/v1/central/*`).
- `routes/` : Endpoint khusus tenant (`/api/v1/products`, `/api/v1/pos`, dll).
- `routes/public.js` : Endpoint yang tidak memerlukan autentikasi, digunakan untuk Landing Page Tenant.
- `middleware/` : Berisi sistem autentikasi, identifikasi tenant, idempotensi (mencegah *double-submit* transaksi), dan paginasi.

### Frontend (`/frontend/src`)
- `components/` : Komponen UI *reusable* (Modal, Sidebar, Layout, ProtectedRoute).
- `context/` :
  - `AuthContext.tsx`: Mengelola status login, sesi, dan data pengguna aktif.
  - `ThemeContext.tsx`: Mengatur skema warna (Primary Color), logo, dan bentuk logo tenant secara *real-time* ke CSS Variables.
- `pages/` : Halaman-halaman fitur (POS, Warehouse, Dashboard, Settings, LandingPage, TenantLandingPage, dll).
- `api/client.ts` : Instansiasi Axios dengan interceptor pintar untuk unwrap response `data.data` dan injeksi Token.
- `index.css` : Sistem desain inti (Design System) yang berisi variabel Tailwind, mode *Dark/Light*, dan utilitas khusus (scrollbars, animasi).

---

## 3. Fitur Utama yang Telah Selesai (Hingga Saat Ini)

1. **Terminal POS & Transaksi:** Fitur kasir lengkap dengan keranjang belanja, perhitungan pajak (PPN), perhitungan kembalian, diskon kondisional, dan riwayat struk.
2. **Manajemen Produk & Gudang:** *CRUD* produk yang terhubung dengan modul *Warehouse* untuk sinkronisasi level stok secara *real-time*.
3. **Buku Kas (CashFlow):** Pelacakan uang masuk (dari transaksi) dan uang keluar (pengeluaran manual).
4. **Halaman Publik Toko (Tenant Landing Page):** Setiap tenant memiliki halaman "Katalog Publik" pada subdomain mereka sendiri yang menampilkan nama toko, logo, kontak (WA/IG), dan daftar produk aktif.
5. **Pengaturan & Personalisasi (White-labeling):** Tenant dapat mengatur warna tema aplikasi, bentuk logo (kotak/bulat), dan mengatur kalimat pada struk kasir.
6. **Billing & Berlangganan:** Modul untuk meninjau status paket aktif tenant (Pro, Starter, Enterprise).
7. **Platform Central:** *Dashboard* Super Admin untuk melihat jumlah tenant, omzet keseluruhan, dan performa aplikasi.

---

## 4. Panduan Penggunaan Development (How To Run)

### 4.1 Menjalankan Backend & Database
1. Pastikan database MySQL berjalan.
2. Navigasi ke direktori backend:
   ```bash
   cd /home/zero/Documents/POS/backend
   npm install
   ```
3. Lakukan sinkronisasi skema dan jalankan seeder:
   ```bash
   npx prisma db push
   npm run db:seed
   ```
4. Jalankan server backend (Port 5000):
   ```bash
   npm run dev
   ```

### 4.2 Menjalankan Frontend
1. Navigasi ke direktori frontend:
   ```bash
   cd /home/zero/Documents/POS/frontend
   npm install
   ```
2. Jalankan development server (Port 5173):
   ```bash
   npm run dev
   ```

### 4.3 Cara Testing & Simulasi Subdomain di Localhost
Aplikasi mendukung resolusi subdomain lokal. Jika frontend berjalan di port `5173`:
- Buka **`http://localhost:5173/`** untuk mengakses Central Landing Page.
- Buka **`http://demo.localhost:5173/`** untuk mengakses Halaman Publik (Landing Page) milik tenant "Demo Store".
- Login Central: `/central-login` dengan `admin@lazeepos.com` / `Admin123!`
- Login Tenant: Akses `/login` dari subdomain tenant (misal: `http://demo.localhost:5173/login`) dengan `demo@lazeepos.com` / `Demo123!`

---

## 5. Troubleshooting Umum
- **"Ops! Toko tidak ditemukan" di Halaman Publik:** Ini biasanya terjadi jika data tenant tidak ada di database, atau di frontend Anda tidak menggunakan subdomain. *Solusi: Jalankan `npm run db:seed` di backend, dan pastikan Anda mengakses melalui format `<subdomain>.localhost:5173`.*
- **Logo/Gambar Tidak Muncul:** Sistem menggunakan utility `getMediaUrl` di frontend untuk memetakan path dari backend (Port 5000) ke URL absolute. Pastikan direktori `/public/uploads` di backend tersedia dan API backend sedang berjalan.
- **Aset CSS/Tema Rusak:** Refresh browser untuk memicu pemanggilan ulang ke `ThemeContext` yang akan menetapkan variabel `--accent-primary` ulang di `:root`.

---
*Dokumentasi ini terus diperbarui seiring berjalannya pengembangan sprint terbaru.*
