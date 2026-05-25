# Panduan Pengembangan & Penggunaan Source Code (LazeePOS)

Dokumen ini ditujukan untuk *developer* yang ingin melanjutkan, memodifikasi, atau mempelajari basis kode sistem LazeePOS SaaS.

## 1. Arsitektur Proyek (Tech Stack)
LazeePOS dibangun menggunakan konsep **SaaS Multi-Tenant** dengan *Single Database, Shared Schema*.
*   **Frontend**: React.js (Vite), TypeScript, Tailwind CSS.
*   **Backend**: Node.js, Express.js, Prisma ORM.
*   **Database**: MySQL.
*   **Identifikasi Tenant**: Menggunakan middleware berbasis *Subdomain* (contoh: `toko1.lazeepos.com`).

## 2. Struktur Folder Utama
```text
/home/zero/Documents/POS/
├── backend/                  # Server Node.js
│   ├── prisma/               # Skema database & seeder
│   ├── routes/               # Endpoint API (tenant & central)
│   ├── middleware/           # Auth, paginasi, idempotensi, resolver tenant
│   └── public/uploads/       # Penyimpanan file lokal sementara (bisa dipindah ke S3)
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── api/              # Axios client dengan interceptor
│   │   ├── components/       # UI Reusable (Modal, CustomSelect, Sidebar)
│   │   ├── context/          # React Context (AuthContext, ThemeContext)
│   │   ├── pages/            # Halaman fitur (POS, Setting, Central Admin)
│   │   └── index.css         # Tailwind & Variabel Tema
├── docs/                     # Dokumentasi teknis proyek
└── README.md                 # Informasi umum root project
```

## 3. Menjalankan Aplikasi Secara Lokal (Development)

### A. Persiapan Lingkungan
1. Pastikan **Node.js** (v18+) dan **MySQL** telah terpasang dan berjalan.
2. Clone repository ini dan masuk ke direktori utama.

### B. Konfigurasi Backend
1. Masuk ke folder backend: `cd backend`
2. Salin *environment variables*: `cp .env.example .env`
3. Sesuaikan `DATABASE_URL` di dalam file `.env` dengan kredensial MySQL lokal Anda.
4. Install dependensi: `npm install`
5. Sinkronisasi skema ke database: `npx prisma db push`
6. Masukkan data awal (Seeding) untuk peran Central dan Tenant Demo: `npm run db:seed`
7. Jalankan server backend: `npm run dev` (Berjalan di port 5000)

### C. Konfigurasi Frontend
1. Buka terminal baru, masuk ke folder frontend: `cd frontend`
2. Install dependensi: `npm install`
3. Jalankan Vite server: `npm run dev` (Berjalan di port 5173)

### D. Cara Mengakses (Routing Subdomain)
*   **SuperAdmin (Central)**: Akses `http://localhost:5173/central-login`
*   **Tenant Publik**: Akses `http://demo.localhost:5173/` (Ganti `demo` dengan nama subdomain dari database).
*   **Tenant Kasir/Admin**: Akses `http://demo.localhost:5173/login`

## 4. Panduan Pengembangan Selanjutnya
Jika Anda ingin mengembangkan aplikasi ini lebih lanjut, berikut adalah rekomendasi prioritas:
1.  **Migrasi Penyimpanan Gambar**: Pindahkan unggahan dari `public/uploads` lokal (Multer) ke **AWS S3** atau **Cloudinary** agar aman saat di-*deploy* ke server *cloud* seperti Vercel/Render.
2.  **Integrasi Payment Gateway**: Hubungkan notifikasi webhook Midtrans (atau Xendit) dengan tabel `PaymentTransaction` agar sistem bisa meng-*update* kolom `status` menjadi `settlement` secara otomatis.
3.  **Laporan Analitik**: Tambahkan komponen visualisasi grafik (misal dengan `recharts`) pada halaman Laporan Tenant.
4.  **Tingkat Lanjut (Docker/K8s)**: Terapkan Dockerization menggunakan `Dockerfile.dev` yang sudah ada untuk standarisasi *environment* lintas developer.
