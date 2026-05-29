# Roadmap & Fitur Selanjutnya — LazeePOS

> Dokumen ini berisi daftar fitur dan peningkatan yang direncanakan untuk versi berikutnya.

---

## 🟢 Priority Tinggi (Next Sprint)

### Infrastruktur
- [ ] **GitHub Actions CI/CD** — Auto test + build + deploy ke VPS saat push ke `main`
- [ ] **HTTPS dengan Certbot** — Aktifkan SSL di `production.conf` setelah domain siap
- [ ] **Migrasi File Upload ke Cloud** — Pindah dari `public/uploads` lokal ke AWS S3 / Cloudinary agar aman saat scale horizontal

### Fitur POS
- [ ] **Offline Mode (PWA)** — Cache keranjang belanja di IndexedDB saat koneksi terputus, sync saat online kembali
- [ ] **Printer Bluetooth** — Support thermal printer via Bluetooth (mobile POS)
- [ ] **Kitchen Order Auto-Print** — Cetak otomatis ke printer dapur saat pesanan masuk

### Analytics
- [ ] **Laporan Export (Excel/PDF)** — Export laporan penjualan, stok, dan arus kas
- [ ] **Grafik Revenue Tenant** — Chart lebih detail: per produk, per kasir, per jam

---

## 🟡 Priority Sedang (Q3 2025)

### Multi-tenant Enhancement
- [ ] **Custom Domain** — Tenant bisa pakai domain sendiri (`kasir.tokobudi.com`) via DNS CNAME
- [ ] **Multi-Branch Support** — Satu tenant bisa kelola beberapa cabang/outlet
- [ ] **Tenant Import Data** — Import produk massal via CSV/Excel

### Pembayaran
- [ ] **Xendit Integration** — Alternatif payment gateway selain Midtrans
- [ ] **Kartu Kredit/Debit POS** — Integrasi EDC machine
- [ ] **Split Bill Lebih Lanjut** — Split bill per item / per orang

### CMS & Branding
- [ ] **Template Landing Page** — Pilihan template visual landing page toko
- [ ] **Dark Mode CMS Editor** — Rich Text Editor mendukung tema gelap
- [ ] **Export/Import CMS Config** — Backup konfigurasi CMS ke JSON

---

## 🔵 Priority Rendah / Nice-to-have (Q4 2025)

### Fitur Lanjutan
- [ ] **Program Loyalitas (Poin)** — Sistem poin pelanggan, penukaran reward
- [ ] **Reservasi Meja Online** — Pelanggan booking meja via link/QR
- [ ] **Notifikasi Push (Firebase)** — Push notification ke ponsel owner saat stok habis atau pesanan baru
- [ ] **Staff Scheduling** — Jadwal shift karyawan terpadu
- [ ] **Supplier Management** — Pencatatan pemasok dan purchase order

### Integrasi Eksternal
- [ ] **WhatsApp Notification** — Kirim struk ke WhatsApp pelanggan via Fonnte/WaAPI
- [ ] **Google Analytics** — Tracking pengunjung landing page tenant
- [ ] **Accounting Export** — Export ke format Jurnal.id / Accurate

### Developer Tools
- [ ] **API Public Docs (Swagger)** — Dokumentasi API interaktif untuk integrasi pihak ketiga
- [ ] **Webhook System** — Kirim event ke URL eksternal saat transaksi selesai
- [ ] **Multi-Language (i18n)** — Dukungan bahasa Inggris untuk ekspansi

---

## ✅ Selesai (Changelog)

### v1.0.0 — MVP Launch
- Multi-tenant SaaS dengan isolasi subdomain
- Terminal POS dengan checkout, diskon, struk thermal
- Manajemen produk & gudang (stok real-time)
- Buku kas otomatis
- Central Admin dashboard
- Billing SaaS dengan Midtrans
- Support Ticketing

### v1.1.0
- Kitchen Display System (KDS) — Antrean Dapur
- Manajemen Meja + QR Code per meja
- Menu Digital Pelanggan (scan QR → pesan)
- Release Management & Notifikasi Versi

### v1.2.0
- Docker Compose (Dev + Production)
- CMS Landing Page terpusat (editable tanpa kode)
- Halaman Dokumentasi publik (`/docs`) dengan Rich Text Editor
- Landing Page per tenant yang bisa dikustomisasi

---

> 💡 Punya ide fitur? Buka tiket di [support@lazeepos.com](mailto:support@lazeepos.com)
