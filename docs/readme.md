# Panduan Pengujian (Testing Guide) LazeePOS SaaS

Dokumen ini berisi panduan teknis bagi *developer* atau *QA* untuk menguji pembaruan arsitektur backend terbaru yang mencakup standarisasi REST API v1, Middleware Idempotency, Pagination, dan Central Dashboard.

---

## 1. Persiapan Environment

Sebelum memulai tes, pastikan Anda telah menjalankan:
```bash
# 1. Start Docker (MySQL & Nginx jika diperlukan)
docker-compose up -d

# 2. Push Schema & Seed Database Backend
cd backend
npx prisma db push --accept-data-loss
npm run db:seed
npm start

# 3. Jalankan Frontend (Terminal Baru)
cd frontend
npm run dev
```

### Kredensial Bawaan (Hasil Seeding)
| Peran | URL | Email | Password |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `http://localhost:5173/central-login` | `admin@lazeepos.com` | `Admin123!` |
| **Tenant Admin** | `http://demo.lazeepos.local:5173/login` | `demo@lazeepos.com` | `Demo123!` |
| **Tenant Kasir** | `http://demo.lazeepos.local:5173/login` | `kasir@lazeepos.com` | `Kasir123!` |

---

## 2. Pengujian Global Response Handler & Versioning (v1)

Semua *route* kini menggunakan base URL `/api/v1/` dan dibungkus oleh *envelope* SaaS:
```json
{
  "status": "success",
  "data": { ... }
}
```

### Cara Tes:
1. Lakukan request ke `GET http://localhost:5000/api/v1/health`
2. **Ekspektasi Output**:
   ```json
   {
     "status": "success",
     "data": {
       "env": "development"
     }
   }
   ```

---

## 3. Pengujian Pagination Middleware

Pagination telah diterapkan pada endpoint-endpoint `GET`, misalnya pada daftar produk. Middleware otomatis mengonversi `page` dan `limit`.

### Cara Tes:
1. Pastikan Anda sudah login sebagai **Tenant Admin** (`demo@lazeepos.com`) dan mendapatkan JWT Token.
2. Lakukan request (via Postman atau cURL) ke: 
   `GET http://localhost:5000/api/v1/products?page=1&limit=2`
   *(Gunakan Header: `Authorization: Bearer <TOKEN>`)*
3. **Ekspektasi Output**:
   Sistem harusnya hanya mengembalikan 2 produk dan menampilkan objek metadata `pagination`:
   ```json
   {
     "status": "success",
     "data": {
       "products": [ ... ],
       "categories": [ ... ],
       "pagination": {
         "total": 10,
         "page": 1,
         "limit": 2,
         "totalPages": 5
       }
     }
   }
   ```

---

## 4. Pengujian Idempotency Middleware

Idempotency melindungi rute `POST`, `PUT`, dan `PATCH` dari eksekusi ganda apabila klien mengirimkan request yang sama berulang kali secara tidak sengaja (misalnya tombol Checkout terklik dua kali).

### Cara Tes (via Postman):
1. Siapkan endpoint `POST http://localhost:5000/api/v1/products`
2. Masukkan JWT Token di `Authorization: Bearer <TOKEN>`
3. Tambahkan di bagian **Headers**:
   - Key: `Idempotency-Key`
   - Value: `test-key-12345`
4. Masukkan Body JSON:
   ```json
   {
     "name": "Produk Test Idempotency",
     "price": 25000,
     "initialStock": 10
   }
   ```
5. **Klik "Send" (Request Pertama)**: Produk akan berhasil dibuat dan Anda menerima HTTP `201 Created`. Data direkam di tabel `IdempotencyKey`.
6. **Klik "Send" (Request Kedua)** dengan *header* dan *body* yang persis sama.
7. **Ekspektasi Output**:
   - Sistem **TIDAK** membuat produk duplikat di database.
   - Sistem akan secara langsung (sangat cepat) mengembalikan respons sukses yang direkam (di-cache) dari percobaan pertama.
   - Periksa console backend, Anda akan melihat log: `[Idempotency] Returning cached response for key: test-key-12345`

---

## 5. Pengujian Central API (Super Admin)

Central API telah direfaktor menjadi *Control Plane* khusus pemilik platform (Owner), tidak lagi mencampuradukkan urusan stok kasir penyewa.

### Cara Tes:
1. Login sebagai **Super Admin** dan dapatkan tokennya.
2. Akses `GET http://localhost:5000/api/v1/central/dashboard` menggunakan Token Super Admin.
3. **Ekspektasi Output**:
   Hanya memuat agregasi finansial (MRR) dan total penyewa (Tenants), bukan peringatan "*Low Stock*":
   ```json
   {
     "status": "success",
     "data": {
       "tenants": {
         "total": 1,
         "active": 1,
         "trial": 0,
         "suspended": 0,
         "newThisMonth": 1
       },
       "users": {
         "totalTenantUsers": 2,
         "totalSuperAdmins": 1
       },
       "financials": {
         "mrr": {
           "value": 149000,
           "currency": "IDR"
         }
       },
       "topTenants": [ ... ]
     }
   }
   ```
