# Black Box Testing — LazeePOS

> Dokumen ini berisi skenario pengujian fungsional (*black box*) yang dapat dijalankan **tanpa perlu melihat kode sumber**.
> Uji setiap skenario menggunakan browser biasa setelah aplikasi berjalan.
>
> **Prasyarat sebelum testing:**
> - Aplikasi berjalan di `http://localhost:5173` (atau `http://lazeepos.local` via Docker)
> - Database sudah di-seed: `npm run db:seed`
> - Akun tersedia: `admin@lazeepos.com` / `Admin123!` dan `demo@lazeepos.com` / `Demo123!`

---

## Konvensi Status

| Simbol | Arti |
|---|---|
| ✅ | Test LULUS — hasil sesuai ekspektasi |
| ❌ | Test GAGAL — catat penyimpangannya |
| ⬜ | Belum diuji |

---

## BAGIAN 1 — Autentikasi

### TC-AUTH-01: Login Central Admin Berhasil
| | |
|---|---|
| **URL** | `/central-login` |
| **Langkah** | 1. Buka halaman `/central-login` <br> 2. Masukkan email `admin@lazeepos.com` <br> 3. Masukkan password `Admin123!` <br> 4. Klik tombol Login |
| **Ekspektasi** | Diarahkan ke `/central` (dashboard central admin) |
| **Status** | ⬜ |

### TC-AUTH-02: Login dengan Password Salah
| | |
|---|---|
| **URL** | `/central-login` |
| **Langkah** | 1. Masukkan email valid <br> 2. Masukkan password `salahpassword` <br> 3. Klik Login |
| **Ekspektasi** | Muncul pesan error "Password salah" / "Kredensial tidak valid". Tidak diarahkan ke mana pun |
| **Status** | ⬜ |

### TC-AUTH-03: Login dengan Email Tidak Terdaftar
| | |
|---|---|
| **Langkah** | 1. Masukkan `tidakada@email.com` dan password apa pun <br> 2. Klik Login |
| **Ekspektasi** | Muncul pesan error. Tidak bisa masuk |
| **Status** | ⬜ |

### TC-AUTH-04: Login Tenant
| | |
|---|---|
| **URL** | `/login` |
| **Langkah** | 1. Buka `/login` <br> 2. Email: `demo@lazeepos.com` / Password: `Demo123!` <br> 3. Klik Login |
| **Ekspektasi** | Diarahkan ke `/dashboard` (dashboard toko) |
| **Status** | ⬜ |

### TC-AUTH-05: Akses Halaman Terproteksi Tanpa Login
| | |
|---|---|
| **Langkah** | 1. Buka browser baru (mode Incognito) <br> 2. Langsung akses `/dashboard` atau `/pos` |
| **Ekspektasi** | Diarahkan otomatis ke halaman `/login` |
| **Status** | ⬜ |

### TC-AUTH-06: Logout
| | |
|---|---|
| **Langkah** | 1. Login sebagai tenant <br> 2. Klik tombol Logout di sidebar <br> 3. Coba klik tombol Back browser |
| **Ekspektasi** | Kembali ke halaman login. Tombol Back tidak memperlihatkan halaman dashboard lagi |
| **Status** | ⬜ |

---

## BAGIAN 2 — Terminal POS (Kasir)

### TC-POS-01: Tambah Produk ke Keranjang
| | |
|---|---|
| **URL** | `/pos` |
| **Langkah** | 1. Klik salah satu produk di grid <br> 2. Perhatikan panel keranjang di kanan |
| **Ekspektasi** | Produk muncul di keranjang dengan quantity 1 |
| **Status** | ⬜ |

### TC-POS-02: Tambah Produk yang Sama Dua Kali
| | |
|---|---|
| **Langkah** | 1. Klik produk A satu kali <br> 2. Klik produk A sekali lagi |
| **Ekspektasi** | Quantity produk A menjadi 2, bukan 2 baris terpisah |
| **Status** | ⬜ |

### TC-POS-03: Kalkulasi Subtotal Benar
| | |
|---|---|
| **Langkah** | 1. Tambah Produk A (Rp 10.000) x2 <br> 2. Tambah Produk B (Rp 5.000) x1 |
| **Ekspektasi** | Subtotal = Rp 25.000 |
| **Status** | ⬜ |

