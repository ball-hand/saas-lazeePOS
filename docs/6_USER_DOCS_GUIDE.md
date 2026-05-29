# Panduan Menulis Dokumentasi Pengguna (User Documentation Guide)

> Dokumen ini adalah **panduan internal** bagi tim Lazee Teknologi untuk membuat dokumentasi
> yang mudah dipahami oleh pengguna awam — pemilik toko, kasir, atau siapa pun yang
> menggunakan LazeePOS tanpa latar belakang teknis.

---

## Mengapa Dokumentasi Pengguna Penting?

Dokumentasi yang baik = dukungan yang lebih sedikit.

Ketika pengguna bisa menemukan jawaban sendiri, mereka tidak perlu menghubungi support.
Ini menghemat waktu Anda dan membuat pengguna lebih percaya diri menggunakan produk.

> 💡 **Prinsip utama:** Tulis untuk *seseorang yang baru pertama kali melihat komputer*.

---

## BAGIAN 1 — Struktur Dokumen yang Baik

### Hierarki yang Direkomendasikan

```
📁 Dokumentasi LazeePOS/
│
├── 🚀 Mulai Cepat (Getting Started)
│     └── Cara daftar, login pertama kali, setup awal
│
├── 📖 Panduan Penggunaan (How-To Guides)
│     ├── Cara menggunakan Kasir (POS)
│     ├── Cara menambah produk
│     ├── Cara mengelola stok
│     └── ... (satu panduan per tugas spesifik)
│
├── 🎯 Referensi Fitur (Feature Reference)
│     └── Penjelasan setiap halaman dan tombol
│
└── ❓ FAQ (Pertanyaan yang Sering Ditanyakan)
      └── Masalah umum + solusinya
```

### Aturan 1 Dokumen = 1 Tujuan
Setiap file dokumen harus menjawab **satu pertanyaan spesifik**:
- ✅ Bagaimana cara menambah produk baru?
- ✅ Bagaimana cara mencetak struk?
- ❌ Panduan produk, stok, dan diskon (terlalu banyak dalam 1 file)

---

## BAGIAN 2 — Cara Menulis yang Mudah Dipahami

### Aturan Bahasa

| ❌ Hindari | ✅ Gunakan |
|---|---|
| "Navigasi ke modul inventaris" | "Buka menu **Produk**" |
| "Klik tombol submit" | "Klik **Simpan**" |
| "Field ini bersifat mandatory" | "Kolom ini **wajib** diisi" |
| "Sistem akan melakukan validasi" | "Aplikasi akan memeriksa data Anda" |
| "Terjadi error 404" | "Halaman tidak ditemukan. Coba refresh." |
| "Database akan terupdate" | "Data akan tersimpan otomatis" |

### Formula Penulisan Langkah

Selalu gunakan format:
```
[Nomor]. [Kata Kerja] [Objek] [Keterangan (opsional)]
```

**Contoh:**
```
1. Buka menu Produk di sidebar kiri.
2. Klik tombol "+ Tambah Produk" di pojok kanan atas.
3. Isi Nama Produk (wajib) dan Harga Jual.
4. Klik Simpan.
```

**Jangan seperti ini:**
```
Pengguna perlu mengakses halaman produk melalui navigasi samping, kemudian
melakukan penambahan produk dengan mengklik tombol yang disediakan, mengisi
form yang muncul dan menyimpan datanya.
```

### Tanda Visual yang Berguna
- **Tebalkan** nama tombol, menu, dan field: klik **Simpan**, buka menu **Produk**
- Gunakan `monospace` untuk kode atau URL: buka `http://lazeepos.com`
- Gunakan ⚠️ untuk peringatan penting
- Gunakan 💡 untuk tips berguna
- Gunakan ✅ untuk konfirmasi keberhasilan

---

## BAGIAN 3 — Template Siap Pakai

### Template 1: Panduan "Cara Melakukan X"

