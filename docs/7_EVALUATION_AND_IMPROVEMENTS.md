# Evaluasi & Saran Peningkatan — LazeePOS

Dokumen ini berisi catatan kritis dan saran spesifik yang perlu diperhatikan
sebelum LazeePOS dianggap siap untuk pengguna nyata (*production-ready*).

Dibagi berdasarkan tingkat risiko: 🔴 Kritis → 🟠 Penting → 🟡 Perlu Diperhatikan → 🔵 Peningkatan.

---

## 🔴 KRITIS — Perbaiki Sebelum Go-Live

### 1. Tidak Ada Mekanisme Reset Password
**Masalah:** Saat ini jika pengguna lupa password, solusinya adalah "hubungi admin". Ini tidak
dapat diterima untuk produk SaaS yang dijual.

**Risiko:** Pengguna akan frustrasi dan meninggalkan platform.

**Solusi:**
1. Tambahkan endpoint `POST /api/v1/auth/forgot-password` yang mengirim email berisi link reset.
2. Gunakan token sementara (expire 1 jam) disimpan di Redis.
3. Tambahkan endpoint `POST /api/v1/auth/reset-password` untuk memproses token + password baru.
4. Butuh layanan email: **Nodemailer + Gmail/SMTP**, atau **Resend.com** (gratis 3.000 email/bulan).

---

### 2. File Upload Hilang Saat Container Restart
**Masalah:** Gambar produk dan logo toko disimpan di `backend/public/uploads/`. Folder ini
ada di dalam container. Jika container di-restart atau di-rebuild, **semua file hilang**.

**Bukti:** Di `docker-compose.yml`, tidak ada volume mount untuk `public/uploads`.

**Risiko:** Semua foto produk dan logo toko hilang setiap kali deploy ulang.

**Solusi:**
- **Jangka pendek:** Tambahkan volume mount di `docker-compose.yml`:
  ```yaml
  volumes:
    - ./backend/public/uploads:/app/public/uploads
  ```
- **Jangka panjang:** Migrasi ke object storage (AWS S3, Cloudflare R2, atau Backblaze B2).
  R2 dari Cloudflare gratis hingga 10GB/bulan dan tanpa biaya egress.

---

### 3. Tidak Ada Strategi Backup Database
**Masalah:** Tidak ada dokumentasi atau script untuk backup database MySQL.

**Risiko:** Jika server crash, **semua data tenant hilang permanen**.

**Solusi minimum:**
```bash
# Script backup harian — tambahkan ke crontab di server
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec pos-mysql-1 mysqldump -u root pos_db > /backup/lazeepos_$DATE.sql
# Kirim ke cloud storage (S3, Google Drive via rclone, dll.)
```

Jalankan otomatis setiap hari jam 02:00 pagi via `crontab -e`.

---

### 4. `prisma db push` Berbahaya di Production
**Masalah:** `db push` langsung mengubah schema database tanpa file migrasi. Jika ada
perubahan yang **tidak kompatibel** (misal: rename kolom), data bisa hilang tanpa peringatan.

**Risiko:** Data tenant terhapus saat update version.

**Solusi:** Gunakan `prisma migrate` mulai sekarang:
```bash
# Saat development: buat migration file
npx prisma migrate dev --name nama_perubahan

# Saat production deploy: jalankan migration yang sudah ada
npx prisma migrate deploy
```

Tambahkan ke startup script Docker:
```dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
```

---

### 5. JWT Tersimpan di localStorage (Rentan XSS)
**Masalah:** Jika ada celah XSS di frontend, token JWT bisa dicuri dari localStorage.

**Risiko:** Session hijacking — penyerang bisa login sebagai tenant manapun.

**Solusi:** Pindahkan JWT ke **HttpOnly Cookie**:
- Backend: set `res.cookie('token', jwt, { httpOnly: true, secure: true, sameSite: 'strict' })`
- Frontend: Axios otomatis mengirim cookie, tidak perlu header manual
- Ini juga lebih aman karena JavaScript tidak bisa membaca HttpOnly cookie

---

## 🟠 PENTING — Selesaikan dalam 1 Bulan Pertama

### 6. Tidak Ada Email Verifikasi saat Registrasi
Tenant bisa daftar dengan email palsu. Ini berarti:
- Tidak bisa reset password (karena email tidak diverifikasi)
- Tidak bisa mengirim notifikasi billing
- Sulit melacak pengguna sungguhan vs bot

**Solusi:** Kirim email konfirmasi setelah registrasi. Tenant tidak bisa login sampai email dikonfirmasi.