### TC-POS-04: Checkout dengan Uang Pas
| | |
|---|---|
| **Langkah** | 1. Tambah produk total Rp 20.000 <br> 2. Pilih pembayaran Tunai <br> 3. Masukkan nominal Rp 20.000 <br> 4. Klik Bayar |
| **Ekspektasi** | Transaksi sukses. Kembalian = Rp 0. Struk muncul |
| **Status** | ⬜ |

### TC-POS-05: Checkout dengan Uang Lebih
| | |
|---|---|
| **Langkah** | Total Rp 15.000, bayar Rp 20.000 |
| **Ekspektasi** | Kembalian = Rp 5.000 ditampilkan dengan benar |
| **Status** | ⬜ |

### TC-POS-06: Checkout dengan Uang Kurang (Validasi)
| | |
|---|---|
| **Langkah** | Total Rp 15.000, masukkan nominal Rp 10.000 |
| **Ekspektasi** | Tombol Bayar tidak bisa ditekan, atau muncul pesan error "Nominal tidak cukup" |
| **Status** | ⬜ |

### TC-POS-07: Checkout Keranjang Kosong
| | |
|---|---|
| **Langkah** | Tidak tambah produk apa pun, langsung klik tombol Bayar |
| **Ekspektasi** | Muncul pesan error / tombol Bayar tidak aktif |
| **Status** | ⬜ |

### TC-POS-08: Stok Berkurang Setelah Checkout
| | |
|---|---|
| **Langkah** | 1. Catat stok Produk A di `/warehouse` (misal: 10) <br> 2. Checkout 3 unit Produk A <br> 3. Buka `/warehouse` kembali |
| **Ekspektasi** | Stok Produk A berkurang menjadi 7 |
| **Status** | ⬜ |

### TC-POS-09: Scan Barcode / Input SKU
| | |
|---|---|
| **Langkah** | 1. Klik field pencarian produk di POS <br> 2. Ketik SKU produk yang ada di database |
| **Ekspektasi** | Produk dengan SKU tersebut ditemukan dan bisa ditambah ke keranjang |
| **Status** | ⬜ |

### TC-POS-10: Hold Order (Tahan Pesanan)
| | |
|---|---|
| **Langkah** | 1. Tambah beberapa produk ke keranjang <br> 2. Klik tombol Hold <br> 3. Keranjang dikosongkan <br> 4. Klik tombol Recall/Ambil pesanan yang di-hold |
| **Ekspektasi** | Pesanan yang di-hold bisa dipanggil kembali dengan produk yang sama |
| **Status** | ⬜ |

---

## BAGIAN 3 — Manajemen Produk & Gudang

### TC-PROD-01: Tambah Produk Baru
| | |
|---|---|
| **URL** | `/products` → Tambah Produk |
| **Langkah** | 1. Isi nama, harga, SKU, kategori <br> 2. Klik Simpan |
| **Ekspektasi** | Produk muncul di daftar. Stok awal 0 di gudang |
| **Status** | ⬜ |

### TC-PROD-02: Tambah Produk Tanpa Nama (Validasi)
| | |
|---|---|
| **Langkah** | Biarkan field Nama kosong, isi field lain, klik Simpan |
| **Ekspektasi** | Muncul pesan validasi "Nama produk wajib diisi" |
| **Status** | ⬜ |

### TC-PROD-03: Edit Produk
| | |
|---|---|
| **Langkah** | 1. Klik ikon edit pada produk yang ada <br> 2. Ubah nama / harga <br> 3. Simpan |
| **Ekspektasi** | Perubahan tersimpan dan terlihat di daftar |
| **Status** | ⬜ |

### TC-PROD-04: Hapus Produk
| | |
|---|---|
| **Langkah** | 1. Klik ikon hapus produk <br> 2. Konfirmasi di dialog |
| **Ekspektasi** | Produk hilang dari daftar dan tidak muncul di POS |
| **Status** | ⬜ |

### TC-PROD-05: Tambah Stok di Gudang
| | |
|---|---|
| **URL** | `/warehouse` |
| **Langkah** | 1. Klik Tambah Stok pada produk <br> 2. Masukkan jumlah (misal: 50) <br> 3. Simpan |
| **Ekspektasi** | Stok bertambah sesuai angka yang dimasukkan |
| **Status** | ⬜ |

