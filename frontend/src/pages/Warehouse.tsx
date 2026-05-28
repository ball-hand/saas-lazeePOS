import { useState, useEffect } from 'react';
import { Package, RefreshCw, ArrowUpRight, ArrowDownLeft, Loader2 } from 'lucide-react';
import { Modal } from '../components/Modal';
import { Breadcrumb } from '../components/shared/Breadcrumb';
import { Pagination } from '../components/shared/Pagination';
import api from '../api/client';
import { CustomSelect } from '../components/shared/CustomSelect';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

export function Warehouse() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const [activeCategory, setActiveCategory] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(inventory.length / itemsPerPage);
  const currentInventory = inventory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, activeCategory, showLowStockOnly]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    adjustmentType: 'add', // 'add' or 'sub'
    quantity: '',
    reason: ''
  });

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (activeCategory) params.category = activeCategory;
      if (showLowStockOnly) params.lowStock = 'true';

      const { data } = await api.get('/warehouse', { params });
      setInventory(data.inventory || []);
      setCategories(data.categories || []);
    } catch {
      toast.error('Gagal memuat inventori gudang.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProductsList = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data.products || []);
    } catch {
      console.error('Failed to load products list for dropdown');
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [searchQuery, activeCategory, showLowStockOnly]);

  useEffect(() => {
    fetchProductsList();
  }, []);

  const openAdjustModal = (type: 'add' | 'sub', defaultProductId = '') => {
    setFormData({
      productId: defaultProductId || (products[0]?.id || ''),
      adjustmentType: type,
      quantity: '',
      reason: ''
    });
    setIsModalOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || !formData.quantity) {
      toast.error('Produk dan jumlah wajib diisi.');
      return;
    }

    const qty = parseInt(formData.quantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Jumlah harus berupa angka positif.');
      return;
    }

    setIsSaving(true);
    try {
      const adjustmentValue = formData.adjustmentType === 'add' ? qty : -qty;
      const defaultReason = formData.adjustmentType === 'add' ? 'Restock Gudang' : 'Transfer ke Rak / Display';

      await api.post('/warehouse/adjust', {
        productId: formData.productId,
        adjustment: adjustmentValue,
        reason: formData.reason || defaultReason
      });

      toast.success('Stok berhasil disesuaikan!');
      setIsModalOpen(false);
      fetchInventory();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyesuaikan stok.');
    } finally {
      setIsSaving(false);
    }
  };

  const lowStockCount = inventory.filter((w) => w.quantity <= w.reorderLevel).length;

  const inputCls = "w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none transition-all text-sm";
  const labelCls = "block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5";

  return (
    <div className="animate-fade-in flex flex-col gap-4 pb-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <Breadcrumb items={[{ label: 'Katalog & Gudang' }, { label: 'Stok Gudang' }]} />
        <div className="flex justify-end gap-2">
        <button 
          onClick={() => openAdjustModal('add')}
          className="px-4 py-2 rounded-xl font-bold text-[var(--text-primary)] bg-[var(--bg-surface-elevated)] border border-[var(--border)] hover:bg-[var(--bg-main)] transition-all text-sm flex items-center justify-center gap-2 shadow-sm"
        >
          <ArrowDownLeft size={16} className="text-[var(--success)]" /> Restock Gudang
        </button>
        <button 
          onClick={() => openAdjustModal('sub')}
          className="px-4 py-2 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 shadow-sm hover:opacity-90 transition-all" 
          style={{ background: 'var(--accent-gradient)' }}
        >
          <ArrowUpRight size={16} /> Transfer ke Rak
        </button>
        </div>
      </div>

      {/* Grid Informasi Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
            <Package size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Total Item Terdaftar</p>
            <p className="text-xl font-extrabold text-[var(--text-primary)] mt-0.5">{inventory.length} Barang</p>
          </div>
        </div>
        <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 rounded-xl bg-[var(--warning)]/10 text-[var(--warning)]">
            <RefreshCw size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Perlu Segera Diorder</p>
            <p className="text-xl font-extrabold text-[var(--text-primary)] mt-0.5">{lowStockCount} Item Low</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-4 flex flex-col lg:flex-row gap-3 items-center justify-end shadow-sm">
        <div className="flex gap-2 flex-wrap w-full lg:w-auto justify-end">
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
          <div className="border-l border-[var(--border)] mx-1 h-6 self-center hidden sm:block"></div>
          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${showLowStockOnly ? 'bg-[var(--warning)]/20 border-[var(--warning)]/40 text-[var(--warning)]' : 'bg-[var(--bg-main)] border-[var(--border)] text-[var(--text-secondary)]'}`}
          >
            Stok Menipis
          </button>
          <button onClick={fetchInventory} className="p-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] transition-all" title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Tabel Inventori Gudang */}
      <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="text-[var(--text-secondary)] border-b border-[var(--border)] text-xs uppercase tracking-wider bg-[var(--bg-main)]/30">
                <th className="p-4 font-semibold">SKU</th>
                <th className="p-4 font-semibold">Nama Barang</th>
                <th className="p-4 font-semibold">Kategori</th>
                <th className="p-4 font-semibold">Lokasi</th>
                <th className="p-4 font-semibold text-center">Stok Gudang</th>
                <th className="p-4 font-semibold text-center">Batas Minimum</th>
                <th className="p-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center">
                    <Loader2 size={24} className="animate-spin mx-auto text-[var(--accent-primary)]" />
                  </td>
                </tr>
              ) : currentInventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-[var(--text-secondary)]">
                    <Package size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="font-medium text-sm">Tidak ada barang inventori</p>
                  </td>
                </tr>
              ) : (
                currentInventory.map((item) => {
                  const isLow = item.quantity <= item.reorderLevel;
                  return (
                    <tr key={item.id} className="hover:bg-[var(--bg-main)]/40 transition-colors">
                      <td className="p-4 font-mono text-xs text-[var(--text-secondary)]">{item.product.sku || '—'}</td>
                      <td className="p-4 font-bold text-[var(--text-primary)]">{item.product.name}</td>
                      <td className="p-4 font-medium text-[var(--text-secondary)]">{item.product.category || '—'}</td>
                      <td className="p-4 text-[var(--text-secondary)]">{item.location || 'Main Storage'}</td>
                      <td className="p-4 text-center font-bold text-[var(--text-primary)]">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                          item.quantity === 0
                            ? 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/20'
                            : isLow
                              ? 'bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20'
                              : 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20'
                        }`}>
                          {item.quantity} Unit
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-[var(--text-secondary)] font-medium">
                          {item.reorderLevel} Unit
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={() => openAdjustModal('add', item.productId)}
                            className="p-1.5 rounded-lg text-secondary hover:text-[var(--success)] hover:bg-[var(--success)]/10 transition-all"
                            title="Restock Item"
                          >
                            <ArrowDownLeft size={16} />
                          </button>
                          <button
                            onClick={() => openAdjustModal('sub', item.productId)}
                            className="p-1.5 rounded-lg text-secondary hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-all"
                            title="Kurangi Stok / Transfer"
                          >
                            <ArrowUpRight size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
          totalItems={inventory.length} 
        />
      </div>

      {/* Modal Penyesuaian Stok */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={formData.adjustmentType === 'add' ? 'Restock / Tambah Stok Gudang' : 'Penyesuaian / Kurangi Stok Gudang'}
      >
        <form className="flex flex-col gap-4 mt-2" onSubmit={handleAdjustSubmit}>
          <div>
            <label className={labelCls}>Pilih Produk</label>
            <CustomSelect
              className={inputCls}
              value={formData.productId}
              onChange={(val) => setFormData({ ...formData, productId: String(val) })}
              options={products.map((p) => ({
                value: p.id,
                label: `${p.name} ${p.sku ? `(${p.sku})` : ''}`
              }))}
              placeholder="Pilih Produk..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Aksi</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, adjustmentType: 'add' })}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all border ${
                    formData.adjustmentType === 'add'
                      ? 'bg-[var(--success)]/15 border-[var(--success)]/40 text-[var(--success)]'
                      : 'bg-transparent border-[var(--border)] text-[var(--text-secondary)]'
                  }`}
                >
                  Tambah (+)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, adjustmentType: 'sub' })}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all border ${
                    formData.adjustmentType === 'sub'
                      ? 'bg-[var(--danger)]/15 border-[var(--danger)]/40 text-[var(--danger)]'
                      : 'bg-transparent border-[var(--border)] text-[var(--text-secondary)]'
                  }`}
                >
                  Kurangi (-)
                </button>
              </div>
            </div>

            <div>
              <label className={labelCls}>Jumlah (Qty) <span className="text-[var(--danger)]">*</span></label>
              <input
                type="number"
                min="1"
                required
                className={inputCls + " font-bold"}
                placeholder="Jumlah unit"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Alasan / Keterangan</label>
            <textarea
              className={inputCls + " resize-none"}
              rows={3}
              placeholder={formData.adjustmentType === 'add' ? "Cth: Pengiriman suplier, Retur barang" : "Cth: Transfer display, Barang rusak, Selisih stok"}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            />
          </div>

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
              {isSaving ? <><Loader2 size={14} className="animate-spin" /> Memproses...</> : 'Terapkan Penyesuaian'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}