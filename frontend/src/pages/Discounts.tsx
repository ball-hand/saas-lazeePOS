import { useState, useEffect } from 'react';
import { Plus, Tags, Trash2, Edit2, Tag, Percent, ShoppingBag, Layers, AlertCircle } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import toast from 'react-hot-toast';

const fmt = (val: number | string) =>
  'Rp ' + Math.round(parseFloat(String(val || 0))).toLocaleString('id-ID');

export function Discounts() {
  const [discounts, setDiscounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    discountType: 'percentage',
    discountValue: '',
    appliesTo: 'all',
    appliesToCategory: '',
    minQuantity: '1',
    minOrderAmount: '',
    isActive: true
  });

  const fetchDiscounts = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/discounts');
      setDiscounts(data.discounts || []);
    } catch {
      toast.error('Gagal memuat daftar aturan diskon.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate inputs
      const payload = {
        ...formData,
        discountValue: formData.discountType === 'bogo' ? '0' : parseFloat(formData.discountValue || '0'),
        minQuantity: parseInt(formData.minQuantity || '1'),
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : null
      };

      if (editingId) {
        await api.put(`/discounts/${editingId}`, payload);
        toast.success('Aturan diskon berhasil diperbarui');
      } else {
        await api.post('/discounts', payload);
        toast.success('Aturan diskon baru berhasil ditambahkan');
      }
      setIsModalOpen(false);
      fetchDiscounts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan aturan diskon.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus aturan diskon ini?')) return;
    try {
      await api.delete(`/discounts/${id}`);
      toast.success('Diskon berhasil dihapus');
      fetchDiscounts();
    } catch {
      toast.error('Gagal menghapus diskon');
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      name: '', discountType: 'percentage', discountValue: '', appliesTo: 'all', appliesToCategory: '', minQuantity: '1', minOrderAmount: '', isActive: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (d: any) => {
    setEditingId(d.id);
    setFormData({
      name: d.name,
      discountType: d.discountType,
      discountValue: d.discountValue.toString(),
      appliesTo: d.appliesTo,
      appliesToCategory: d.appliesToCategory || '',
      minQuantity: d.minQuantity.toString(),
      minOrderAmount: d.minOrderAmount?.toString() || '',
      isActive: d.isActive
    });
    setIsModalOpen(true);
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[var(--danger)] gap-3 bg-[var(--danger)]/5 rounded-2xl border border-[var(--danger)]/15 max-w-xl mx-auto my-10 p-8">
        <AlertCircle size={44} />
        <h2 className="text-xl font-black">Akses Ditolak</h2>
        <p className="text-sm text-[var(--text-secondary)] text-center font-medium">Halaman ini hanya dapat diakses oleh Administrator toko.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col gap-8 pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
            🏷️ Mesin Diskon Promosi
          </h1>
          <p className="text-[var(--text-secondary)] mt-1 font-medium">Buat aturan harga kondisional, diskon kategori, dan promo belanja.</p>
        </div>
        
        <button
          onClick={openAddModal}
          className="px-5 py-3 rounded-xl font-bold text-white flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
          style={{ background: 'var(--accent-gradient)' }}
        >
          <Plus size={18} /> Tambah Aturan Baru
        </button>
      </div>

      {/* Main Content Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-60 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : discounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl text-[var(--text-secondary)] gap-4 shadow-sm">
          <div className="p-5 rounded-full bg-[var(--bg-main)]">
            <Tags size={48} className="opacity-25 text-[var(--accent-primary)]" />
          </div>
          <div className="text-center">
            <p className="font-bold text-base text-[var(--text-primary)]">Belum ada promo yang dibuat</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">Buat diskon pertamamu untuk menarik lebih banyak pembeli!</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {discounts.map((d: any) => {
            const isPercentage = d.discountType === 'percentage';
            const isFixed = d.discountType === 'fixed_amount';
            return (
              <div
                key={d.id}
                className={`flex flex-col bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--accent-primary)]/50 transition-all hover:shadow-md hover:-translate-y-0.5 relative group ${
                  !d.isActive ? 'opacity-65' : ''
                }`}
              >
                {/* Rule Icon & Type badge */}
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary-transparent)] flex items-center justify-center text-[var(--accent-primary)]">
                    {isPercentage ? <Percent size={18} /> : isFixed ? <Tag size={18} /> : <ShoppingBag size={18} />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                      d.isActive
                        ? 'bg-[var(--success-transparent)] text-[var(--success)] border-[var(--success)]/20'
                        : 'bg-gray-500/10 text-[var(--text-secondary)] border-[var(--border)]'
                    }`}>
                      {d.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <h3 className="font-black text-lg text-[var(--text-primary)] leading-tight mb-1 truncate">{d.name}</h3>
                
                {/* Large value badge */}
                <div className="my-3">
                  <span className="inline-block px-3 py-1.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-sm font-black text-[var(--accent-primary)] font-mono shadow-sm">
                    {isPercentage ? `${parseFloat(d.discountValue)}% OFF` : 
                     isFixed ? `${fmt(d.discountValue)} OFF` : 
                     'BOGO (Beli 1 Gratis 1)'}
                  </span>
                </div>

                {/* Conditions block */}
                <div className="mt-2 pt-3 border-t border-[var(--border)] flex-1 space-y-2 text-xs text-[var(--text-secondary)] font-medium">
                  <div className="flex items-center gap-2">
                    <Layers size={13} className="text-[var(--accent-primary)]" />
                    <span>Target: <strong className="text-[var(--text-primary)] capitalize">{d.appliesTo === 'all' ? 'Semua Produk' : `Kategori (${d.appliesToCategory})`}</strong></span>
                  </div>
                  {d.minQuantity > 1 && (
                    <div className="flex items-center gap-2">
                      <ShoppingBag size={13} className="text-[var(--accent-primary)]" />
                      <span>Min. Kuantitas: <strong className="text-[var(--text-primary)]">{d.minQuantity} unit</strong></span>
                    </div>
                  )}
                  {d.minOrderAmount > 0 && (
                    <div className="flex items-center gap-2">
                      <Tag size={13} className="text-[var(--accent-primary)]" />
                      <span>Min. Belanja: <strong className="text-[var(--text-primary)]">{fmt(d.minOrderAmount)}</strong></span>
                    </div>
                  )}
                </div>

                {/* Actions Toolbar */}
                <div className="mt-5 pt-4 border-t border-[var(--border)] flex justify-end gap-2">
                  <button
                    onClick={() => openEditModal(d)}
                    className="p-2 text-[var(--text-secondary)] hover:text-white bg-[var(--bg-main)] border border-[var(--border)] rounded-xl hover:border-[var(--accent-primary)] transition-all shadow-sm"
                    title="Edit Aturan"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="p-2 text-[var(--danger)] bg-[var(--danger)]/5 border border-transparent rounded-xl hover:border-[var(--danger)]/20 hover:bg-[var(--danger)]/10 transition-all shadow-sm"
                    title="Hapus Promo"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Slide Modal Editor */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Aturan Diskon' : 'Tambah Aturan Diskon Baru'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Rule Name */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              Nama Aturan Promo *
            </label>
            <input
              required
              type="text"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm transition-all"
              placeholder="Cth: Diskon Kopi 10%, Promo Akhir Tahun"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Discount Type */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Jenis Diskon *
              </label>
              <select
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm cursor-pointer"
                value={formData.discountType}
                onChange={e => setFormData({ ...formData, discountType: e.target.value })}
              >
                <option value="percentage">Persentase (%)</option>
                <option value="fixed_amount">Jumlah Tetap (Rupiah)</option>
                <option value="bogo">Beli 1 Gratis 1 (BOGO)</option>
              </select>
            </div>
            
            {/* Discount Value */}
            {formData.discountType !== 'bogo' && (
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  {formData.discountType === 'percentage' ? 'Nilai Persen (%) *' : 'Jumlah Potongan (Rp) *'}
                </label>
                <input
                  required
                  type="number"
                  step="any"
                  min="0"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm font-bold transition-all"
                  placeholder={formData.discountType === 'percentage' ? 'Cth: 10' : 'Cth: 15000'}
                  value={formData.discountValue}
                  onChange={e => setFormData({ ...formData, discountValue: e.target.value })}
                />
              </div>
            )}
          </div>

          <div className="border-t border-[var(--border)] my-2"></div>
          <h4 className="text-xs font-bold text-[var(--accent-primary)] uppercase tracking-wider">Syarat & Kondisi Promo</h4>

          <div className="grid grid-cols-2 gap-4">
            {/* Applies To */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Target Penerapan
              </label>
              <select
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm cursor-pointer"
                value={formData.appliesTo}
                onChange={e => setFormData({ ...formData, appliesTo: e.target.value })}
              >
                <option value="all">Semua Produk</option>
                <option value="category">Kategori Tertentu</option>
              </select>
            </div>
            
            {/* Category Name */}
            {formData.appliesTo === 'category' && (
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                  Nama Kategori Target *
                </label>
                <input
                  required
                  type="text"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm transition-all"
                  placeholder="Cth: Makanan, Minuman"
                  value={formData.appliesToCategory}
                  onChange={e => setFormData({ ...formData, appliesToCategory: e.target.value })}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Min Item Qty */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Min. Item di Keranjang
              </label>
              <input
                type="number"
                min="1"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm transition-all"
                value={formData.minQuantity}
                onChange={e => setFormData({ ...formData, minQuantity: e.target.value })}
              />
            </div>
            
            {/* Min Cart Total */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                Min. Total Belanja (Rp)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm transition-all"
                placeholder="Kosongkan jika tidak ada"
                value={formData.minOrderAmount}
                onChange={e => setFormData({ ...formData, minOrderAmount: e.target.value })}
              />
            </div>
          </div>

          {/* Is Active Checkbox */}
          <div className="mt-2">
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-main)] hover:border-[var(--accent-primary)]/50 transition-colors">
              <input
                type="checkbox"
                className="w-4 h-4 rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                checked={formData.isActive}
                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <span className="text-sm font-bold text-[var(--text-primary)]">Aktifkan aturan promo ini sekarang</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 rounded-xl font-bold bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl font-bold text-white transition-all text-xs shadow-md"
              style={{ background: 'var(--accent-gradient)' }}
            >
              {editingId ? 'Simpan Perubahan' : 'Buat Promo'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
