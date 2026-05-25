import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CustomSelect } from '../../components/shared/CustomSelect';
import { 
  Search, Plus, Building2, Edit2, Ban, CheckCircle2, 
  MoreVertical, ShieldAlert, Package, Users, ChevronRight, LogIn
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { Modal } from '../../components/Modal';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  themeMode: string;
  primaryColor: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    users: number;
    products: number;
    transactions: number;
  };
  subscription?: {
    plan?: { name: string; monthlyPrice: number };
  };
}

export function CentralTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState({
    name: '', subdomain: '', themeMode: 'dark', primaryColor: '#8B5CF6', status: 'ACTIVE'
  });
  const [submitting, setSubmitting] = useState(false);

  // Kill Switch State
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [targetTenant, setTargetTenant] = useState<Tenant | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/central/tenants', {
        params: { search, status: statusFilter, page, limit: 10 }
      });
      setTenants(data.tenants);
      setTotalPages(data.totalPages);
    } catch (err) {
      toast.error('Gagal mengambil data tenant');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(fetchTenants, 300);
    return () => clearTimeout(delay);
  }, [search, statusFilter, page]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingTenant) {
        await api.put(`/central/tenants/${editingTenant.id}`, formData);
        toast.success('Tenant berhasil diperbarui');
      } else {
        await api.post('/central/tenants', formData);
        toast.success('Tenant berhasil dibuat');
      }
      setIsModalOpen(false);
      fetchTenants();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan tenant');
    } finally {
      setSubmitting(false);
    }
  };

  const executeKillSwitch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!targetTenant) return;
    
    setSubmitting(true);
    try {
      if (targetTenant.status === 'ACTIVE' || targetTenant.status === 'TRIAL') {
        // Suspend
        await api.post(`/central/tenants/${targetTenant.id}/kill-switch`, {
          action: 'suspend',
          reason: suspendReason || 'Melanggar ketentuan layanan'
        });
        toast.success('Tenant berhasil di-suspend');
      } else {
        // Restore
        await api.post(`/central/tenants/${targetTenant.id}/kill-switch`, { action: 'restore' });
        toast.success('Tenant berhasil diaktifkan kembali');
      }
      setSuspendModalOpen(false);
      fetchTenants();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengeksekusi kill switch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImpersonate = async (tenantId: string) => {
    try {
      toast.loading('Menghasilkan token...', { id: 'impersonate' });
      const res = await api.post(`/central/tenants/${tenantId}/impersonate`);
      const { token, subdomain } = res.data;
      
      const domainSuffix = window.location.hostname.includes('localhost')
        ? 'localhost:5173'
        : window.location.hostname;
        
      const url = `http://${subdomain}.${domainSuffix}/login?token=${token}`;
      toast.success('Membuka dashboard tenant...', { id: 'impersonate' });
      window.open(url, '_blank');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Gagal login sebagai tenant', { id: 'impersonate' });
    }
  };

  const confirmKillSwitch = (t: Tenant) => {
    setTargetTenant(t);
    if (t.status === 'ACTIVE' || t.status === 'TRIAL') {
      setSuspendReason('');
      setSuspendModalOpen(true); // Open modal for reason
    } else {
      // Just restore directly via confirm
      if (confirm(`Apakah Anda yakin ingin mengaktifkan kembali tenant ${t.name}?`)) {
        executeKillSwitch();
      }
    }
  };

  const openEditModal = (t: Tenant) => {
    setEditingTenant(t);
    setFormData({
      name: t.name,
      subdomain: t.subdomain,
      themeMode: t.themeMode,
      primaryColor: t.primaryColor,
      status: t.status
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingTenant(null);
    setFormData({ name: '', subdomain: '', themeMode: 'dark', primaryColor: '#8B5CF6', status: 'ACTIVE' });
    setIsModalOpen(true);
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">Manajemen Tenant</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Kelola data toko, subdomain, dan status akun klien.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)] transition-colors font-semibold shadow-lg shadow-[var(--accent-primary)]/20"
        >
          <Plus size={18} /> Tambah Tenant
        </button>
      </div>

      <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl flex flex-col">
        <div className="p-4 border-b border-[var(--border)] flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={16} />
            <input
              type="text" placeholder="Cari nama atau subdomain..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] text-sm outline-none focus:border-[var(--accent-primary)]"
              value={search} onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <CustomSelect
              value={statusFilter}
              onChange={(val) => setStatusFilter(String(val))}
              options={[
                { value: '', label: 'Semua Status' },
                { value: 'ACTIVE', label: 'Aktif' },
                { value: 'TRIAL', label: 'Trial (24 Jam)' },
                { value: 'SUSPENDED', label: 'Suspended' }
              ]}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="text-[var(--text-secondary)] bg-[var(--bg-main)]/50 text-xs uppercase tracking-wider border-b border-[var(--border)]">
                <th className="p-4 font-semibold">Toko & Subdomain</th>
                <th className="p-4 font-semibold text-center">Status</th>
                <th className="p-4 font-semibold text-center">Paket</th>
                <th className="p-4 font-semibold text-center">Penggunaan</th>
                <th className="p-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[var(--text-secondary)]">Memuat data...</td>
                </tr>
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[var(--text-secondary)]">Tidak ada tenant ditemukan.</td>
                </tr>
              ) : (
                tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-[var(--bg-main)] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--bg-main)] flex items-center justify-center border border-[var(--border)]">
                          <Building2 size={18} className="text-[var(--accent-primary)]" />
                        </div>
                        <div>
                          <p className="font-bold text-[var(--text-primary)]">{t.name}</p>
                          <a href={`http://${t.subdomain}.lazeepos.com`} target="_blank" rel="noreferrer" className="text-xs text-[var(--accent-primary)] hover:underline font-mono">
                            {t.subdomain}.lazeepos.com
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold border uppercase ${
                        t.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        t.status === 'TRIAL' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        t.status === 'SUSPENDED' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-4 text-center font-medium text-[var(--text-secondary)]">
                      {t.subscription?.plan?.name || 'Belum Berlangganan'}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-3 text-xs text-[var(--text-secondary)]">
                        <span title="Pengguna"><Users size={14} className="inline mr-1"/>{t._count.users}</span>
                        <span title="Produk"><Package size={14} className="inline mr-1"/>{t._count.products}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(t)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary-transparent)] rounded-lg transition-colors" title="Edit">
                          <Edit2 size={16} />
                        </button>
                        {t.status === 'TRIAL' && (
                          <button onClick={async () => {
                            if(confirm(`Setujui dan aktifkan permanen tenant ${t.name}?`)) {
                              try {
                                await api.put(`/central/tenants/${t.id}`, { status: 'ACTIVE' });
                                toast.success('Tenant berhasil diaktifkan secara permanen');
                                fetchTenants();
                              } catch(e) {
                                toast.error('Gagal menyetujui tenant');
                              }
                            }
                          }} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors" title="Aktivasi Permanen (Approve)">
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                        <button onClick={() => confirmKillSwitch(t)} className={`p-2 rounded-lg transition-colors ${
                          t.status === 'ACTIVE' || t.status === 'TRIAL' ? 'text-[var(--danger)] hover:bg-[var(--danger)]/10' : 'text-[var(--success)] hover:bg-[var(--success)]/10'
                        }`} title={t.status === 'ACTIVE' || t.status === 'TRIAL' ? 'Suspend' : 'Restore'}>
                          {t.status === 'ACTIVE' || t.status === 'TRIAL' ? <Ban size={16} /> : <CheckCircle2 size={16} />}
                        </button>
                        <button onClick={() => handleImpersonate(t.id)} className="p-2 text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-colors" title="Login Sebagai Tenant">
                          <LogIn size={16} />
                        </button>
                        <Link to={`/central/tenants/${t.id}`} className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary-transparent)] rounded-lg transition-colors flex items-center gap-1 font-semibold text-xs ml-2">
                          Detail <ChevronRight size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-[var(--border)] flex justify-between items-center">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-sm disabled:opacity-50">Sebelumnnya</button>
            <span className="text-sm text-[var(--text-secondary)]">Halaman {page} dari {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-sm disabled:opacity-50">Selanjutnya</button>
          </div>
        )}
      </div>

      {/* Edit/Create Tenant Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTenant ? 'Edit Tenant' : 'Tambah Tenant Baru'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Nama Toko</label>
            <input required type="text" className="w-full px-4 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none" 
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Subdomain</label>
            <div className="flex">
              <input required type="text" className="w-full px-4 py-2 rounded-l-xl bg-[var(--bg-main)] border border-[var(--border)] border-r-0 text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none font-mono" 
                value={formData.subdomain} onChange={e => setFormData({...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                disabled={!!editingTenant}
              />
              <span className="px-3 py-2 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-r-xl text-[var(--text-secondary)] font-mono flex items-center">.lazeepos.com</span>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Warna Aksen</label>
              <input type="color" className="w-full h-10 rounded-xl cursor-pointer" 
                value={formData.primaryColor} onChange={e => setFormData({...formData, primaryColor: e.target.value})} 
              />
            </div>
            {editingTenant && (
              <div className="flex-1">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Status</label>
                <CustomSelect
                  value={formData.status}
                  onChange={(val) => setFormData({...formData, status: String(val)})}
                  disabled={true}
                  options={[
                    { value: 'ACTIVE', label: 'Active' },
                    { value: 'TRIAL', label: 'Trial' },
                    { value: 'SUSPENDED', label: 'Suspended' }
                  ]}
                />
                <p className="text-[10px] text-[var(--text-secondary)] mt-1">Gunakan tombol Suspend/Restore untuk ubah status.</p>
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-main)] text-sm font-medium transition-colors">Batal</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 rounded-xl bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)] text-sm font-medium transition-colors flex items-center gap-2">
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Kill Switch Modal */}
      <Modal isOpen={suspendModalOpen} onClose={() => setSuspendModalOpen(false)} title="Suspend Tenant">
        <form onSubmit={executeKillSwitch} className="flex flex-col gap-4">
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
            <p className="text-sm font-bold flex items-center gap-2 mb-1"><ShieldAlert size={16}/> Peringatan Suspend</p>
            <p className="text-xs">Toko <strong>{targetTenant?.name}</strong> dan seluruh staf kasirnya tidak akan bisa mengakses aplikasi sampai status diaktifkan kembali.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Alasan Penangguhan</label>
            <textarea required rows={3} className="w-full px-4 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none resize-none" 
              value={suspendReason} onChange={e => setSuspendReason(e.target.value)} placeholder="Contoh: Menunggak pembayaran tagihan selama 2 bulan."
            />
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setSuspendModalOpen(false)} className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-main)] text-sm font-medium transition-colors">Batal</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 rounded-xl bg-[var(--danger)] text-white hover:bg-red-600 text-sm font-bold transition-colors">
              {submitting ? 'Mengeksekusi...' : 'Suspend Sekarang'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
