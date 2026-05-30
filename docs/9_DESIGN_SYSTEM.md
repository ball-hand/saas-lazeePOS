# LazeePOS Design System & Rules

Dokumen ini mendefinisikan aturan dan pedoman standar untuk penulisan *User Interface* (UI) di seluruh aplikasi LazeePOS. Tujuannya adalah untuk menjaga konsistensi visual yang kuat, memastikan *dark/light mode* berjalan sempurna, dan memudahkan pengembangan fitur baru.

## 1. Konsep Utama: CSS Variables (Bukan Tailwind Hardcode)

Aplikasi ini menggunakan pendekatan Multi-tenant dan mendukung pergantian mode secara dinamis (Gelap / Terang) dan pergantian warna aksen (*branding*). 

**Aturan Emas:** Jangan pernah menggunakan warna bawaan Tailwind secara langsung (`bg-white`, `bg-gray-100`, `text-black`, `border-gray-200`) untuk elemen struktural utama. Selalu gunakan *CSS Variables* dari `index.css`.

### Tabel Penggunaan Variabel

| Nama Variabel | Penggunaan yang Benar | Penggunaan yang Salah (Hindari) | Penjelasan |
| :--- | :--- | :--- | :--- |
| `var(--bg-main)` | `bg-[var(--bg-main)]` | `bg-gray-100`, `bg-black` | Background dasar halaman atau layer paling belakang. |
| `var(--bg-surface-elevated)`| `bg-[var(--bg-surface-elevated)]` | `bg-white`, `bg-gray-900` | Komponen di atas background (Kartu, Form, Modal, Navbar, Sidebar). |
| `var(--border)` | `border-[var(--border)]` | `border-gray-200`, `border-gray-800`| Semua garis pembatas, tepi kartu, dan input border. |
| `var(--text-primary)` | `text-[var(--text-primary)]` | `text-gray-900`, `text-white` | Teks utama, judul, dan data penting. |
| `var(--text-secondary)` | `text-[var(--text-secondary)]`| `text-gray-500`, `text-gray-400`| Deskripsi, subjudul, ikon pelengkap, placeholder teks. |
| `var(--accent-primary)` | `text-[var(--accent-primary)]`| `text-blue-500`, `bg-purple-500`| Warna *branding* toko (tombol utama, ikon aktif, ring input). |
| `var(--accent-gradient)` | `style={{ background: 'var(--accent-gradient)' }}` | `bg-gradient-to-r ...` | Latar tombol aksi utama yang menarik perhatian (seperti CTA). |

## 2. Struktur Komponen Standar

### A. Kartu / Panel (Card)
Gunakan kombinasi `bg-surface-elevated`, `border`, `rounded`, dan `shadow` yang lembut.

```tsx
// ✅ BENAR
<div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
  <h2 className="text-[var(--text-primary)] font-bold">Judul Kartu</h2>
</div>

// ❌ SALAH (Akan rusak di Dark Mode)
<div className="bg-white border border-gray-200 rounded-lg p-6 shadow">
  <h2 className="text-black font-bold">Judul Kartu</h2>
</div>
```

### B. Input dan Form
Input harus membaur dengan latar belakang, namun memiliki garis tepi yang menonjol saat di-*focus*.

```tsx
// ✅ BENAR
<input 
  type="text"
  className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none transition-colors"
  placeholder="Masukkan nama..."
/>
```

### C. Tombol (Buttons)
Bedakan hierarki tombol: *Primary* (Aksi utama) dan *Secondary* (Aksi pendukung).

```tsx
// Tombol Utama (Aksen)
<button className="px-5 py-2.5 rounded-xl font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5" style={{ background: 'var(--accent-gradient)' }}>
  Simpan Data
</button>

// Tombol Sekunder / Batal
<button className="px-5 py-2.5 rounded-xl font-bold bg-[var(--bg-main)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--border)] transition-colors">
  Batal
</button>

// Tombol Bahaya / Destruktif (Boleh menggunakan warna Tailwind khusus)
<button className="px-5 py-2.5 rounded-xl font-bold bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors">
  Hapus
</button>
```

## 3. Desain Responsif & Interaksi (Micro-interactions)

- **Transisi:** Gunakan `transition-all` atau `transition-colors` pada setiap tombol, tautan, dan area yang bisa diklik.
- **Efek Hover:** 
  - Tombol utama: Tambahkan sedikit pergerakan (contoh: `hover:-translate-y-1 hover:shadow-xl`).
  - Tombol sekunder: Ganti warna latar belakang secara halus.
- **Sudut Lengkung (Border Radius):** Untuk LazeePOS, kita menggunakan desain yang sangat bulat (modern). Hindari sudut tajam. Gunakan `rounded-xl`, `rounded-2xl`, atau `rounded-3xl` untuk kontainer besar.

## 4. Render HTML/Rich Text

Setiap kali menampilkan konten teks panjang yang berasal dari CMS atau WYSIWYG Editor (misalnya Tiptap/Markdown HTML), JANGAN pernah mencoba memberikan gaya manual pada setiap elemen.

Gunakan struktur kelas `.prose` yang telah didefinisikan:

```tsx
// ✅ BENAR (Warna teks, list, heading, dan gambar akan otomatis menyesuaikan tema)
<div 
  className="prose max-w-none" 
  dangerouslySetInnerHTML={{ __html: contentHTML }} 
/>
```

## 5. Pedoman Layout & Grid

### A. Responsivitas (Mobile-First)
Selalu asumsikan desain dibuat untuk layar kecil (*Mobile*) terlebih dahulu, lalu gunakan *prefix* Tailwind (`sm:`, `md:`, `lg:`) untuk layar yang lebih besar.

- **Padding Halaman:** Gunakan `p-4` atau `px-6` untuk versi *mobile*, dan `md:p-8` atau `lg:px-12` untuk layar *desktop*.
- **Grid System:** Gunakan `grid-cols-1` secara default, lalu ubah menjadi `md:grid-cols-2` atau `lg:grid-cols-3` pada layar besar untuk menghindari komponen berdesakan.

### B. Lebar Kontainer (Max-Width)
Batasi lebar maksimal konten agar tidak terlalu melebar pada layar Ultrawide.
- **Halaman Utama / Dashboard:** `max-w-7xl mx-auto`
- **Halaman Teks (Dokumentasi/Blog):** `max-w-4xl mx-auto`
- **Halaman Autentikasi (Login/Register):** `max-w-md mx-auto`

### C. Z-Index (Layering)
Untuk mencegah komponen *overlay* saling bertindih secara acak, ikuti hierarki `z-index` berikut:
- **Navbar / Header Utama:** `z-50`
- **Sidebar (Mobile Overlay):** `z-40`
- **Dropdown / Tooltip / Popover:** `z-30`
- **Konten Utama:** `z-10` atau default (`auto`).
- **Modal / Alert Dialog (Di tengah layar):** Harus menggunakan `z-50` atau berada di dalam *React Portal*.

Dengan mematuhi aturan di atas, aplikasi LazeePOS Anda akan terasa seperti produk Enterprise kelas atas yang kohesif, solid, dan indah di perangkat mana pun.
