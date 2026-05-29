# Dokumentasi Database & Relasi Model — LazeePOS

> **⚠️ PROPRIETARY SOFTWARE** — Milik eksklusif **Lazee Teknologi**. Lihat [LICENSE](../LICENSE).

Sistem ini menggunakan **Prisma ORM** di atas **MySQL 8** dengan arsitektur **Single Database, Shared Schema**. Isolasi data antar tenant dilakukan melalui kolom `tenantId` di setiap tabel bisnis.

---

## Diagram Relasi Utama

```
PlatformSetting (1)
    └── CMS config global platform

CentralAdmin (1..n)
    └── CentralAuditLog (n)

Plan (n) ─────────────────────────┐
                                  ▼
Tenant (1) ──────── Subscription (1)
    │                    └── PaymentTransaction (n)
    │
    ├── User (n)
    │     └── (role: admin | kasir)
    │
    ├── Product (n)
    │     └── Warehouse (1) [1-to-1]
    │
    ├── Discount (n)
    │
    ├── Table (n)
    │     └── (QR Code unik per meja)
    │
    ├── Shift (n)
    │     └── Transaction (n)
    │           ├── TransactionItem (n)
    │           │     └── Product
    │           └── Receipt (1)
    │                 └── ReceiptItem (n)
    │
    ├── CashFlow (n)
    ├── Ticket (n)
    │     └── TicketReply (n)
    └── ReleaseVersion (n) [via central]
```

---

## Grup 1: SaaS Core & Platform

### `PlatformSetting`
Singleton global untuk konfigurasi seluruh platform.

| Field | Type | Keterangan |
|---|---|---|
| `id` | String | Primary key (nilai: `"global"`) |
| `cmsConfig` | Json | Seluruh konfigurasi CMS Landing Page |
| `updatedAt` | DateTime | Terakhir diupdate |

> `cmsConfig` menyimpan JSON blob berisi: hero, features, howItWorks, docs, faq, footer, pricing, dsb.

---

### `Tenant`
Entitas utama setiap toko/bisnis pelanggan platform.

