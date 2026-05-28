# Panduan Pengujian (Testing Guide)

Selamat datang di Panduan Pengujian LazeePOS. Aplikasi ini berskala SaaS yang melayani berbagai *tenant*, oleh karena itu keandalan kode sangat diutamakan. Kita menggunakan *stack* modern untuk pengujian otomatis.

## Arsitektur Pengujian

Sistem ini dibagi menjadi dua *environment* utama:

### 1. Backend (Node.js/Express)
Di Backend, kita fokus menguji alur logika (*business logic*), rute API, dan lapisan *database*.
- **Framework Utama**: `Jest`
- **Integrasi API**: `Supertest` (untuk mensimulasikan permintaan HTTP ke rute Express tanpa perlu menjalankan server secara penuh).
- **Mocking Database**: `jest-mock-extended` (Prisma dikonfigurasi agar tidak menyentuh database sungguhan secara langsung untuk *unit test*, sehingga sangat cepat).

**Cara Menjalankan Test Backend:**
```bash
cd backend
npm run test
```
*Catatan: Tes diletakkan di dalam folder `backend/tests/` dengan ekstensi `.test.js`.*

### 2. Frontend (React/Vite)
Di Frontend, kita fokus pada perenderan komponen (UI), interaksi pengguna (klik/input), dan manajemen status (*state*).
- **Framework Utama**: `Vitest` (Sangat cepat dan terintegrasi asli dengan Vite).
- **Simulasi DOM**: `jsdom`
- **Pustaka Pengujian React**: `@testing-library/react` dan `@testing-library/jest-dom` (untuk *assertions* elemen HTML seperti `toBeInTheDocument`).

**Cara Menjalankan Test Frontend:**
```bash
cd frontend
npm run test
```
*Catatan: File tes diletakkan bersebelahan langsung dengan komponennya untuk mempermudah navigasi. Contoh: `StatsCard.test.tsx` berada di sebelah `StatsCard.tsx`.*

---

## Standar Penulisan Tes (Best Practices)

1. **Keep it Isolated**: *Unit test* harus terisolasi. Gunakan `mock` untuk fungsi-fungsi eksternal seperti `api.post` atau pemanggilan ke database.
2. **Naming Convention**: Selalu gunakan format `[nama-file].test.ts` atau `.test.tsx`. Deskripsikan setiap blok `describe` dan `it` dengan jelas (misal: `it('should display error message on failure')`).
3. **User-Centric Testing (Frontend)**: Saat menguji UI, utamakan menggunakan `screen.getByRole` atau `screen.getByText` ketimbang mencari berdasarkan nama kelas CSS, karena ini meniru bagaimana *user* sungguhan berinteraksi dengan layar.

## Struktur File Test

```text
POS/
├── backend/
│   ├── tests/
│   │   ├── auth.middleware.test.js    <-- Contoh test middleware
│   │   └── receipts.test.js           <-- Contoh test rute
│   └── jest.config.js
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── StatsCard.tsx
    │   │   └── StatsCard.test.tsx     <-- Contoh test komponen UI
    │   └── utils/
    │       └── formatters.test.ts
    └── vite.config.ts                 <-- Konfigurasi vitest
```

Dengan menjalankan tes secara rutin, kita dapat memastikan bahwa LazeePOS tidak akan pernah mengalami regresi fitur. Selamat menguji! 🚀

---

## Cakupan Fitur Teruji (Test Coverage)

Seluruh fitur inti aplikasi (Fase 1 & Fase 2) telah melalui proses *Unit Testing* dengan hasil **100% PASS (Lulus)**. Berikut adalah tabel dokumentasi fitur yang dilindungi:

### Backend API Tests (Jest)

| Modul/Fitur | Status Test | Deskripsi yang Diuji |
| :--- | :---: | :--- |
| **Authentication** | ✅ PASS | Validasi input kosong, salah *password*, hingga sukses *login* (*JWT Token*). Validasi reservasi *subdomain*. |
| **Idempotency** | ✅ PASS | Middleware `Idempotency-Key` untuk mencegah duplikasi *request* pembayaran. |
| **Dashboard** | ✅ PASS | Kalkulasi agregasi penjualan hari ini, bulan ini, kalkulasi stok habis, serta kas arus kas terakhir. |
| **Products** | ✅ PASS | Daftar inventori produk, *ordering* berdasarkan PIN, serta fungsionalitas PIN/UNPIN. |
| **Warehouse** | ✅ PASS | Integrasi antar produk dan gudang, notifikasi stok menipis, serta fungsi penyesuaian stok (*Stock Adjustment*). |
| **Discounts** | ✅ PASS | Pembuatan tipe diskon *fixed* dan persentase untuk di-aplikasikan otomatis atau manual. |
| **Checkout & Receipts**| ✅ PASS | Penolakan keranjang kosong, penolakan kurang bayar, kalkulasi kembalian otomatis, serta pencetakan struk. |
| **Transactions** | ✅ PASS | Pencarian riwayat transaksi berdasarkan tanggal, struk, atau nama kasir. |
| **Cashflow** | ✅ PASS | Validasi *Cash In* dan *Cash Out* dengan integrasi pencatatan otomatis saat transaksi terjadi. |
| **Settings** | ✅ PASS | Fitur pembaruan profil toko (Tenant Branding), penambahan dan penghapusan *Staff/Kasir*. |

### Frontend UI Tests (Vitest + JSDOM)

| Komponen UI | Status Test | Deskripsi yang Diuji |
| :--- | :---: | :--- |
| **Terminal POS** | ✅ PASS | Simulasi klik produk ke keranjang belanja, hingga memastikan subtotal keranjang bertambah akurat. |
| **Dashboard UI** | ✅ PASS | Mampu me-render grafik (Recharts mock) dan mencetak nominal pendapatan dengan pemformatan Rupiah yang tepat. |
| **Products UI** | ✅ PASS | Merender tabel inventaris lengkap dengan integrasi Axios API Mocks. |
| **Stats Card** | ✅ PASS | Menguji fungsionalitas rendering judul dan nominal statistik pada komponen UI terpisah. |

Semua *test runner* akan menghasilkan **Exit Code 0** jika seluruh sistem bersih dari *bug* krusial.
