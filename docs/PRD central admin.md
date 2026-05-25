Berikut adalah _Product Requirements Document_ (PRD) yang dirancang khusus untuk memandu Anda dalam fase pengembangan. Dokumen ini menstrukturkan semua fungsionalitas, spesifikasi teknis, dan tujuan bisnis dari sistem Central Admin SaaS POS Anda.

---

# PRODUCT REQUIREMENTS DOCUMENT (PRD)

**Sistem:** Central Admin – SaaS POS & Inventory System
**Penulis:** Muhamad Ikbal Handini
**Tanggal Dokumen:** Mei 2026
**Status:** _Draft_ / _In Review_

---

## 1. Ringkasan Eksekutif (Executive Summary)

Central Admin adalah modul kendali terpusat (_command center_) yang dirancang khusus untuk operator tunggal (_solo founder_). Modul ini berfungsi untuk memantau kesehatan infrastruktur _multi-tenant_, mengotomatiskan siklus penagihan, mengelola rilis versi aplikasi, dan menangani dukungan pelanggan secara efisien tanpa memerlukan intervensi database manual. Fokus utama pengembangan adalah fungsionalitas maksimal dengan antarmuka yang minimalis dan terisolasi dari _frontend tenant_.

## 2. Tujuan & Metrik Kesuksesan (Goals & Success Metrics)

- **Tujuan 1 (Efisiensi Waktu):** Mengurangi waktu penyelesaian _bug_ atau keluhan pelanggan melalui fitur _Impersonation_ dan integrasi konteks otomatis pada sistem tiket.
- **Tujuan 2 (Otomatisasi Finansial):** Memastikan 100% perpanjangan langganan _tenant_ berjalan otomatis melalui integrasi _webhook payment gateway_ (PayPal/Stripe).
- **Tujuan 3 (Stabilitas Infrastruktur):** Mencegah kelebihan beban server (_overload_) dengan memantau kapasitas penyimpanan secara _real-time_, khususnya akibat akumulasi data dari fitur _soft delete_.
- **Tujuan 4 (Transisi Versi):** Memastikan _tenant_ selalu menggunakan aplikasi versi terbaru melalui fitur _mandatory update_ dan _API version monitoring_.

## 3. Profil Pengguna (User Persona)

Sistem ini dirancang eksklusif untuk **1 (Satu) Pengguna Utama (Superadmin / System Owner)**. Tidak ada hierarki peran (RBAC) yang kompleks untuk meminimalkan kompleksitas skema _database_. Superadmin memiliki otoritas absolut atas seluruh data operasional, infrastruktur, dan _billing_.

## 4. Kebutuhan Fungsional (Functional Requirements)

### 4.1. Dashboard & Pemantauan (Monitoring)

| Fitur                | Deskripsi                                                                              | Kriteria Penerimaan (Acceptance Criteria)                                              |
| -------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Business Metrics** | Menampilkan ringkasan jumlah _tenant_ aktif dan estimasi MRR.                          | Angka MRR dikalkulasi secara _real-time_ berdasarkan langganan aktif bulan berjalan.   |
| **Storage Monitor**  | Memantau penggunaan kapasitas _database_, khususnya tabel transaksi dan _soft delete_. | Sistem memberikan peringatan visual jika ukuran tabel mendekati ambang batas maksimal. |
| **Error Radar**      | Menampilkan grafik lonjakan kode _error_ 500 dari API Express dalam 24 jam terakhir.   | Membaca log dari _global error handler_ secara langsung.                               |

### 4.2. Manajemen Tenant

| Fitur                      | Deskripsi                                                                   | Kriteria Penerimaan (Acceptance Criteria)                                                                                                     |
| -------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tenant List**            | Tabel berisi daftar seluruh pelanggan.                                      | Mendukung pencarian, _pagination_, dan pemfilteran status (Aktif/Suspend).                                                                    |
| **Tenant Control**         | Mengubah status akses _tenant_.                                             | Tombol _Suspend/Unsuspend_ akan secara otomatis menonaktifkan/mengaktifkan validitas JWT milik seluruh kasir/staf di bawah _tenant_ tersebut. |
| **Impersonate (Login As)** | Memasuki _dashboard tenant_ tanpa kata sandi untuk keperluan audit/bantuan. | Membangkitkan JWT khusus dengan akses _bypass_ penuh, membuka aplikasi _tenant_ di tab baru.                                                  |