### TC-PROD-06: Alert Stok Menipis
| | |
|---|---|
| **Langkah** | 1. Set reorder level produk = 5 <br> 2. Atur stok menjadi 3 (lewat adjust) |
| **Ekspektasi** | Produk muncul dengan indikator "Stok Menipis" di dashboard atau gudang |
| **Status** | ⬜ |

---

## BAGIAN 4 — Sistem Diskon

### TC-DISC-01: Tambah Diskon Persentase
| | |
|---|---|
| **URL** | `/discounts` |
| **Langkah** | 1. Buat diskon 20% untuk semua produk <br> 2. Buka POS, tambah produk Rp 10.000 |
| **Ekspektasi** | Diskon Rp 2.000 diterapkan otomatis. Total = Rp 8.000 |
| **Status** | ⬜ |

### TC-DISC-02: Diskon dengan Syarat Minimum Qty
| | |
|---|---|
| **Langkah** | 1. Buat diskon 10% dengan min. qty = 3 <br> 2. Di POS, tambah produk sebanyak 2 <br> 3. Cek apakah diskon muncul <br> 4. Tambah 1 lagi (total 3), cek diskon |
| **Ekspektasi** | Diskon TIDAK aktif saat qty < 3, aktif saat qty ≥ 3 |
| **Status** | ⬜ |

### TC-DISC-03: BOGO (Beli 1 Gratis 1)
| | |
|---|---|
| **Langkah** | 1. Buat diskon BOGO untuk Produk A (Rp 10.000) <br> 2. Di POS, tambah 2 unit Produk A |
| **Ekspektasi** | 1 unit gratis — total = Rp 10.000 (bukan Rp 20.000) |
| **Status** | ⬜ |

---

## BAGIAN 5 — Manajemen Meja & Antrean Dapur

### TC-TABLE-01: Tampilan Status Meja
| | |
|---|---|
| **URL** | `/tables` |
| **Langkah** | Buka halaman manajemen meja |
| **Ekspektasi** | Setiap meja menampilkan nomor, area, dan status (Kosong/Terisi/Menunggu) |
| **Status** | ⬜ |

### TC-TABLE-02: Generate QR Code Meja
| | |
|---|---|
| **Langkah** | 1. Klik ikon QR Code pada salah satu meja <br> 2. Scan QR dengan ponsel |
| **Ekspektasi** | Terbuka halaman menu digital pelanggan di ponsel |
| **Status** | ⬜ |

### TC-KDS-01: Pesanan Masuk ke Dapur
| | |
|---|---|
| **URL** | `/queue` (Kitchen Display) |
| **Langkah** | 1. Buka tab Kitchen Display di satu browser <br> 2. Di browser lain, checkout pesanan di POS <br> 3. Perhatikan tab Kitchen Display |
| **Ekspektasi** | Pesanan muncul di Kitchen Display dalam hitungan detik |
| **Status** | ⬜ |

---

## BAGIAN 6 — Buku Kas

### TC-CASH-01: Tambah Pemasukan Manual
| | |
|---|---|
| **URL** | `/cashflow` |
| **Langkah** | 1. Klik Tambah → pilih Pemasukan <br> 2. Isi nominal Rp 500.000, deskripsi "Modal awal" <br> 3. Simpan |
| **Ekspektasi** | Entri muncul di daftar arus kas dengan label Masuk |
| **Status** | ⬜ |

### TC-CASH-02: Otomatis Tercatat Setelah Transaksi POS
| | |
|---|---|
| **Langkah** | 1. Catat saldo kas saat ini <br> 2. Lakukan 1 transaksi POS Rp 20.000 <br> 3. Buka `/cashflow` |
| **Ekspektasi** | Entri baru Rp 20.000 (sumber: TRANSACTION) muncul otomatis |
| **Status** | ⬜ |

---

## BAGIAN 7 — Pengaturan Toko (Settings)

### TC-SETT-01: Ubah Nama Toko
| | |
|---|---|
| **URL** | `/settings` |
| **Langkah** | 1. Ubah nama toko menjadi "Toko Uji Coba" <br> 2. Simpan <br> 3. Refresh halaman |
| **Ekspektasi** | Nama toko berubah di sidebar dan halaman publik toko |
| **Status** | ⬜ |

