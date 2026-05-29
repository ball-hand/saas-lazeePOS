# Panduan Pengujian (Testing Guide) — LazeePOS

> **⚠️ PROPRIETARY SOFTWARE** — Milik eksklusif **Lazee Teknologi**. Lihat [LICENSE](../LICENSE).

---

## Stack Testing

| Layer | Framework | Library Pendukung |
|---|---|---|
| **Backend** | Jest | Supertest, jest-mock-extended |
| **Frontend** | Vitest | @testing-library/react, @testing-library/jest-dom |

---

## 1. Backend Testing (Jest)

### Setup
```bash
cd backend
npm run test              # Jalankan semua test
npm run test -- --watch   # Watch mode (re-run saat file berubah)
```

### Konfigurasi
File: `backend/jest.config.js`

```js
// Backend menggunakan ES Modules (type: "module")
// Test dijalankan dengan: NODE_OPTIONS=--experimental-vm-modules
```

### Struktur File Test
```
backend/
└── tests/
    ├── auth.middleware.test.js    # Test middleware autentikasi JWT
    ├── receipts.test.js           # Test rute checkout & receipt
    └── ...
```

### Menulis Test Backend
```js
import request from 'supertest';
import { jest } from '@jest/globals';

// Mock Prisma agar tidak menyentuh database sungguhan
jest.mock('../prisma/client.js');

describe('POST /api/v1/auth/login', () => {
  it('should return 400 if email is empty', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({});
    expect(res.statusCode).toBe(400);
  });

  it('should return JWT token on valid credentials', async () => {
    // ...
    expect(res.body.data.token).toBeDefined();
  });
});
```

---

## 2. Frontend Testing (Vitest)

### Setup
```bash
cd frontend
npm run test              # Jalankan semua test (sekali)
npm run test -- --watch   # Watch mode
```

### Konfigurasi
File: `frontend/vite.config.ts` — bagian `test`:
```ts
test: {
  environment: 'jsdom',      // Simulasi browser DOM
  globals: true,             // Vitest globals (describe, it, expect)
  setupFiles: './src/setupTests.ts',
}
```

File: `frontend/src/setupTests.ts`:
```ts
import '@testing-library/jest-dom/vitest';  // toBeInTheDocument(), dll.
```

### Struktur File Test
```
frontend/src/
├── components/
│   ├── StatsCard.tsx
│   └── StatsCard.test.tsx    ← Test bersebelahan dengan komponen
├── pages/
│   └── ...
└── utils/
    └── formatters.test.ts
```

### Menulis Test Frontend
```tsx
import { render, screen } from '@testing-library/react';
import { StatsCard } from './StatsCard';

describe('StatsCard Component', () => {
  it('should render title and value correctly', () => {
    render(
      <StatsCard
        title="Total Pendapatan"
        value="Rp 50.000"
        icon={<span data-testid="icon">💰</span>}
      />
    );

    expect(screen.getByText('Total Pendapatan')).toBeInTheDocument();
    expect(screen.getByText('Rp 50.000')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });
});
```

---

## 3. Best Practices

### Prinsip Utama
1. **Isolated Tests** — Setiap unit test harus independen. Gunakan mock untuk API, database, dan fungsi eksternal.
2. **Arrange-Act-Assert (AAA)** — Susun test dalam 3 blok jelas: persiapkan data, jalankan aksi, cek hasilnya.
3. **User-Centric (Frontend)** — Gunakan `screen.getByRole` / `screen.getByText` bukan CSS class selector.
4. **Naming Convention** — Format: `[nama-file].test.ts` / `.test.tsx`.
5. **Test Edge Cases** — Selalu uji: input kosong, nilai invalid, state error, batas maksimum.

### Contoh Deskripsi Test yang Baik
```js
describe('Checkout API', () => {
  it('should return 400 when cart is empty')
  it('should return 400 when paid amount is less than total')
  it('should deduct warehouse stock after successful checkout')
  it('should prevent double-submit with same Idempotency-Key')
})
```

---

## 4. Cakupan Test Saat Ini

### Backend API Tests (Jest) — 100% PASS ✅

| Modul | Status | Skenario yang Diuji |
|---|---|---|
| **Authentication** | ✅ PASS | Login valid, salah password, email kosong, JWT verification, reservasi subdomain |
| **Idempotency Middleware** | ✅ PASS | Double-submit checkout, Idempotency-Key validation |
| **Dashboard** | ✅ PASS | Kalkulasi omzet hari ini, stok habis, arus kas terakhir |
| **Products** | ✅ PASS | List produk, PIN/UNPIN, ordering pinned items |
| **Warehouse** | ✅ PASS | Stock level, reorder alert, stock adjustment |
| **Discounts** | ✅ PASS | Diskon fixed & persentase, kondisi minimum qty |
| **Checkout & Receipts** | ✅ PASS | Keranjang kosong, kurang bayar, kalkulasi kembalian, cetak struk |
| **Transactions** | ✅ PASS | Riwayat per tanggal, search by kasir |
| **Cashflow** | ✅ PASS | Cash in/out, auto-record saat transaksi |
| **Settings** | ✅ PASS | Update branding tenant, manajemen staf |

### Frontend UI Tests (Vitest) — 100% PASS ✅

| Komponen | Status | Skenario yang Diuji |
|---|---|---|
| **StatsCard** | ✅ PASS | Render judul, nilai, ikon dengan props yang benar |
| **Terminal POS** | ✅ PASS | Klik produk → masuk keranjang, subtotal bertambah |
| **Dashboard UI** | ✅ PASS | Render grafik (mock), format Rupiah tepat |
| **Products Table** | ✅ PASS | Render tabel dengan Axios API mock |

---

## 5. Menjalankan Type Check

```bash
# Pastikan tidak ada TypeScript error sebelum commit
cd frontend && npx tsc --noEmit
```

---

## 6. CI/CD (Rencana)

Untuk deployment otomatis, tambahkan GitHub Actions workflow:

```yaml
# .github/workflows/test.yml
name: Run Tests

on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd backend && npm ci && npm run test

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd frontend && npm ci && npm run test && npx tsc --noEmit
```
