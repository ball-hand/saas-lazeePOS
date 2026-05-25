# Dokumentasi Database & Relasi Model

Sistem ini didesain menggunakan **Prisma ORM** di atas database **MySQL**. Arsitekturnya berfokus pada "Single Database, Shared Schema" dengan isolasi multi-tenant yang diidentifikasi dari kolom `tenantId` pada setiap tabel bisnis.

## Skema Inti (SaaS & Autentikasi)

### 1. `Tenant`
Entitas utama setiap toko (toko pelanggan).
- `id`: UUID Primary Key
- `subdomain`: Identitas unik URL (contoh: *tokobudi.lazeepos.com*)
- `status`: Status dari toko (*TRIAL, ACTIVE, SUSPENDED*)
- Relasi (1-to-Many) ke: `User`, `Product`, `Transaction`, `Cashflow`, `Ticket`, dll.

### 2. `User`
Data akun untuk otentikasi login.
- `email` (Unik), `passwordHash`, `role` (central / admin / kasir).
- `tenantId`: FK ke `Tenant`. (Jika null, berarti ia adalah super-admin Central).

### 3. `Plan` & `Subscription`
Model yang mengatur paket harga berlangganan (*Pro, Starter*) dan data langganan tenant saat ini.
- `Plan`: Harga, maksimal produk, daftar fitur.
- `Subscription`: Status pembayaran tenant terhadap paket yang dipilih.
- `PaymentTransaction`: Menyimpan log integrasi pembayaran (seperti Order ID dari Midtrans).

---

## Skema Operasional (Bisnis Toko)

### 4. `Product` & `Warehouse`
Katalog dan inventaris.
- `Product`: Berisi `price`, `sku`, `category`, dan gambar. Merupakan Harga Master.
- `Warehouse`: Ekstensi 1-to-1 dengan produk untuk melacak `quantity` (stok fisik) dan `reorderLevel` secara terpisah.

### 5. `Discount`
Mesin diskon kondisional.
- Jenis (`discountType`): Persentase, Jumlah Tetap, atau Beli 1 Gratis 1.
- Target (`appliesTo`): Semua produk atau berdasarkan kategori.

### 6. `CashFlow`
Buku kas. Menyimpan entri aliran dana (masuk/keluar). Secara otomatis ditambahkan jika terjadi transaksi sukses di terminal POS.

---

## Skema Penjualan (Point of Sale)

### 7. `Shift`
Sesi kerja kasir harian.
- `openingCash`: Kas tunai fisik laci saat hari/shift dibuka.
- `closedAt` & `closingCash`: Untuk keperluan rekonsiliasi akhir kasir.

### 8. `Transaction` & `TransactionItem`
Data master penjualan.
- `Transaction`: Menyimpan total bayar, kembalian uang, status (*COMPLETED / VOID*), serta direlasikan ke `Shift` dan `User` (kasir).
- `TransactionItem`: Detail keranjang yang memuat harga sesaat (*unitPrice*) dan produk (*productId*). (Ini mencegah perubahan harga produk di masa depan merusak laporan lama).

### 9. `Receipt` & `ReceiptItem`
Data transaksi yang diformat khusus dan dibekukan (*frozen*) untuk ditampilkan/dicetak ke pelanggan.

---

## Skema Pelengkap & Log Sistem

### 10. `Ticket` & `TicketReply`
Sistem pusat bantuan (Bantuan Pelanggan / Bug Report). Menghubungkan *User* di sebuah tenant dengan *SuperAdmin* di *Central*.

### 11. `CentralAuditLog` & `SystemErrorLog`
- Jejak audit apa saja aksi yang dilakukan SuperAdmin (misal: suspend tenant).
- Log error sistem untuk memudahkan *debugging* tanpa membuka server.

### 12. `IdempotencyKey`
Tabel keamanan API untuk merekam request HTTP *POST/PUT* yang sama. Berguna untuk menghindari *double-insert* pesanan akibat pengguna mengeklik tombol Checkout dua kali (kasus jaringan lambat).
