import { ArrowRight, Play, Settings, Store, Plus, Search, Trash2, Check, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function TempDesignApps() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] font-sans p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-16">
        
        <div className="border-b border-[var(--border)] pb-8">
          <h1 className="text-4xl font-extrabold tracking-tight">LazeePOS Design Showcase</h1>
          <p className="text-[var(--text-secondary)] mt-2">Halaman sementara untuk memastikan konsistensi desain komponen UI.</p>
        </div>

        {/* =========================================================
            KATEGORI 1: LANDING PAGE COMPONENTS
        ========================================================= */}
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">1. Komponen Landing Page</h2>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Typography & Headers */}
            <div className="bg-[var(--bg-surface-elevated)] p-8 rounded-3xl border border-[var(--border)] shadow-sm">
              <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-6">Typography & Header</h3>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent-primary-transparent)] text-[var(--accent-primary)] text-xs font-bold uppercase tracking-wider border border-[var(--accent-primary)]/20 mb-6">
                Badge / Tagline
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1] mb-4">
                Judul Hero <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'var(--accent-gradient)' }}>Landing Page.</span>
              </h1>
              <p className="text-lg text-[var(--text-secondary)] font-medium leading-relaxed">
                Paragraf sekunder yang digunakan untuk menjelaskan fitur atau penawaran utama di bawah judul besar.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="bg-[var(--bg-surface-elevated)] p-8 rounded-3xl border border-[var(--border)] shadow-sm flex flex-col justify-center">
              <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-6">Call to Actions (CTA)</h3>
              <div className="flex flex-col gap-4">
                <button className="w-full px-8 py-4 rounded-2xl text-base font-bold text-white flex items-center justify-center gap-2 shadow-xl hover:-translate-y-1 transition-transform" style={{ background: 'var(--accent-gradient)' }}>
                  Mulai Sekarang <ArrowRight size={20} />
                </button>
                <button className="w-full px-8 py-4 rounded-2xl text-base font-bold text-[var(--text-primary)] bg-[var(--bg-main)] border border-[var(--border)] hover:bg-[var(--border)] transition-colors flex items-center justify-center gap-2">
                  <Play size={20} /> Lihat Demo POS
                </button>
              </div>
            </div>
            
            {/* Feature Cards */}
            <div className="md:col-span-2 bg-[var(--bg-surface-elevated)] p-8 rounded-3xl border border-[var(--border)] shadow-sm">
              <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-6">Feature Cards</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="group p-6 rounded-[2rem] bg-[var(--bg-main)] border border-[var(--border)] hover:border-[var(--accent-primary)] transition-all hover:-translate-y-1">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--accent-primary-transparent)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Store size={28} className="text-[var(--accent-primary)]" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Fitur Andalan {i}</h3>
                    <p className="text-[var(--text-secondary)] font-medium leading-relaxed">Deskripsi singkat fitur yang menarik pelanggan untuk membaca lebih lanjut.</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            KATEGORI 2: OPERATIONAL COMPONENTS (APP)
        ========================================================= */}
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">2. Komponen Operasional (Dashboard / POS)</h2>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* App Cards & Stats */}
            <div className="bg-[var(--bg-surface-elevated)] p-6 rounded-2xl border border-[var(--border)] shadow-sm space-y-6">
              <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Statistik / Ringkasan</h3>
              <div className="p-5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border)] flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Check size={24} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--text-secondary)]">Total Penjualan</p>
                  <p className="text-2xl font-extrabold text-[var(--text-primary)]">Rp 12.500.000</p>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border)] flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <AlertCircle size={24} className="text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--text-secondary)]">Stok Menipis</p>
                  <p className="text-2xl font-extrabold text-[var(--text-primary)]">5 Barang</p>
                </div>
              </div>
            </div>

            {/* Forms & Inputs */}
            <div className="bg-[var(--bg-surface-elevated)] p-6 rounded-2xl border border-[var(--border)] shadow-sm space-y-6">
              <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Form & Input</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">Nama Produk</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none transition-all" 
                    placeholder="Contoh: Kopi Susu Aren" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">Pencarian</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none transition-all" 
                      placeholder="Cari transaksi..." 
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
                      <Search size={18} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="md:col-span-2 bg-[var(--bg-surface-elevated)] p-6 rounded-2xl border border-[var(--border)] shadow-sm space-y-6">
              <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">Action Buttons (Operational)</h3>
              <div className="flex flex-wrap gap-4">
                <button className="px-5 py-2.5 rounded-xl font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5" style={{ background: 'var(--accent-gradient)' }}>
                  Simpan Perubahan
                </button>
                <button className="px-5 py-2.5 rounded-xl font-bold bg-[var(--accent-primary)] text-white shadow-lg transition-transform hover:-translate-y-0.5">
                  <div className="flex items-center gap-2"><Plus size={18} /> Tambah Baru</div>
                </button>
                <button className="px-5 py-2.5 rounded-xl font-bold bg-[var(--bg-main)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--border)] transition-colors">
                  Batal
                </button>
                <button className="px-5 py-2.5 rounded-xl font-bold bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2">
                  <Trash2 size={18} /> Hapus Data
                </button>
              </div>
            </div>

            {/* Tables / List Items */}
            <div className="md:col-span-2 bg-[var(--bg-surface-elevated)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
              <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-main)]">
                <h3 className="font-bold text-[var(--text-primary)]">Tabel Data Standar</h3>
                <button className="text-sm font-bold text-[var(--accent-primary)] hover:underline">Lihat Semua</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--bg-main)] text-[var(--text-secondary)] border-b border-[var(--border)]">
                    <tr>
                      <th className="px-6 py-4 font-bold">ID Transaksi</th>
                      <th className="px-6 py-4 font-bold">Pelanggan</th>
                      <th className="px-6 py-4 font-bold">Total</th>
                      <th className="px-6 py-4 font-bold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {[1, 2, 3].map((row) => (
                      <tr key={row} className="hover:bg-[var(--bg-main)] transition-colors">
                        <td className="px-6 py-4 font-semibold">TRX-00{row}</td>
                        <td className="px-6 py-4">Budi Santoso</td>
                        <td className="px-6 py-4 font-bold text-[var(--text-primary)]">Rp 50.000</td>
                        <td className="px-6 py-4 text-right">
                          <span className="px-3 py-1 text-xs font-bold bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20">Selesai</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
