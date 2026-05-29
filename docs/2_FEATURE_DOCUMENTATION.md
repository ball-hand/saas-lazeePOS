# Dokumentasi Fitur LazeePOS

> **⚠️ PROPRIETARY SOFTWARE** — Milik eksklusif **Lazee Teknologi**. Lihat [LICENSE](../LICENSE).

LazeePOS memisahkan akses dan fungsionalitas berdasarkan **3 peran (Role)** yang berbeda untuk menjaga keamanan, efektivitas operasional, dan kejelasan alur kerja.

---

## Hierarki Peran

```
┌──────────────────────────────────────┐
│         CENTRAL ADMIN                │  ← Pemilik Platform (Lazee Teknologi)
│  Akses: /central-login               │
│  Kelola: semua tenant, CMS, billing  │
└─────────────────┬────────────────────┘
                  │ mengelola
    ┌─────────────┴──────────────┐
    ▼                            ▼
┌──────────────────┐    ┌──────────────────┐
│  TENANT ADMIN    │    │   TENANT KASIR   │
│  (Pemilik Toko)  │    │  (Karyawan)      │
│  Akses: /login   │    │  Akses: /login   │
└──────────────────┘    └──────────────────┘
```

---

## A. Central Admin (Pemilik Platform)

Diakses melalui `https://lazeepos.com/central-login`. Hanya untuk tim internal Lazee Teknologi.

### 1. Central Dashboard
- Metrik realtime: total tenant aktif / trial / suspended
- MRR (Monthly Recurring Revenue) dari seluruh tagihan
- Grafik pertumbuhan tenant

### 2. Manajemen Tenant
- Daftar seluruh toko pengguna platform (filter, search, pagination)
- Detail per tenant: paket aktif, tanggal daftar, status pembayaran
- Aksi: **Activate**, **Suspend**, **Reset Password**, melihat detail lengkap

### 3. Central Billing
- Log seluruh PaymentTransaction SaaS (settlement, pending, expire, cancel)
- Filter per tenant, per periode, per status

### 4. Support Ticketing
- Menerima dan membalas tiket dari tenant (bug report, pertanyaan)
- Update status tiket: Open → In Progress → Resolved

### 5. Release Management (Changelog)
- Rilis versi baru (misal v1.3.0) dengan catatan perubahan
- Dapat ditandai **Mandatory** (semua tenant wajib refresh) atau **Optional**
- Notifikasi otomatis muncul di dashboard semua tenant

### 6. Platform CMS (Content Management System)
Editor visual untuk Landing Page publik (`lazeepos.com`) tanpa sentuh kode:
- **Hero Section**: Judul, subjudul, tombol CTA
- **Fitur Unggulan**: Edit/tambah/hapus 16 kartu fitur (ikon + judul + deskripsi)
- **Cara Kerja**: Langkah-langkah operasional
- **Dokumentasi**: Tambah/edit topik dokumentasi dengan Rich Text Editor
- **FAQ**: Daftar pertanyaan & jawaban
- **Footer**: Tagline dan copyright
- Toggle visibilitas per section (tampil/sembunyikan)

### 7. Server Status Monitor
- Status koneksi MySQL dan Redis secara realtime
- Log error sistem terbaru
- Central Audit Log: rekam jejak semua aksi admin

---

## B. Tenant Admin (Pemilik/Manajer Toko)

Diakses melalui `https://[subdomain].lazeepos.com/login` dengan role `admin`.

### 1. Dashboard Analytics
- Omzet hari ini, minggu ini, bulan ini
- Grafik penjualan (bar chart harian)
- Produk terlaris, stok hampir habis, transaksi terakhir

### 2. Terminal POS (Kasir)
- Keranjang belanja: tambah produk via klik atau scan barcode/SKU
- Kalkulasi otomatis: subtotal, diskon, pajak PPN, kembalian
- Split payment (tunai + QRIS)
- Hold order (tahan pesanan untuk pelanggan yang masih memilih)
- QRIS payment (tampil QR code untuk scan pelanggan)

### 3. Manajemen Meja & Kursi
- Layout meja visual dengan status real-time (kosong / terisi / menunggu)
- Generate QR Code unik per meja untuk menu digital pelanggan
- Atur nomor meja, nama area, kapasitas

### 4. Antrean Dapur (Kitchen Display System)
- Tampilan pesanan masuk secara realtime (polling / WebSocket)
- Kasir menandai item pesanan: "Sedang Diproses" → "Siap Diantar"
- Notifikasi suara saat pesanan baru masuk