| Field | Type | Keterangan |
|---|---|---|
| `id` | String (UUID) | Primary Key |
| `name` | String | Nama bisnis / toko |
| `subdomain` | String (Unique) | URL unik (`kopi.lazeepos.com`) |
| `status` | Enum | `TRIAL`, `ACTIVE`, `SUSPENDED` |
| `primaryColor` | String | Warna aksen tema (#HEX) |
| `themeMode` | String | `light` / `dark` |
| `logoUrl` | String? | Path logo toko |
| `logoShape` | String | `square` / `circle` |
| `qrisUrl` | String? | Gambar QR QRIS toko |
| `isQrisActive` | Boolean | Wajib QRIS di meja aktif? |
| `landingPageConfig` | Json? | Konfigurasi halaman publik toko |
| `autoClearTableMinutes` | Int | Auto-kosongkan meja (menit) |
| `createdAt` | DateTime | Tanggal daftar |

---

### `User`
Akun autentikasi (Central Admin, Tenant Admin, Kasir).

| Field | Type | Keterangan |
|---|---|---|
| `id` | String (UUID) | Primary Key |
| `email` | String (Unique) | Email login |
| `passwordHash` | String | Bcrypt hash |
| `name` | String | Nama tampil |
| `role` | Enum | `central`, `admin`, `kasir` |
| `tenantId` | String? | FK ke Tenant (`null` = Central Admin) |
| `isActive` | Boolean | Akun aktif/nonaktif |

---

### `Plan` & `Subscription` & `PaymentTransaction`
Model pengelolaan paket & billing SaaS.

**`Plan`** — Definisi paket harga:
- `name`, `price`, `maxProducts`, `maxUsers`, `maxBranches`, `maxTables`
- `features` (JSON array fitur yang diaktifkan)

**`Subscription`** — Langganan aktif per tenant:
- `tenantId`, `planId`, `status` (`ACTIVE`, `EXPIRED`, `CANCELLED`)
- `startDate`, `endDate`, `billingCycle`

**`PaymentTransaction`** — Log pembayaran Midtrans:
- `orderId` (Midtrans order ID), `amount`, `status`
- Status: `pending`, `settlement`, `expire`, `cancel`, `refund`

---

## Grup 2: Operasional Toko

### `Product`
Master katalog produk.

| Field | Type | Keterangan |
|---|---|---|
| `id` | String | Primary Key |
| `tenantId` | String | FK ke Tenant |
| `name` | String | Nama produk |
| `price` | Float | Harga jual |
| `costPrice` | Float? | Harga pokok modal |
| `sku` | String? | Kode SKU barcode |
| `category` | String? | Kategori produk |
| `imageUrl` | String? | Foto produk |
| `isPinned` | Boolean | Tampil di atas di POS |
| `isActive` | Boolean | Aktif/nonaktif di kasir |

### `Warehouse`
Inventaris stok (1-to-1 dengan Product).

| Field | Type | Keterangan |
|---|---|---|
| `productId` | String (PK) | FK + PK ke Product |
| `quantity` | Int | Stok saat ini |
| `reorderLevel` | Int | Batas minimum stok (alert) |

---

### `Discount`
Mesin diskon kondisional.

| Field | Type | Keterangan |
|---|---|---|
| `type` | Enum | `PERCENTAGE`, `FIXED`, `BOGO` |
| `value` | Float | Nilai diskon |
| `appliesTo` | Enum | `ALL`, `CATEGORY` |
| `category` | String? | Target kategori |
| `minQuantity` | Int? | Minimal qty untuk aktif |
| `startDate` / `endDate` | DateTime? | Periode berlaku |
| `code` | String? | Kode kupon |
| `isActive` | Boolean | Status aktif |

---

### `Table`
Data meja restoran/toko.

| Field | Type | Keterangan |
|---|---|---|
| `id` | String | Primary Key |
| `tenantId` | String | FK ke Tenant |
| `number` | String | Nomor/nama meja |
| `area` | String? | Nama area (indoor/outdoor) |
| `capacity` | Int | Kapasitas kursi |
| `status` | Enum | `EMPTY`, `OCCUPIED`, `WAITING` |
| `qrCode` | String? | URL QR Code pelanggan |

---

## Grup 3: Transaksi Point of Sale

### `Shift`
Sesi kerja kasir harian.

| Field | Type | Keterangan |
|---|---|---|
| `openingCash` | Float | Uang tunai awal shift |
| `closingCash` | Float? | Uang tunai akhir shift |
| `openedAt` | DateTime | Waktu buka kasir |
| `closedAt` | DateTime? | Waktu tutup kasir |
| `userId` | String | Kasir yang bertugas |

### `Transaction` & `TransactionItem`
Data penjualan.

**`Transaction`**:
- `totalAmount`, `paidAmount`, `changeAmount`
- `paymentMethod`: `CASH`, `QRIS`, `CARD`, `SPLIT`
- `status`: `COMPLETED`, `VOID`
- Relasi ke: `Shift`, `User` (kasir), `Table` (opsional)

**`TransactionItem`**:
- `productId`, `productName` *(snapshot nama saat transaksi)*
- `unitPrice` *(snapshot harga saat transaksi — mencegah perubahan harga merusak laporan lama)*
- `quantity`, `discountAmount`

### `Receipt` & `ReceiptItem`
Format struk yang "dibekukan" (*frozen*) untuk cetak/tampil ke pelanggan.
- Data snapshot lengkap: nama toko, logo, tagline, footer, pajak, items
- Terpisah dari Transaction agar perubahan setting tidak merusak struk lama

---

## Grup 4: Sistem & Log

### `CashFlow`
Buku kas — otomatis tercatat saat transaksi sukses.

| Field | Type | Keterangan |
|---|---|---|
| `type` | Enum | `IN`, `OUT` |
| `amount` | Float | Nominal |
| `description` | String | Keterangan |
| `source` | Enum | `TRANSACTION`, `MANUAL` |

### `Ticket` & `TicketReply`
Sistem tiket support tenant ↔ Central Admin.
- `Ticket`: Subject, status (OPEN / IN_PROGRESS / RESOLVED), prioritas
- `TicketReply`: Pesan balasan beserta sender (tenant atau central)

### `CentralAuditLog`
Jejak semua aksi yang dilakukan Central Admin (suspend tenant, dll).

### `SystemErrorLog`
Log error backend untuk debugging tanpa buka server.

### `IdempotencyKey`
Tabel keamanan mencegah double-submit. Setiap request POST checkout wajib menyertakan header `Idempotency-Key` berisi UUID unik. Request yang sama (key sama) akan diabaikan dan dikembalikan response asli.

### `ReleaseVersion`
Catatan versi rilis platform. Ditampilkan sebagai notifikasi di dashboard semua tenant.

---

## Tips Prisma

```bash
# Setelah mengubah schema.prisma:
npx prisma generate      # Regenerate Prisma Client

# Sync schema ke database (dev only, tidak untuk prod):
npx prisma db push

# Lihat data via GUI:
npx prisma studio

# Buat migration file (production):
npx prisma migrate dev --name nama_migration
```
