import { useState, useEffect } from 'react';
import { Plus, Search, Edit3, Trash2, Package, Loader2, RefreshCw } from 'lucide-react';
import { Modal } from '../components/Modal';
import api from '../api/client';
import toast from 'react-hot-toast';

const fmt = (val: number) => 'Rp ' + Math.round(val).toLocaleString('id-ID');

export function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({
    sku: '', name: '', description: '', price: '', costPrice: '', category: '', initialStock: '', reorderLevel: ''
  });
  const [productImage, setProductImage] = useState<File | null>(null);
  const [productImageUrl, setProductImageUrl] = useState('');

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let uploadedImageUrl = formData.imageUrl;

      if (productImage) {
        const uploadData = new FormData();
        uploadData.append('file', productImage);
        const uploadRes = await api.post('/upload', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedImageUrl = uploadRes.data.url;
      }

      const payload = { ...formData, imageUrl: uploadedImageUrl };

      if (formData.id) {
        await api.put(`/products/${formData.id}`, payload);
        toast.success('Produk berhasil diperbarui');
      } else {
        await api.post('/products', payload);
        toast.success('Produk berhasil ditambahkan');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (p: any) => {
    setFormData(p);
    setProductImageUrl(p.imageUrl || '');
    setProductImage(null);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({ sku: '', name: '', description: '', price: '', costPrice: '', category: '', initialStock: '', reorderLevel: '' });
    setProductImageUrl('');
    setProductImage(null);
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

  const field = (key: string) => ({
    value: formData[key] || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFormData((prev: any) => ({ ...prev, [key]: e.target.value })),
  });

  const inputCls = "w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none transition-all text-sm";
  const labelCls = "block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5";

  return (
    <div className="animate-fade-in flex flex-col gap-8 pb-10">
      <div className="sticky top-[-1rem] z-10 bg-[var(--bg-main)]/80 backdrop-blur-md pb-4 pt-4 -mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-transparent">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Katalog Produk</h1>
          <p className="text-[var(--text-secondary)] mt-1 font-medium">Kelola daftar barang jualanmu.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="px-5 py-2.5 rounded-xl font-bold text-white flex items-center gap-2 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
          style={{ background: 'var(--accent-gradient)' }}
        >
          <Plus size={18} /> Tambah Produk Baru
        </button>
      </div>

      <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
          <input type="text" placeholder="Cari nama atau SKU..." className={inputCls + " pl-10"} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setActiveCategory('')} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${!activeCategory ? 'text-white border-transparent' : 'bg-[var(--bg-main)] border-[var(--border)] text-[var(--text-secondary)]'}`} style={!activeCategory ? { background: 'var(--accent-gradient)' } : {}}>Semua</button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(activeCategory === cat ? '' : cat)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${activeCategory === cat ? 'text-white border-transparent' : 'bg-[var(--bg-main)] border-[var(--border)] text-[var(--text-secondary)]'}`} style={activeCategory === cat ? { background: 'var(--accent-gradient)' } : {}}>{cat}</button>
          ))}
          <button onClick={fetchProducts} className="p-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-all"><RefreshCw size={14} /></button>
        </div>
      </div>

      <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="text-[var(--text-secondary)] border-b border-[var(--border)] text-xs uppercase tracking-wider bg-[var(--bg-main)]/30">
                <th className="p-4 font-semibold">SKU</th>
                <th className="p-4 font-semibold">Nama Produk</th>
                <th className="p-4 font-semibold text-right">Harga</th>
                <th className="p-4 font-semibold text-center">Stok</th>
                <th className="p-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-sm">
              {isLoading ? (
                <tr><td colSpan={5} className="text-center p-8"><Loader2 size={24} className="animate-spin mx-auto text-[var(--accent-primary)]" /></td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={5} className="text-center p-8 text-[var(--text-secondary)]">Tidak ada produk ditemukan.</td></tr>
              ) : (
                products.map((p: any) => {
                  const stock = p.warehouse?.quantity ?? 0;
                  return (
                    <tr key={p.id} className="hover:bg-[var(--bg-main)]/40 transition-colors">
                      <td className="p-4 font-mono text-xs text-[var(--text-secondary)]">{p.sku || '-'}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {p.imageUrl ? (
                            <img src={`http://localhost:5000${p.imageUrl}`} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-[var(--border)]" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary-transparent)] text-[var(--accent-primary)] flex items-center justify-center font-bold border border-[var(--border)]">
                              {p.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-[var(--text-primary)]">{p.name}</p>
                            <p className="text-xs text-[var(--text-secondary)]">{p.category || 'Uncategorized'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right font-bold text-[var(--text-primary)]">{fmt(p.price)}</td>
                      <td className="p-4 text-center">{stock}</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => openEdit(p)} className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent-primary)]"><Edit3 size={15} /></button>
                          <button onClick={() => handleDelete(p)} className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--danger)]"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Edit Produk" : "Tambah Produk Baru"}>
        <form onSubmit={handleSave} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2 items-center mb-2">
            <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-[var(--border)] flex items-center justify-center cursor-pointer hover:border-[var(--accent-primary)] hover:bg-[var(--bg-main)] transition-all overflow-hidden group relative">
              <input type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setProductImage(e.target.files[0]);
                  setProductImageUrl(URL.createObjectURL(e.target.files[0]));
                }
              }} />
              {productImageUrl ? (
                <>
                  <img src={productImageUrl.startsWith('blob:') ? productImageUrl : `http://localhost:5000${productImageUrl}`} alt="Product" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold">Ubah</div>
                </>
              ) : (
                <div className="text-[var(--text-secondary)] flex flex-col items-center">
                  <Package size={24} className="mb-1 opacity-50" />
                  <span className="text-[10px] font-bold text-center">Upload<br/>Foto</span>
                </div>
              )}
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>SKU</label>
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