```markdown
# Cara [Nama Tugas]

**Waktu yang dibutuhkan:** sekitar [X] menit
**Siapa yang bisa melakukan ini:** [Pemilik Toko / Kasir / Semua]

---

## Sebelum Mulai
- [Prasyarat 1, jika ada]
- [Prasyarat 2, jika ada]

## Langkah-Langkah

**Langkah 1: [Judul Langkah]**
[Penjelasan singkat apa yang harus dilakukan]

1. Buka menu **[Nama Menu]** di sidebar.
2. Klik tombol **[Nama Tombol]**.
3. Isi kolom **[Nama Kolom]** dengan [penjelasan isi].
4. Klik **Simpan**.

✅ Selesai! [Penjelasan hasil yang terlihat setelah berhasil]

---

## Jika Ada Masalah
- **Tombol tidak bisa diklik?** → [Solusi]
- **Muncul pesan error?** → [Solusi]
- **Data tidak tersimpan?** → [Solusi]

---

💡 **Tips:** [Satu tips berguna yang berhubungan dengan topik ini]
```

---

### Template 2: FAQ

```markdown
# Pertanyaan yang Sering Ditanyakan (FAQ)

## Tentang Akun & Login

**Q: Saya lupa password, bagaimana cara reset?**
Saat ini, hubungi admin toko atau tim support kami di support@lazeepos.com.
Tim kami akan membantu reset password dalam 1x24 jam.

**Q: Bisakah 2 kasir login di perangkat yang berbeda secara bersamaan?**
Ya, bisa. Setiap kasir punya akun masing-masing dan bisa login dari perangkat berbeda.

---

## Tentang Produk

**Q: Berapa batas maksimal produk yang bisa ditambahkan?**
Tergantung paket yang Anda gunakan:
- Paket **Gratis**: maksimal 100 produk
- Paket **Starter**: maksimal 500 produk
- Paket **Pro**: maksimal 2.000 produk
- Paket **Enterprise**: tidak terbatas
```

---

### Template 3: Referensi Halaman (Page Reference)

```markdown
# Halaman [Nama Halaman] — Panduan Lengkap

## Apa fungsi halaman ini?
[Penjelasan 2-3 kalimat tentang tujuan halaman ini]

## Elemen-elemen di Halaman Ini

### [Nama Bagian/Panel]
[Penjelasan fungsi bagian ini]

| Tombol/Kolom | Fungsi |
|---|---|
| **+ Tambah** | Membuka form untuk menambah data baru |
| **Edit (ikon pensil)** | Mengubah data yang sudah ada |
| **Hapus (ikon tempat sampah)** | Menghapus data (tidak bisa dibatalkan!) |
| **Cari** | Mencari berdasarkan nama |

## Panduan Cepat
- Untuk menambah → klik **[Tombol]**
- Untuk mengedit → klik ikon **[ikon]** di baris yang ingin diubah
- Untuk menghapus → klik ikon **[ikon]**, lalu konfirmasi
```

---

## BAGIAN 4 — Panduan Screenshot & Visual

### Kapan Perlu Screenshot?
Tambahkan gambar/screenshot saat:
1. Pertama kali memperkenalkan halaman yang baru
2. Menunjukkan lokasi tombol yang tidak jelas
3. Menampilkan contoh form yang sudah diisi
4. Menunjukkan hasil yang diharapkan setelah suatu aksi

### Tips Membuat Screenshot yang Baik
- Gunakan **resolusi 1280x720** atau lebih
- Crop agar fokus pada area yang dibahas, bukan layar penuh
- Gunakan **anotasi (panah/kotak merah)** untuk menunjuk elemen spesifik
- Simpan sebagai PNG (kualitas lebih baik dari JPG untuk screenshot UI)
- Beri nama file yang deskriptif: `tambah-produk-form.png`, bukan `screenshot1.png`

### Cara Menyisipkan Gambar di Markdown

```markdown
![Deskripsi gambar](./images/nama-file.png)
```

Contoh:
```markdown
![Form tambah produk baru](./images/tambah-produk-form.png)
```

---

## BAGIAN 5 — Checklist Sebelum Publikasi

Sebelum menerbitkan dokumen baru, pastikan:

