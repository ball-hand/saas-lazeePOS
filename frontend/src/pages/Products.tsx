import { useState, useEffect } from 'react';
import { Plus, Search, Edit3, Trash2, Package, Loader2, RefreshCw } from 'lucide-react';
import { Modal } from '../components/Modal';
import api from '../api/client';
import toast from 'react-hot-toast';

const fmt = (val: number) => 'Rp ' + Math.round(val).toLocaleString('id-ID');

const emptyForm = {
  sku: '', name: '', category: '', description: '',
  price: '', costPrice: '', initialStock: '', reorderLevel: '10',
};

export function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [isSaving, setIsSaving] = useState(false);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (activeCategory) params.category = activeCategory;
      const { data } = await api.get('/products', { params });
      setProducts(data.products || []);
      setCategories(data.categories || []);
    } catch {
      toast.error('Gagal memuat produk.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [searchQuery, activeCategory]);

  const openAdd = () => {
    setEditTarget(null);
    setFormData({ ...emptyForm });
    setIsModalOpen(true);
  };

  const openEdit = (p: any) => {
    setEditTarget(p);
    setFormData({
      sku: p.sku || '',
      name: p.name || '',
      category: p.category || '',
      description: p.description || '',
      price: String(p.price),
      costPrice: p.costPrice ? String(p.costPrice) : '',
      initialStock: p.warehouse ? String(p.warehouse.quantity) : '',
      reorderLevel: p.warehouse ? String(p.warehouse.reorderLevel) : '10',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      toast.error('Nama dan harga wajib diisi.'); return;
    }
    setIsSaving(true);
    try {
      if (editTarget) {
        await api.put(`/products/${editTarget.id}`, {
          sku: formData.sku || null,
          name: formData.name,
          category: formData.category || null,
          description: formData.description || null,
          price: parseFloat(formData.price),
          costPrice: formData.costPrice ? parseFloat(formData.costPrice) : null,
        });
        // Update stock separately if changed
        if (formData.initialStock && editTarget.warehouse) {
          const newQty = parseInt(formData.initialStock);
          const diff = newQty - editTarget.warehouse.quantity;
          if (diff !== 0) {
            await api.post('/warehouse/adjust', {
              productId: editTarget.id,
              adjustment: diff,
              reason: 'Manual edit dari halaman Produk',
            });
          }
        }
        toast.success('Produk berhasil diperbarui!');
      } else {
        await api.post('/products', {
          sku: formData.sku || null,
          name: formData.name,
          category: formData.category || null,
          description: formData.description || null,
          price: parseFloat(formData.price),
          costPrice: formData.costPrice ? parseFloat(formData.costPrice) : null,
          initialStock: formData.initialStock ? parseInt(formData.initialStock) : 0,
          reorderLevel: formData.reorderLevel ? parseInt(formData.reorderLevel) : 10,
        });
        toast.success('Produk berhasil ditambahkan!');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan produk.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (p: any) => {
    if (!confirm(`Nonaktifkan produk "${p.name}"?`)) return;
    try {
      await api.delete(`/products/${p.id}`);
      toast.success('Produk dinonaktifkan.');
      fetchProducts();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menghapus produk.');
    }
  };

  const field = (key: keyof typeof emptyForm) => ({
    value: formData[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFormData(prev => ({ ...prev, [key]: e.target.value })),
  });

  const inputCls = "w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none transition-all text-sm";
  const labelCls = "block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5";

  return (
    <div className="animate-fade-in flex flex-col gap-6 pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Katalog Produk</h1>
          <p className="text-[var(--text-secondary)] mt-1 font-medium">Kelola produk, harga, dan stok toko Anda.</p>
        </div>
        <button
          onClick={openAdd}
          className="px-5 py-2.5 rounded-xl font-bold text-white flex items-center gap-2 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 text-sm"
          style={{ background: 'var(--accent-gradient)' }}
        >
          <Plus size={18} /> Tambah Produk
        </button>
      </div>

      {/* Search + Filter */}
      <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
          <input
            type="text"
            placeholder="Cari nama atau SKU..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none transition-all text-sm"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveCategory('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${!activeCategory ? 'text-white border-transparent' : 'bg-[var(--bg-main)] border-[var(--border)] text-[var(--text-secondary)]'}`}
            style={!activeCategory ? { background: 'var(--accent-gradient)' } : {}}
          >
            Semua
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? '' : cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${activeCategory === cat ? 'text-white border-transparent' : 'bg-[var(--bg-main)] border-[var(--border)] text-[var(--text-secondary)]'}`}
              style={activeCategory === cat ? { background: 'var(--accent-gradient)' } : {}}
            >
              {cat}
            </button>
          ))}
          <button onClick={fetchProducts} className="p-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] transition-all" title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="text-[var(--text-secondary)] border-b border-[var(--border)] text-xs uppercase tracking-wider bg-[var(--bg-main)]/30">
                <th className="p-4 font-semibold">SKU</th>
                <th className="p-4 font-semibold">Nama Produk</th>
                <th className="p-4 font-semibold">Kategori</th>
                <th className="p-4 font-semibold text-right">Harga Jual</th>
                <th className="p-4 font-semibold text-center">Stok</th>
                <th className="p-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center">
                    <Loader2 size={24} className="animate-spin mx-auto text-[var(--accent-primary)]" />
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-[var(--text-secondary)]">
                    <Package size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="font-medium text-sm">Belum ada produk</p>
                  </td>
                </tr>
              ) : (
                products.map(p => {
                  const stock = p.warehouse?.quantity ?? 0;
                  const reorder = p.warehouse?.reorderLevel ?? 10;
                  const isLow = stock <= reorder;
                  return (
                    <tr key={p.id} className={`hover:bg-[var(--bg-main)]/40 transition-colors ${!p.isActive ? 'opacity-50' : ''}`}>
                      <td className="p-4 font-mono text-xs text-[var(--text-secondary)]">{p.sku || '—'}</td>
                      <td className="p-4">
                        <p className="font-bold text-[var(--text-primary)]">{p.name}</p>
                        {!p.isActive && <span className="text-[10px] text-[var(--danger)] font-bold">NONAKTIF</span>}
                      </td>
                      <td className="p-4 text-[var(--text-secondary)] font-medium">{p.category || '—'}</td>
                      <td className="p-4 text-right font-bold text-[var(--text-primary)]">{fmt(p.price)}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                          stock === 0
                            ? 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20'
                            : isLow
                              ? 'bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20'
                              : 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20'
                        }`}>
                          {stock} Unit
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEdit(p)}
                            className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary-transparent)] transition-all"
                            title="Edit"
                          >
                            <Edit3 size={15} />
                          </button>
                          {p.isActive && (
                            <button
                              onClick={() => handleDelete(p)}
                              className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-all"
                              title="Nonaktifkan"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editTarget ? 'Edit Produk' : 'Tambah Produk Baru'}
      >
        <form className="flex flex-col gap-4 mt-2" onSubmit={handleSave}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Kode SKU</label>
              <input type="text" className={inputCls} placeholder="Cth: KP-001" {...field('sku')} />
            </div>
            <div>
              <label className={labelCls}>Kategori</label>
              <input type="text" className={inputCls} placeholder="Cth: Minuman" {...field('category')} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Nama Produk <span className="text-[var(--danger)]">*</span></label>
            <input type="text" className={inputCls} placeholder="Nama produk lengkap" required {...field('name')} />
          </div>
          <div>
            <label className={labelCls}>Deskripsi</label>
            <textarea
              className={inputCls + ' resize-none'}
              rows={2}
              placeholder="Deskripsi singkat (opsional)"
              value={formData.description}
              onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Harga Jual (Rp) <span className="text-[var(--danger)]">*</span></label>
              <input type="number" min="0" className={inputCls + ' font-bold'} placeholder="0" required {...field('price')} />
            </div>
            <div>
              <label className={labelCls}>Harga Modal (Rp)</label>
              <input type="number" min="0" className={inputCls} placeholder="0" {...field('costPrice')} />
            </div>
          </div>
          {!editTarget && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Stok Awal</label>
                <input type="number" min="0" className={inputCls} placeholder="0" {...field('initialStock')} />
              </div>
              <div>
                <label className={labelCls}>Batas Stok Minimum</label>
                <input type="number" min="0" className={inputCls} placeholder="10" {...field('reorderLevel')} />
              </div>
            </div>
          )}
          {editTarget && (
            <div>
              <label className={labelCls}>Update Stok (qty baru)</label>
              <input type="number" min="0" className={inputCls} placeholder={String(editTarget.warehouse?.quantity ?? 0)} {...field('initialStock')} />
              <p className="text-xs text-[var(--text-secondary)] mt-1">Kosongkan jika tidak ingin mengubah stok</p>
            </div>
          )}
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl font-bold text-[var(--text-primary)] bg-[var(--bg-main)] border border-[var(--border)] hover:bg-[var(--bg-surface-elevated)] transition-colors text-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl font-bold text-white text-sm flex items-center gap-2 disabled:opacity-50"
              style={{ background: 'var(--accent-gradient)' }}
            >
              {isSaving ? <><Loader2 size={14} className="animate-spin" /> Menyimpan...</> : 'Simpan Produk'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