### TC-SETT-02: Ubah Warna Tema
| | |
|---|---|
| **Langkah** | 1. Ubah Primary Color menjadi warna lain (misal: #E91E63) <br> 2. Simpan |
| **Ekspektasi** | Warna tombol, aksen, dan sidebar berubah mengikuti warna baru |
| **Status** | ⬜ |

### TC-SETT-03: Tambah Karyawan Baru
| | |
|---|---|
| **Langkah** | 1. Buka tab Manajemen Staf <br> 2. Tambah karyawan baru (email + role kasir) <br> 3. Login dengan akun karyawan tersebut |
| **Ekspektasi** | Karyawan berhasil dibuat dan bisa login. Hanya bisa akses menu Kasir |
| **Status** | ⬜ |

### TC-SETT-04: Nonaktifkan Karyawan
| | |
|---|---|
| **Langkah** | 1. Nonaktifkan akun kasir yang sudah dibuat <br> 2. Coba login dengan akun kasir tersebut |
| **Ekspektasi** | Login ditolak / muncul pesan "Akun tidak aktif" |
| **Status** | ⬜ |

---

## BAGIAN 8 — Central Admin

### TC-CENTRAL-01: Dashboard Menampilkan Statistik
| | |
|---|---|
| **URL** | `/central` |
| **Langkah** | Login sebagai Central Admin, buka dashboard |
| **Ekspektasi** | Terlihat angka total tenant, MRR, status tenant (active/trial/suspended) |
| **Status** | ⬜ |

### TC-CENTRAL-02: Suspend Tenant
| | |
|---|---|
| **URL** | `/central/tenants` |
| **Langkah** | 1. Klik detail salah satu tenant <br> 2. Ubah status menjadi Suspended <br> 3. Coba login sebagai tenant tersebut |
| **Ekspektasi** | Login tenant ditolak dengan pesan "Akun di-suspend" atau serupa |
| **Status** | ⬜ |

### TC-CENTRAL-03: Edit CMS Landing Page
| | |
|---|---|
| **URL** | `/central/platform` |
| **Langkah** | 1. Ubah teks Headline Hero Section <br> 2. Simpan <br> 3. Buka halaman utama `http://localhost:5173` |
| **Ekspektasi** | Teks Hero berubah sesuai yang diketik di CMS |
| **Status** | ⬜ |

### TC-CENTRAL-04: Tambah Topik Dokumentasi
| | |
|---|---|
| **Langkah** | 1. Di CMS → tab Dokumentasi <br> 2. Tambah topik baru dengan judul & konten <br> 3. Simpan <br> 4. Buka `http://localhost:5173/docs` |
| **Ekspektasi** | Topik baru muncul di sidebar navigasi halaman Docs |
| **Status** | ⬜ |

---

## BAGIAN 9 — Halaman Publik

### TC-PUB-01: Landing Page Dapat Diakses
| | |
|---|---|
| **URL** | `http://localhost:5173` |
| **Langkah** | Buka URL tanpa login |
| **Ekspektasi** | Halaman terbuka dengan konten Hero, Fitur, Harga, FAQ, Footer. Tidak ada error |
| **Status** | ⬜ |

### TC-PUB-02: Halaman Docs Dapat Diakses
| | |
|---|---|
| **URL** | `http://localhost:5173/docs` |
| **Langkah** | Buka URL tanpa login |
| **Ekspektasi** | Halaman dokumentasi terbuka dengan sidebar topik dan konten |
| **Status** | ⬜ |

### TC-PUB-03: Navigasi Sidebar Docs
| | |
|---|---|
| **Langkah** | Klik setiap topik di sidebar Docs |
| **Ekspektasi** | Konten di panel kanan berganti sesuai topik yang diklik |
| **Status** | ⬜ |

---

## BAGIAN 10 — Keamanan & Edge Cases

### TC-SEC-01: Akses API Tanpa Token
| | |
|---|---|
| **Langkah** | Gunakan Postman/curl: `GET http://localhost:5000/api/v1/products` tanpa header Authorization |
| **Ekspektasi** | Response `401 Unauthorized` |
| **Status** | ⬜ |

### TC-SEC-02: Akses API Tenant Lain (Isolasi Data)
| | |
|---|---|
| **Langkah** | Login sebagai Tenant A, coba akses produk Tenant B via API dengan mengubah tenantId di query |
| **Ekspektasi** | Data Tenant B tidak bisa diakses. Response `403 Forbidden` atau data kosong |
| **Status** | ⬜ |

### TC-SEC-03: Input Terlalu Panjang
| | |
|---|---|
| **Langkah** | Di form tambah produk, isi nama produk dengan 500 karakter |
| **Ekspektasi** | Sistem menolak atau memotong input, tidak terjadi error 500 |
| **Status** | ⬜ |

### TC-SEC-04: Double Submit Checkout (Idempotency)
| | |
|---|---|
| **Langkah** | Gunakan Postman: kirim request checkout yang sama dua kali dengan `Idempotency-Key` yang sama |
| **Ekspektasi** | Hanya 1 transaksi yang tersimpan di database. Request kedua mengembalikan response yang sama dengan yang pertama |
| **Status** | ⬜ |

---

## Lembar Hasil Testing

Salin tabel di bawah ini ke spreadsheet untuk dokumentasi hasil:

| Kode TC | Nama Test | Tanggal | Tester | Status | Catatan Bug |
|---|---|---|---|---|---|
| TC-AUTH-01 | Login Central Admin | | | ⬜ | |
| TC-AUTH-02 | Login Password Salah | | | ⬜ | |
| TC-AUTH-03 | Login Email Tidak Ada | | | ⬜ | |
| TC-AUTH-04 | Login Tenant | | | ⬜ | |
| TC-AUTH-05 | Akses Tanpa Login | | | ⬜ | |
| TC-AUTH-06 | Logout | | | ⬜ | |
| TC-POS-01 | Tambah Produk | | | ⬜ | |
| TC-POS-02 | Produk Sama 2x | | | ⬜ | |
| TC-POS-03 | Kalkulasi Subtotal | | | ⬜ | |
| TC-POS-04 | Checkout Uang Pas | | | ⬜ | |
| TC-POS-05 | Checkout Uang Lebih | | | ⬜ | |
| TC-POS-06 | Checkout Uang Kurang | | | ⬜ | |
| TC-POS-07 | Checkout Keranjang Kosong | | | ⬜ | |
| TC-POS-08 | Stok Berkurang | | | ⬜ | |
| TC-POS-09 | Scan SKU | | | ⬜ | |
| TC-POS-10 | Hold Order | | | ⬜ | |
| TC-PROD-01 | Tambah Produk | | | ⬜ | |
| TC-PROD-02 | Validasi Nama Kosong | | | ⬜ | |
| TC-PROD-03 | Edit Produk | | | ⬜ | |
| TC-PROD-04 | Hapus Produk | | | ⬜ | |
| TC-PROD-05 | Tambah Stok | | | ⬜ | |
| TC-PROD-06 | Alert Stok Menipis | | | ⬜ | |
| TC-DISC-01 | Diskon Persentase | | | ⬜ | |
| TC-DISC-02 | Diskon Min Qty | | | ⬜ | |
| TC-DISC-03 | BOGO | | | ⬜ | |
| TC-TABLE-01 | Status Meja | | | ⬜ | |
| TC-TABLE-02 | QR Code Meja | | | ⬜ | |
| TC-KDS-01 | Pesanan ke Dapur | | | ⬜ | |
| TC-CASH-01 | Tambah Kas Manual | | | ⬜ | |
| TC-CASH-02 | Kas Otomatis | | | ⬜ | |
| TC-SETT-01 | Ubah Nama Toko | | | ⬜ | |
| TC-SETT-02 | Ubah Warna Tema | | | ⬜ | |
| TC-SETT-03 | Tambah Karyawan | | | ⬜ | |
| TC-SETT-04 | Nonaktifkan Karyawan | | | ⬜ | |
| TC-CENTRAL-01 | Dashboard Central | | | ⬜ | |
| TC-CENTRAL-02 | Suspend Tenant | | | ⬜ | |
| TC-CENTRAL-03 | Edit CMS Landing | | | ⬜ | |
| TC-CENTRAL-04 | Tambah Docs Topik | | | ⬜ | |
| TC-PUB-01 | Landing Page | | | ⬜ | |
| TC-PUB-02 | Halaman Docs | | | ⬜ | |
| TC-PUB-03 | Navigasi Docs | | | ⬜ | |
| TC-SEC-01 | API Tanpa Token | | | ⬜ | |
| TC-SEC-02 | Isolasi Data Tenant | | | ⬜ | |
| TC-SEC-03 | Input Terlalu Panjang | | | ⬜ | |
| TC-SEC-04 | Double Submit | | | ⬜ | |
