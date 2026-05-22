import { useState } from 'react';
import { Plus, Search, Edit3, Trash2, Package } from 'lucide-react';
import { Modal } from '../components/Modal';

export function Products() {
  const [products, setProducts] = useState<any[]>([
    { id: 1, name: 'Espresso Blend 200g', category: 'Kopi', price: 45000, stock: 25, sku: 'KP-001' },
    { id: 2, name: 'Premium Matcha Powder', category: 'Teh', price: 65000, stock: 12, sku: 'TH-003' },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', category: '', price: '', stock: '', sku: '' });

  return (
    <div className="animate-fade-in flex flex-col gap-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Katalog Produk</h1>
          <p className="text-[var(--text-secondary)] mt-1 font-medium">Kelola daftar produk, harga, dan kategori barang toko Anda.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 rounded-xl font-bold text-white flex items-center gap-2 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
          style={{ background: 'var(--accent-gradient)' }}
        >
          <Plus size={18} /> Tambah Produk
        </button>
      </div>

      {/* Kontrol & Pencarian */}
      <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
          <input 
            type="text" 
            placeholder="Cari produk atau SKU..." 
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none transition-all text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tabel Produk */}
      <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="text-[var(--text-secondary)] border-b border-[var(--border)] text-xs uppercase tracking-wider bg-[var(--bg-main)]/30">
                <th className="p-4 font-semibold">SKU</th>
                <th className="p-4 font-semibold">Nama Produk</th>
                <th className="p-4 font-semibold">Kategori</th>
                <th className="p-4 font-semibold text-right">Harga</th>
                <th className="p-4 font-semibold text-center">Stok Toko</th>
                <th className="p-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-sm">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-[var(--bg-main)]/40 transition-colors">
                  <td className="p-4 font-mono text-xs text-[var(--text-secondary)]">{p.sku}</td>
                  <td className="p-4 font-bold text-[var(--text-primary)]">{p.name}</td>
                  <td className="p-4 text-[var(--text-secondary)] font-medium">{p.category}</td>
                  <td className="p-4 text-right font-bold text-[var(--text-primary)]">Rp {p.price.toLocaleString()}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                      p.stock <= 15 
                        ? 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20' 
                        : 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20'
                    }`}>
                      {p.stock} Unit
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary-transparent)] transition-all">
                        <Edit3 size={16} />
                      </button>
                      <button className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Produk */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Produk Baru">
        <form className="flex flex-col gap-4 mt-2" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Kode SKU</label>
              <input type="text" className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none transition-all text-sm" placeholder="Cth: KP-001" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Kategori</label>
              <input type="text" className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none transition-all text-sm" placeholder="Cth: Minuman" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Nama Produk</label>
            <input type="text" className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none transition-all text-sm" placeholder="Masukkan nama produk lengkap" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Harga Jual (Rp)</label>
              <input type="number" className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none transition-all text-sm font-bold" placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Stok Awal</label>
              <input type="number" className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none transition-all text-sm" placeholder="0" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--border)]">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl font-bold text-[var(--text-primary)] bg-[var(--bg-main)] border border-[var(--border)] hover:bg-[var(--bg-surface-elevated)] transition-colors text-sm">Batal</button>
            <button type="submit" className="px-4 py-2 rounded-xl font-bold text-white text-sm" style={{ background: 'var(--accent-gradient)' }}>Simpan Produk</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}