---

### 7. Tidak Ada Penanganan Kegagalan Pembayaran (Dunning)
**Masalah:** Jika subscription tenant expire (karena kartu ditolak, transfer tidak masuk, dll.),
sistem tidak otomatis mengirim reminder atau menangguhkan akses.

**Risiko:** Tenant terus pakai layanan tanpa bayar.

**Solusi:**
1. Tambahkan cron job harian yang memeriksa subscription yang sudah expire.
2. Kirim email reminder H-7, H-3, H-0 sebelum expire.
3. Setelah H+3 tanpa pembayaran, ubah status tenant ke `SUSPENDED`.
4. Midtrans memiliki fitur webhook untuk notifikasi pembayaran — pastikan webhook sudah di-setup.

---

### 8. Tidak Ada Monitoring & Alerting
**Masalah:** Jika server down jam 2 pagi, tidak ada yang tahu sampai ada tenant yang mengeluh.

**Solusi minimum (gratis):**
- **Uptime Robot** (free) — monitor URL setiap 5 menit, kirim email/SMS jika down
- **Docker healthcheck** sudah ada untuk MySQL, tambahkan juga untuk backend:
  ```yaml
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:5000/api/v1/health"]
    interval: 30s
    timeout: 10s
    retries: 3
  ```
- Tambahkan endpoint `/api/v1/health` di backend yang return status 200 + info koneksi DB/Redis.

---

### 9. Trial Expiry Tidak Divalidasi
**Masalah:** Tenant dengan status `TRIAL` tidak ada pemeriksaan apakah masa trial-nya sudah habis.

**Solusi:** Tambahkan di middleware `tenantResolver.js`:
```js
if (tenant.status === 'TRIAL' && tenant.trialEndsAt < new Date()) {
  tenant.status = 'SUSPENDED';
  await prisma.tenant.update({ where: { id: tenant.id }, data: { status: 'SUSPENDED' } });
}
```

---

### 10. Tidak Ada Rate Limiting pada Endpoint Sensitif
**Masalah:** Endpoint login tidak terbatas percobaan. Penyerang bisa coba ribuan password (brute force).

**Solusi:** Tambahkan rate limit spesifik untuk auth:
```js
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 10,                    // maksimal 10 percobaan
  message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.'
});

router.post('/login', loginLimiter, authController.login);
```

---

## 🟡 PERLU DIPERHATIKAN — Selesaikan Sebelum Scale Up

### 11. Tidak Ada Git Branching Strategy
Saat ini semua commit kemungkinan langsung ke `main`. Ini berbahaya saat ada lebih dari 1 developer.

**Strategi yang disarankan (GitHub Flow — sederhana):**
```
main          ← Production. Tidak boleh commit langsung.
  └── feature/nama-fitur    ← Branch untuk setiap fitur
  └── fix/nama-bug          ← Branch untuk perbaikan bug
  └── hotfix/nama-masalah   ← Perbaikan darurat ke production
```

Buat rule di GitHub: **protect branch `main`**, wajib Pull Request sebelum merge.

---

### 12. Log Aplikasi Tidak Tersimpan
**Masalah:** Log dari `console.log` dan `morgan` di backend hanya tampil di terminal Docker.
Saat container restart, **semua log hilang**.

**Solusi minimum:** Mount volume untuk log:
```yaml
volumes:
  - ./backend/logs:/app/logs
```

Dan gunakan `winston` untuk menulis log ke file:
```js
import winston from 'winston';
const logger = winston.createLogger({
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ]
});
```

---

### 13. Tidak Ada Validasi Tipe File Upload
**Masalah:** Multer mungkin menerima file selain gambar (misal: `.php`, `.exe`, `.js`).

**Risiko:** Remote code execution jika server salah konfigurasi.

**Solusi:** Tambahkan fileFilter di konfigurasi Multer:
```js
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file JPG, PNG, WebP yang diizinkan'), false);
  }
};
```

---

### 14. Single Point of Failure: Redis
Redis digunakan untuk cache, rate limit, dan session. Jika Redis mati:
- Rate limiting tidak berfungsi
- Idempotency key tidak tersimpan → double submit bisa terjadi

**Solusi:** Tambahkan fallback graceful — jika Redis tidak tersedia, aplikasi tetap berjalan
dengan degraded mode (tanpa cache, rate limit dari memory):
```js
redis.on('error', (err) => {
  console.error('Redis error, running in degraded mode:', err);
});
```

---

