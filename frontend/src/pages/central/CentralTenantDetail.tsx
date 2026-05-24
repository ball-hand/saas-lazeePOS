import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Building2, CreditCard, Users, Package,
  DollarSign, Clock, ShieldAlert, CheckCircle2, History,
  LogOut, Activity, Database
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

/* ───────────────────────────────────────────── Types */
interface TenantBilling {
  tenant: {
    id: string;
    name: string;
    subdomain: string;
    status: string;
    trialEndsAt: string | null;
    suspendedAt: string | null;
    suspendedReason: string | null;
  };
  subscription: {
    plan: {
      name: string;
      monthlyPrice: number;
      maxProducts: number;
      maxUsers: number;
    };
    currentPeriodEnd: string | null;
  } | null;
  activeUsers: number;
  productCount: number;
  lifetimeRevenue: number;
  totalTransactions: number;
  recentPayments: Array<{
    id: string;
    amount: number;
    status: string;
    paidAt: string;
    billingCycle: string;
  }>;
}

export function CentralTenantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth(); // We might need a direct way to swap tokens if we implement impersonate properly
  
  const [data, setData] = useState<TenantBilling | null>(null);
  const [loading, setLoading] = useState(true);
  const [impersonating, setImpersonating] = useState(false);

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const res = await api.get(`/central/tenants/${id}/billing`);
        setData(res.data);
      } catch {
        toast.error('Gagal memuat detail tenant.');
        navigate('/central/tenants');
      } finally {
        setLoading(false);
      }
    };
    fetchBilling();
  }, [id, navigate]);

  const handleImpersonate = async () => {
    if (!confirm(`Peringatan: Anda akan masuk ke akun ${data?.tenant.name} sebagai Admin. Lanjutkan?`)) return;
    
    setImpersonating(true);
    try {
      const res = await api.post(`/central/tenants/${id}/impersonate`);
      const { token, user } = res.data;
      
      // Simpan token super admin saat ini sebelum di-swap
      const superToken = localStorage.getItem('token');
      if (superToken) localStorage.setItem('superToken_backup', superToken);

      // Login sebagai tenant
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Hard reload to reset all app states and routing
      window.location.href = '/dashboard';
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal masuk sebagai tenant.');
      setImpersonating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--accent-primary)]" />
      </div>
    );
  }

  if (!data) return null;

  const { tenant, subscription, activeUsers, productCount, lifetimeRevenue, totalTransactions, recentPayments } = data;

  return (
    <div className="animate-fade-in flex flex-col gap-6 pb-10">
      
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center gap-4 border-b border-[var(--border)] pb-6">
        <Link to="/central/tenants" className="p-2 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)] flex items-center gap-3">
            {tenant.name}
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
              tenant.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
              tenant.status === 'SUSPENDED' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
              'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              {tenant.status}
            </span>
          </h1>
          <p className="text-[var(--text-secondary)] text-sm font-mono mt-1">{tenant.subdomain}.lazeepos.com</p>
        </div>
        <button
          onClick={handleImpersonate}
          disabled={impersonating}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-main)] border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 transition-colors font-bold text-sm shadow-sm"
        >
          <LogOut size={16} /> {impersonating ? 'Memuat...' : 'Login as Admin'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ── Left Column: Usage & Storage ───────────────────── */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Subscription Info */}
          <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-5">
            <h2 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4 flex items-center gap-2">
              <CreditCard size={16}/> Paket Langganan
            </h2>
            <div className="mb-4">
              <p className="text-2xl font-extrabold text-[var(--text-primary)]">{subscription?.plan?.name || 'Free / Trial'}</p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Rp {subscription?.plan?.monthlyPrice.toLocaleString('id-ID') || '0'} / bulan
              </p>
            </div>
            {subscription?.currentPeriodEnd && (
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] bg-[var(--bg-main)] p-3 rounded-xl border border-[var(--border)]">
                <Clock size={16} className="text-amber-400"/> Berakhir: {new Date(subscription.currentPeriodEnd).toLocaleDateString('id-ID')}
              </div>
            )}
            {tenant.status === 'SUSPENDED' && (
              <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                <p className="font-bold mb-1 flex items-center gap-1"><ShieldAlert size={14}/> Tersuspend Pada {new Date(tenant.suspendedAt || '').toLocaleDateString('id-ID')}</p>
                <p>{tenant.suspendedReason || 'Tidak ada alasan.'}</p>
              </div>
            )}
          </div>

          {/* Database Usage */}
          <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-5">
            <h2 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Database size={16}/> Penggunaan Penyimpanan
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--text-secondary)] flex items-center gap-1"><Users size={14}/> Pengguna</span>
                  <span className="font-bold text-[var(--text-primary)]">{activeUsers} <span className="text-[var(--text-secondary)] font-normal">/ {subscription?.plan?.maxUsers || '∞'}</span></span>
                </div>
                <div className="h-2 w-full bg-[var(--bg-main)] rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (activeUsers / (subscription?.plan?.maxUsers || 100)) * 100)}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--text-secondary)] flex items-center gap-1"><Package size={14}/> Produk / Item</span>
                  <span className="font-bold text-[var(--text-primary)]">{productCount} <span className="text-[var(--text-secondary)] font-normal">/ {subscription?.plan?.maxProducts || '∞'}</span></span>
                </div>
                <div className="h-2 w-full bg-[var(--bg-main)] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (productCount / (subscription?.plan?.maxProducts || 1000)) * 100)}%` }}></div>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--text-secondary)] flex items-center gap-1"><Activity size={14}/> Volume Transaksi</span>
                  <span className="font-bold text-[var(--text-primary)]">{totalTransactions} trx</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column: Lifetime Revenue & Billing History ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Lifetime GMV (Pendapatan Kotor Tenant)</p>
              <p className="text-3xl font-extrabold text-[var(--text-primary)]">Rp {lifetimeRevenue.toLocaleString('id-ID')}</p>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign size={28} />
            </div>
          </div>

          <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl flex-1 flex flex-col">
            <div className="p-5 border-b border-[var(--border)]">
              <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <History size={18}/> Riwayat Pembayaran Tagihan SaaS
              </h2>
            </div>
            
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[var(--text-secondary)] bg-[var(--bg-main)]/50 text-xs uppercase tracking-wider border-b border-[var(--border)]">
                    <th className="p-4 font-semibold">Tanggal</th>
                    <th className="p-4 font-semibold">Siklus</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-sm">
                  {recentPayments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-[var(--text-secondary)]">Belum ada riwayat pembayaran.</td>
                    </tr>
                  ) : (
                    recentPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-[var(--bg-main)] transition-colors">
                        <td className="p-4 font-medium text-[var(--text-primary)]">
                          {p.paidAt ? new Date(p.paidAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                        </td>
                        <td className="p-4 text-[var(--text-secondary)] capitalize">{p.billingCycle}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                            p.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                            'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-4 text-right font-bold text-[var(--text-primary)]">
                          Rp {p.amount.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