### 5. Produk & Gudang
- Katalog produk: nama, harga jual, harga modal, SKU, kategori, gambar
- Stok otomatis terpotong saat transaksi selesai
- Restock masuk: tambah stok via form atau import
- Alert stok menipis (di bawah reorder level)
- Audit trail: riwayat semua perubahan stok

### 6. Sistem Diskon & Promo
- Tipe diskon:
  - **Persentase** (misal: 10% off)
  - **Jumlah Tetap** (misal: Rp 5.000 off)
  - **BOGO** (Beli 1 Gratis 1)
- Kondisi: minimal kuantitas, berlaku untuk kategori tertentu
- Periode berlaku (tanggal mulai & akhir)
- Kupon kode: input manual oleh kasir

### 7. Buku Kas (CashFlow Ledger)
- Catat pemasukan dan pengeluaran manual
- Otomatis tercatat saat transaksi POS selesai
- Filter per tanggal, per jenis (in/out)
- Ringkasan saldo per periode

### 8. Manajemen Staf & Karyawan
- Tambah akun kasir (email + password)
- Atur role: admin (akses penuh) / kasir (operasional saja)
- Nonaktifkan akun tanpa menghapus riwayat transaksi
- Batasan jumlah karyawan sesuai kuota paket langganan

### 9. Pengaturan & White-labeling
- **Branding**: Nama toko, logo (kotak/bulat), warna aksen tema
- **Tema**: Light mode / Dark mode
- **Struk**: Tagline header, pesan footer, pajak PPN
- **QRIS**: Upload gambar QR, aktifkan/nonaktifkan wajib QRIS di meja
- **Landing Page Toko**: Judul hero, deskripsi, galeri foto, jam operasional,
  WhatsApp, Instagram, TikTok, alamat, Google Maps embed
- **Pengumuman**: Promo atau info khusus yang muncul di halaman publik toko

### 10. Billing & Langganan SaaS
- Status paket saat ini (Gratis / Starter / Pro / Enterprise)
- Tombol upgrade paket (integrasi Midtrans: QRIS, VA Bank, Kartu)
- Riwayat pembayaran dan invoice

### 11. Support (Bantuan)
- Buat tiket komplain / pertanyaan ke tim Central Admin
- Pantau status tiket dan balas percakapan

---

## C. Tenant Kasir (Karyawan Operasional)

Diakses dengan role `kasir`. Tampilan disederhanakan, hanya fitur operasional.

| Fitur | Akses |
|---|---|
| Terminal POS (Kasir) | ✅ Penuh |
| Antrean Dapur (KDS) | ✅ Penuh |
| Manajemen Meja | ✅ Penuh |
| Riwayat Transaksi | ✅ Lihat saja |
| Menu Pelanggan (QR Scan) | ✅ Generate QR |
| Dashboard Analytics | ❌ Tidak bisa |
| Produk & Gudang | ❌ Tidak bisa |
| Diskon & Promo | ❌ Tidak bisa |
| Buku Kas | ❌ Tidak bisa |
| Manajemen Staf | ❌ Tidak bisa |
| Pengaturan | ❌ Tidak bisa |

---

## D. Halaman Publik (Tanpa Login)

### Landing Page Platform (`lazeepos.com`)
- Dikelola sepenuhnya melalui Central CMS
- Section: Hero, Fitur, Cara Kerja, Harga, FAQ, Dokumentasi, Footer
- Semua konten editable tanpa menyentuh kode

### Halaman Dokumentasi (`lazeepos.com/docs`)
- Sidebar navigasi topik
- Konten Rich Text (HTML) yang diambil dari database CMS
- Responsive mobile-first

### Menu Digital Pelanggan (`lazeepos.com/m/:tenantId/:tableId`)
- Pelanggan scan QR Code di meja
- Melihat menu katalog toko + pesan langsung
- Pesanan masuk otomatis ke Kitchen Display System (KDS)

---

## E. Batasan Per Paket (Plan Limits)

| Fitur | Free | Starter | Pro | Enterprise |
|---|---|---|---|---|
| Produk (SKU) | 100 | 500 | 2.000 | Unlimited |
| Karyawan | 2 | 5 | 15 | Unlimited |
| Cabang | 1 | 1 | 3 | Unlimited |
| Meja | 5 | 20 | 50 | Unlimited |
| Laporan historis | 30 hari | 90 hari | 1 tahun | Selamanya |
| Support | Community | Email | Priority | Dedicated |
