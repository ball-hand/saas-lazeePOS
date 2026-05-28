import { useEffect, useState } from 'react';
import { Users as UsersIcon, UserPlus, Shield, CheckCircle2, XCircle, Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { Modal } from '../components/Modal';
import { Breadcrumb } from '../components/shared/Breadcrumb';
import { CustomSelect } from '../components/shared/CustomSelect';
import { useAuth } from '../context/AuthContext';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'kasir',
    isActive: true
  });
  
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data.users);
    } catch (err: any) {
      toast.error('Gagal memuat daftar pengguna');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', email: '', password: '', role: 'kasir', isActive: true });
    setIsModalOpen(true);
  };

  const openEditModal = (u: User) => {
    setEditingId(u.id);
    setFormData({ 
      name: u.name || '', 
      email: u.email, 
      password: '', // blank password unless changing
      role: u.role, 
      isActive: u.isActive 
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/users/${editingId}`, formData);
        toast.success('Pengguna berhasil diperbarui');
      } else {
        await api.post('/users', formData);
        toast.success('Pengguna berhasil ditambahkan');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data pengguna');
    }
  };

  const handleDelete = async (id: string, role: string) => {
    if (role === 'admin' && users.filter(u => u.role === 'admin' && u.isActive).length <= 1) {
      return toast.error('Toko harus memiliki minimal satu admin.');
    }
    
    if (window.confirm('Apakah Anda yakin ingin menonaktifkan akun ini?')) {
      try {
        await api.delete(`/users/${id}`);
        toast.success('Akun berhasil dinonaktifkan');
        fetchUsers();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Gagal menonaktifkan akun');
      }
    }
  };

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <Breadcrumb items={[{ label: 'Toko & Transaksi' }, { label: 'Manajemen Staf' }]} />
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          <UserPlus size={18} /> Tambah Staf
        </button>
      </div>

      {/* List */}
      <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl flex-1 flex flex-col min-h-0 overflow-hidden shadow-sm">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 bg-[var(--bg-surface-elevated)] z-10 shadow-sm">
              <tr className="text-[var(--text-secondary)] border-b border-[var(--border)] text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold w-1/3">Informasi Akun</th>
                <th className="p-4 font-semibold">Peran (Role)</th>
                <th className="p-4 font-semibold text-center">Status</th>
                <th className="p-4 font-semibold">Terakhir Login</th>
                <th className="p-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-5 text-center text-[var(--text-secondary)]">Memuat data...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-5 text-center text-[var(--text-secondary)]">Tidak ada pengguna ditemukan.</td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-[var(--bg-main)]/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[var(--accent-primary-transparent)] flex items-center justify-center text-[var(--accent-primary)] font-bold uppercase text-lg border border-[var(--accent-primary)]/20">
                          {u.name?.charAt(0) || u.email.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-[var(--text-primary)]">
                            {u.name || 'Tanpa Nama'} {u.id === currentUser?.id && <span className="ml-2 text-[10px] bg-blue-500/20 text-blue-500 px-2 py-0.5 rounded-full">(Anda)</span>}
                          </p>
                          <p className="text-xs text-[var(--text-secondary)]">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {u.role === 'admin' ? <Shield size={16} className="text-indigo-500" /> : <UsersIcon size={16} className="text-gray-400" />}
                        <span className="font-semibold text-sm text-[var(--text-primary)] capitalize">
                          {u.role}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                        u.isActive 
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                          : 'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>
                        {u.isActive ? <CheckCircle2 size={12}/> : <XCircle size={12}/>}
                        {u.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-[var(--text-secondary)] font-medium">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('id-ID') : 'Belum pernah'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditModal(u)} className="p-2 bg-[var(--bg-main)] hover:bg-blue-500/10 text-[var(--text-secondary)] hover:text-blue-500 rounded-lg border border-[var(--border)] transition-colors">
                          <Edit2 size={16} />
                        </button>
                        {u.id !== currentUser?.id && (
                          <button onClick={() => handleDelete(u.id, u.role)} className="p-2 bg-[var(--bg-main)] hover:bg-red-500/10 text-[var(--text-secondary)] hover:text-red-500 rounded-lg border border-[var(--border)] transition-colors">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Staf' : 'Tambah Staf Baru'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Nama Lengkap</label>
            <input
              type="text" required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2.5 bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl focus:border-[var(--accent-primary)] outline-none"
              placeholder="Cth: Budi Santoso"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Alamat Email</label>
            <input
              type="email" required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-2.5 bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl focus:border-[var(--accent-primary)] outline-none"
              placeholder="Cth: budi@toko.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">
              Password {editingId && <span className="text-xs font-normal text-[var(--text-secondary)]">(Kosongkan jika tidak ingin diubah)</span>}
            </label>
            <input
              type="password" required={!editingId} minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full p-2.5 bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl focus:border-[var(--accent-primary)] outline-none"
              placeholder="Minimal 6 karakter"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Peran (Role)</label>
              <CustomSelect
                value={formData.role}
                onChange={(val) => setFormData({ ...formData, role: String(val) })}
                options={[
                  { value: 'kasir', label: 'Kasir' },
                  { value: 'admin', label: 'Admin Toko' }
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Status Akun</label>
              <CustomSelect
                value={formData.isActive ? 'true' : 'false'}
                onChange={(val) => setFormData({ ...formData, isActive: val === 'true' })}
                options={[
                  { value: 'true', label: 'Aktif (Bisa Login)' },
                  { value: 'false', label: 'Nonaktif' }
                ]}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl hover:bg-[var(--border)] font-bold text-sm transition-colors">
              Batal
            </button>
            <button type="submit" className="px-5 py-2.5 bg-[var(--accent-primary)] text-white font-bold rounded-xl hover:bg-[var(--accent-hover)] shadow-md text-sm transition-colors">
              {editingId ? 'Simpan Perubahan' : 'Buat Akun'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