### 15. Tidak Ada Dokumentasi API (Swagger/OpenAPI)
Jika suatu hari ada developer lain atau integrasi pihak ketiga, mereka tidak punya referensi API.

**Solusi:** Tambahkan Swagger ke backend:
```bash
npm install swagger-ui-express swagger-jsdoc
```

Akses dokumentasi di: `http://localhost:5000/api/docs`

---

## 🔵 PENINGKATAN — Untuk Kualitas Jangka Panjang

### 16. Tidak Ada Soft Delete
Saat produk atau transaksi dihapus, data hilang permanen dari database.
Ini berarti riwayat kasir yang mengacu produk yang dihapus bisa jadi rusak.

**Solusi:** Tambahkan kolom `deletedAt DateTime?` ke model kritis (Product, User).
Hapus bukan DELETE dari database, tapi isi `deletedAt = now()`.
Query selalu filter `WHERE deletedAt IS NULL`.

---

### 17. Tidak Ada Pagination yang Konsisten
Beberapa endpoint mungkin return semua data tanpa paginasi. Jika tenant punya 10.000 produk,
satu request bisa membebani server.

**Pastikan semua endpoint list menggunakan:**
```js
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 20;
const skip = (page - 1) * limit;

const [data, total] = await Promise.all([
  prisma.product.findMany({ skip, take: limit, where: { tenantId } }),
  prisma.product.count({ where: { tenantId } })
]);

res.json({ data, total, page, totalPages: Math.ceil(total / limit) });
```

---

### 18. Tidak Ada Strategi Penghapusan Data Tenant (GDPR-like)
Jika tenant meminta hapus akun dan semua datanya (hak yang wajar), tidak ada proses untuk itu.

**Minimal:** Dokumentasikan prosesnya dan buat script manual untuk menghapus semua data
yang terkait dengan `tenantId` tertentu secara cascade.

---

### 19. Performa: N+1 Query Problem
Pastikan query yang melibatkan relasi menggunakan `include` Prisma dengan benar.
Tanpa `include`, kode seperti ini akan buat query terpisah untuk setiap item:
```js
// ❌ Buruk — N+1 queries
const transactions = await prisma.transaction.findMany();
for (const tx of transactions) {
  const items = await prisma.transactionItem.findMany({ where: { transactionId: tx.id } });
}

// ✅ Baik — 1 query dengan JOIN
const transactions = await prisma.transaction.findMany({
  include: { items: true }
});
```

---

### 20. Tidak Ada Environment Staging
Saat ini hanya ada dev (lokal) dan production. Tidak ada staging environment.

**Risiko:** Testing fitur baru langsung di production = risiko tinggi.

**Solusi:** Buat satu VPS kecil (DigitalOcean $6/bulan) sebagai staging.
Gunakan `docker-compose.prod.yml` dengan database dan URL berbeda.
Semua fitur baru wajib lulus di staging sebelum ke production.

---

## Prioritas Pengerjaan yang Disarankan

| Minggu | Yang Harus Dikerjakan |
|---|---|
| **Minggu 1** | Fix volume upload (#2), setup backup (#3), ganti `db push` ke migrate (#4) |
| **Minggu 2** | Reset password (#1), rate limit login (#10), health endpoint (#8) |
| **Minggu 3** | Email verifikasi (#6), trial expiry (#9), file upload validation (#13) |
| **Minggu 4** | Git branching strategy (#11), logging ke file (#12), dunning reminders (#7) |
| **Bulan 2** | JWT ke HttpOnly cookie (#5), Swagger API docs (#15), staging environment (#20) |
| **Bulan 3** | Soft delete (#16), pagination audit (#17), Redis fallback (#14) |

---

## Pertanyaan yang Perlu Dijawab Sebelum Launch

1. **Siapa yang mengelola server production?** Apakah ada SLA uptime yang dijanjikan ke tenant?
2. **Bagaimana jika ada data breach?** Apakah ada rencana notifikasi ke pengguna?
3. **Apakah Midtrans sudah dalam mode Production** (bukan Sandbox)? Key production berbeda.
4. **Siapa yang punya akses ke database production?** Akses ini harus dibatasi ketat.
5. **Berapa lama data tenant disimpan setelah mereka berhenti berlangganan?**
6. **Apakah Anda siap menangani keluhan tentang kehilangan data?** Karena belum ada backup otomatis.

---

> Tidak ada yang perlu malu dengan daftar ini. Semua SaaS yang sukses pernah melewati
> fase ini. Yang membedakan adalah: apakah masalahnya ditemukan sebelum atau sesudah
> pengguna nyata merasakan dampaknya.