### 4.3. Manajemen Tagihan (Billing & Subscriptions)

| Fitur                     | Deskripsi                                                     | Kriteria Penerimaan (Acceptance Criteria)                                                                                  |
| ------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Auto-Billing Webhooks** | Sistem penerima _payload_ transaksi dari penyedia pembayaran. | API secara otomatis menguraikan _payload_, memvalidasi pembayaran, dan memperbarui tanggal `validUntil` di tabel `Tenant`. |
| **Invoice Logs**          | Tabel riwayat pembayaran seluruh _tenant_.                    | Menampilkan ID Transaksi, Nominal, Metode, dan Status (Berhasil/Gagal).                                                    |

### 4.4. Dukungan Pelanggan (Ticketing System)

| Fitur                   | Deskripsi                                                              | Kriteria Penerimaan (Acceptance Criteria)                                                                             |
| ----------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Ticket Board**        | Papan kanban/tabel untuk melacak status keluhan pelanggan.             | Tiket dapat diubah statusnya menjadi OPEN, IN_PROGRESS, atau RESOLVED.                                                |
| **Auto-Context Attach** | Metadata sistem terlampir pada setiap tiket yang dibuat oleh _tenant_. | Tiket masuk wajib menyertakan: ID Tenant, Versi API, dan Versi Browser/Aplikasi secara otomatis dari sisi _frontend_. |

### 4.5. Versi & Rilis (Versioning & Patch Notes)

| Fitur                    | Deskripsi                                                     | Kriteria Penerimaan (Acceptance Criteria)                                                         |
| ------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **App Version Manager**  | Mencatat dan mengontrol versi _frontend_ klien.               | Mendukung penandaan _mandatory update_ untuk memaksa _refresh_ pada perangkat kasir/terminal POS. |
| **Patch Note Publisher** | Editor _rich-text_ untuk menulis pengumuman pembaruan sistem. | Saat dipublikasikan, pengumuman memicu pop-up otomatis di dalam _dashboard_ POS seluruh _tenant_. |

---

## 5. Kebutuhan Non-Fungsional (Non-Functional Requirements)

- **Keamanan Ekstraktif & Isolasi Data:**
- API Central Admin dan _frontend_ dikonfigurasi pada _sub-domain_ terpisah atau _routing_ yang terisolasi dari _tenant_ API.
- Wajib dilakukan validasi IDOR ketat pada _endpoint_ tenant.
- Disarankan melakukan simulasi injeksi _payload_ dan uji kerentanan akses antar-tenant secara lokal menggunakan _tools_ pengujian keamanan (seperti Burp Suite) sebelum perilisan.

- **Performa & Penanganan Kesalahan (Idempotency):**
- Seluruh API mutasi status yang berhubungan dengan perpanjangan langganan dan penagihan wajib menerapkan logika idempoten untuk mencegah eksekusi ganda jika _webhook_ menembak ulang akibat koneksi terputus.

- **Optimasi Infrastruktur:**
- Database tidak melakukan kalkulasi gabungan (_sum_) secara langsung pada tabel transaksi berukuran masif untuk _dashboard overview_, melainkan menggunakan metode _caching_ atau _materialized view_ yang diperbarui berkala.

## 6. Spesifikasi Teknis (Tech Stack & Architecture)

- **Frontend (UI Admin):** ReactJS (disarankan dipadukan dengan _library_ komponen minimalis).
- **Backend & API:** Node.js + Express.js (Menggunakan pola desain arsitektur modular/MVC).
- **Database & ORM:** PostgreSQL + Prisma ORM (Memanfaatkan kemampuan migrasi dan keamanan _query_).
- **Autentikasi:** JSON Web Token (JWT) terisolasi (Token Superadmin berbeda _secret key_ atau struktur dengan Token Klien).
- **Deployment:** Containerization menggunakan Docker, dijalankan di atas OS Linux Ubuntu.

## 7. Rencana Pengujian & Staging

Sebelum di-_deploy_ ke VPS produksi, seluruh ekosistem akan disimulasikan menggunakan infrastruktur virtualisasi lokal. Container _Database_, _Backend Express_, dan _Frontend_ akan diisolasi dan dijalankan dalam mesin virtual (contoh: lingkungan Proxmox) untuk mengukur tingkat konsumsi RAM/CPU serta menguji efisiensi mekanisme _table partitioning_ akibat akumulasi data _soft delete_.
