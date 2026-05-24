import { useEffect, useState } from 'react';
import { 
  Plus, Edit2, Ban, CheckCircle2, 
  CreditCard, Users, Package, MapPin, Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { Modal } from '../../components/Modal';

interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  maxProducts: number;
  maxUsers: number;
  maxBranches: number;
  features: string | any;
  status: string;
  createdAt: string;
  _count: {
    subscriptions: number;
  };
}

export function CentralPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    monthlyPrice: 0,
    maxProducts: 100,
    maxUsers: 3,
    maxBranches: 1,
    status: 'ACTIVE'
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/central/plans');
      setPlans(data.plans);
    } catch (err) {
      toast.error('Gagal mengambil data paket berlangganan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingPlan) {
        await api.put(`/central/plans/${editingPlan.id}`, formData);
        toast.success('Paket berhasil diperbarui');
      } else {
        await api.post('/central/plans', formData);
        toast.success('Paket berhasil dibuat');
      }
      setIsModalOpen(false);
      fetchPlans();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan paket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusToggle = async (p: Plan) => {
    const isActive = p.status === 'ACTIVE';
    if (confirm(`Apakah Anda yakin ingin ${isActive ? 'menonaktifkan' : 'mengaktifkan'} paket ${p.name}?`)) {
      try {
        if (isActive) {
          await api.delete(`/central/plans/${p.id}`);
          toast.success('Paket berhasil dinonaktifkan');
        } else {
          await api.put(`/central/plans/${p.id}`, { status: 'ACTIVE' });
          toast.success('Paket berhasil diaktifkan kembali');
        }
        fetchPlans();
      } catch (err) {
        toast.error('Gagal mengubah status paket');
      }
    }
  };

  const openEditModal = (p: Plan) => {
    setEditingPlan(p);
    setFormData({
      name: p.name,
      description: p.description || '',
      monthlyPrice: p.monthlyPrice,
      maxProducts: p.maxProducts,
      maxUsers: p.maxUsers,
      maxBranches: p.maxBranches,
      status: p.status
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormData({ 
      name: '', description: '', monthlyPrice: 0, 
      maxProducts: 100, maxUsers: 3, maxBranches: 1, status: 'ACTIVE' 
    });
    setIsModalOpen(true);
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">Paket Langganan</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Kelola harga dan batasan fitur untuk tenant SaaS Anda.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)] transition-colors font-semibold shadow-lg shadow-[var(--accent-primary)]/20"
        >
          <Plus size={18} /> Tambah Paket
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-[var(--text-secondary)] p-4">Memuat data...</p>
        ) : plans.length === 0 ? (
          <p className="text-[var(--text-secondary)] p-4 col-span-full">Belum ada paket langganan. Silakan tambahkan baru.</p>
        ) : (
          plans.map((p) => (
            <div key={p.id} className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl overflow-hidden hover:border-[var(--accent-primary)]/30 transition-all flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)]">{p.name}</h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">{p.description || 'Tidak ada deskripsi'}</p>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border ${
                    p.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {p.status}
                  </span>
                </div>
                
                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-[var(--accent-primary)]">
                    Rp {p.monthlyPrice.toLocaleString('id-ID')}
                  </span>
                  <span className="text-sm font-medium text-[var(--text-secondary)]">/ bulan</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                    <div className="p-1.5 rounded-lg bg-[var(--bg-main)]"><Users size={16} /></div>
                    <span className="font-medium">Maks. {p.maxUsers} Pengguna</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                    <div className="p-1.5 rounded-lg bg-[var(--bg-main)]"><Package size={16} /></div>
                    <span className="font-medium">Maks. {p.maxProducts} Produk</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                    <div className="p-1.5 rounded-lg bg-[var(--bg-main)]"><MapPin size={16} /></div>
                    <span className="font-medium">Maks. {p.maxBranches} Cabang/Gudang</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-main)]/50 flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  {p._count?.subscriptions || 0} Toko berlangganan
                </span>
                <div className="flex gap-2">
                  <button onClick={() => openEditModal(p)} className="p-2 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-xl text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleStatusToggle(p)} className={`p-2 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-xl transition-colors ${
                    p.status === 'ACTIVE' ? 'text-[var(--danger)] hover:bg-[var(--danger)]/10' : 'text-[var(--success)] hover:bg-[var(--success)]/10'
                  }`}>
                    {p.status === 'ACTIVE' ? <Ban size={16} /> : <CheckCircle2 size={16} />}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingPlan ? 'Edit Paket' : 'Tambah Paket Baru'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Nama Paket</label>
            <input required type="text" className="w-full px-4 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none" 
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Misal: Basic, Pro, Enterprise"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Deskripsi Singkat</label>
            <input type="text" className="w-full px-4 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none" 
              value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Harga Bulanan (Rp)</label>
            <input required type="number" min="0" className="w-full px-4 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none" 
              value={formData.monthlyPrice} onChange={e => setFormData({...formData, monthlyPrice: Number(e.target.value)})}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4 pt-2 border-t border-[var(--border)]">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Maks. Pengguna</label>
              <input required type="number" min="1" className="w-full px-4 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none" 
                value={formData.maxUsers} onChange={e => setFormData({...formData, maxUsers: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Maks. Produk</label>
              <input required type="number" min="1" className="w-full px-4 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none" 
                value={formData.maxProducts} onChange={e => setFormData({...formData, maxProducts: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Maks. Cabang</label>
              <input required type="number" min="1" className="w-full px-4 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none" 
                value={formData.maxBranches} onChange={e => setFormData({...formData, maxBranches: Number(e.target.value)})}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-main)] text-sm font-medium transition-colors">Batal</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)] text-sm font-medium transition-colors flex items-center gap-2">
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
