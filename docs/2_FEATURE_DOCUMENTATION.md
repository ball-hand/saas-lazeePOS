# Dokumentasi Fitur LazeePOS

LazeePOS memisahkan kontrol dan fungsionalitas menjadi 3 ranah peran (*Role*) yang berbeda untuk menjaga keamanan, efektivitas operasional, dan kejelasan alur kerja.

---

## A. Fitur Pemilik Platform (Super Admin / Central)
Hanya diakses melalui `lazeepos.com/central-login` dengan akun *Super Admin*.

1. **Central Dashboard (Overview)**
   *   Melihat rekap data jumlah tenant aktif, suspended, atau trial.
   *   Melacak metrik MRR (*Monthly Recurring Revenue*) dari semua tagihan sukses.
2. **Manajemen Tenant**
   *   Melihat daftar seluruh toko pengguna platform.
   *   Mampu melakukan *suspend* jika ada penyalahgunaan atau tunggakan.
3. **Manajemen Penagihan (Billing Logs)**
   *   Log seluruh tagihan pembayaran SaaS (*settlement, pending, expire*).
4. **Pusat Tiket Dukungan (Ticketing System)**
   *   Membalas dan mengelola tiket laporan masalah / *bug* yang dikirimkan oleh Tenant.
5. **Sistem Pembaruan & Rilis (Changelog Manager)**
   *   Merilis log versi baru (misal v1.2.0) yang akan terbaca sebagai notifikasi oleh seluruh tenant.
6. **Central CMS (Content Management System)**
   *   Mengatur UI/UX Halaman Landing utama (lazeepos.com) tanpa merombak kode, seperti merubah teks pengumuman, ikon, warna tema, hingga mengaktifkan/menonaktifkan segmen harga.

---

## B. Fitur Pemilik Toko (Tenant Admin)
Diakses melalui `subdomain.lazeepos.com/login` oleh pihak manajer/pemilik bisnis.

1. **Dashboard Penjualan**
   *   Tinjauan omzet harian, transaksi terakhir, dan notifikasi stok produk yang menipis.
2. **Manajemen Produk & Gudang (Warehouse)**
   *   Pembuatan katalog produk (nama, harga, kategori).
   *   Menyesuaikan level stok inventaris, serta menentukan jumlah minim (*reorder level*).
3. **Sistem Diskon & Promo**
   *   Mengatur diskon (persentase, nilai tetap, Beli-1-Gratis-1) dengan kondisi spesifik (minimal kuantitas, dll).
4. **Buku Kas (CashFlow)**
   *   Pencatatan uang masuk dan uang keluar yang dilakukan secara manual atau otomatis terhubung dengan modul Kasir.
5. **Manajemen Karyawan (Staf & Kasir)**
   *   Mengundang, menambahkan, atau menonaktifkan akun operator kasir.
   *   Kapasitas maksimal karyawan otomatis divalidasi sesuai dengan kuota batas langganan toko (*maxUsers*).
   *   Pencegahan penghapusan (Anti-lockout) agar toko tidak kehilangan akses Admin utamanya.
6. **Pengaturan & White-labeling (Settings)**
   *   **Branding**: Mengubah bentuk logo, mengunggah gambar logo, mengganti nama toko.
   *   **Tema CSS**: Menyesuaikan Warna Utama (*Primary Color*) yang akan di-inject ke seluruh CSS aplikasi dan *Landing Page* agar sesuai identitas merek toko.
6. **Billing SaaS (Langganan)**
   *   Mengelola status paket langganan toko saat ini ke pemilik platform.

---

## C. Fitur Karyawan (Tenant Kasir)
Diakses oleh operator toko. Tampilannya lebih sederhana dan dibatasi hanya pada operasional kas.

1. **Aplikasi Mesin Kasir (Terminal POS)**
   *   Menambahkan produk ke keranjang belanja melalui klik atau pemindaian *barcode/SKU*.
   *   Kalkulasi otomatis: Subtotal, diskon terpasang, pajak PPN, hingga uang kembalian.
   *   Struk pembayaran yang dicetak bersih dan responsif.
2. **Shift Kerja (Open/Close Register)**
   *   Mencatat uang tunai awal modal hari ini dan saldo akhir sebelum mesin dimatikan untuk rekonsiliasi kas.
3. **Riwayat Transaksi**
   *   Melihat kembali transaksi hari ini atau membatalkan (*void*) transaksi jika ada kesalahan pesanan (tergantung limitasi dari toko).