### Konten
- [ ] Judul menjelaskan isi dengan jelas
- [ ] Setiap langkah bisa diikuti tanpa penjelasan tambahan
- [ ] Tidak ada istilah teknis yang tidak dijelaskan
- [ ] Ada contoh nyata (misal: nama produk, angka harga)
- [ ] Dicantumkan siapa pengguna yang dituju (pemilik/kasir/semua)

### Bahasa
- [ ] Kalimat pendek (maksimal 20 kata per kalimat)
- [ ] Menggunakan kata aktif ("klik", "isi", "pilih") bukan pasif
- [ ] Nama tombol dan menu **ditebalkan**
- [ ] Tidak ada typo atau salah ejaan

### Visual
- [ ] Screenshot terkini (sesuai tampilan terbaru aplikasi)
- [ ] Anotasi jelas menunjuk ke elemen yang dimaksud
- [ ] Gambar bisa dimuat (tidak broken link)

### Struktur
- [ ] Ada penjelasan singkat di awal (untuk apa dokumen ini)
- [ ] Langkah-langkah bernomor
- [ ] Ada bagian "Jika Ada Masalah" atau link ke FAQ
- [ ] Dokumen bisa dibaca selesai dalam < 5 menit

---

## BAGIAN 6 — Contoh Dokumen Jadi

Ini adalah contoh dokumentasi pengguna yang baik untuk fitur POS:

---

### Contoh: "Cara Melakukan Transaksi Penjualan"

> **Waktu:** ~2 menit | **Untuk:** Kasir dan Pemilik Toko

**Langkah 1: Buka Terminal Kasir**

Klik menu **Kasir (POS)** di sidebar kiri. Anda akan melihat daftar produk di bagian kiri dan keranjang belanja di sebelah kanan.

**Langkah 2: Tambahkan Produk ke Keranjang**

Klik pada produk yang ingin dibeli pelanggan. Produk akan langsung muncul di keranjang kanan.

💡 *Tips: Anda juga bisa mengetik nama atau SKU produk di kotak pencarian di atas.*

**Langkah 3: Atur Jumlah (Jika Perlu)**

Klik tanda **+** atau **−** di sebelah produk di keranjang untuk menambah atau mengurangi jumlah.

**Langkah 4: Bayar**

1. Klik tombol **Bayar** (tombol hijau besar di bawah keranjang).
2. Pilih metode bayar: **Tunai**, **QRIS**, atau **Kartu**.
3. Untuk tunai, masukkan nominal yang diberikan pelanggan.
4. Klik **Konfirmasi Pembayaran**.

✅ Transaksi selesai! Struk akan muncul di layar. Klik **Cetak Struk** untuk mencetaknya.

**Ada Masalah?**
- *Tombol Bayar tidak aktif?* → Pastikan keranjang tidak kosong
- *Produk tidak muncul?* → Pastikan produk sudah diaktifkan di menu Produk
- *Stok habis?* → Hubungi pemilik toko untuk restock

---

## BAGIAN 7 — Alat Bantu yang Direkomendasikan

| Kebutuhan | Alat |
|---|---|
| Menulis dokumentasi | Markdown (file .md) |
| Screenshot & anotasi | [Greenshot](https://getgreenshot.org/) (gratis) / Snagit |
| Membuat diagram alur | [draw.io](https://draw.io/) (gratis) / Mermaid |
| Hosting dokumentasi | Notion, GitBook, atau halaman Docs di platform sendiri |
| Pengecekan ejaan bahasa Indonesia | [EYD Online](https://ejaan.kemdikbud.go.id/) |
| Menyederhanakan bahasa | Coba baca ulang dengan suara keras — jika kaku, tulis ulang |

---

## Penutup: Satu Aturan Emas

> **Jika Nenek Anda tidak bisa mengikuti instruksi ini, tulis ulang.**

Dokumentasi yang baik tidak butuh kecerdasan teknis untuk dipahami. Yang dibutuhkan adalah:
- Bahasa yang sederhana dan langsung
- Langkah yang jelas dan berurutan
- Gambar yang menunjukkan apa yang dimaksud
- Rasa empati kepada pengguna yang belum pernah melihat sistem ini sebelumnya
