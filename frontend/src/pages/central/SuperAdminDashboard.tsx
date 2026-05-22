// frontend/src/pages/central/SuperAdminDashboard.tsx
import { useEffect, useState } from 'react';
import {
  Building2, CreditCard, DollarSign, Users, Package,
  ArrowUpRight, TrendingUp, ChevronRight, Search, RefreshCw,
  ShieldAlert, CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';

/* ───────────────────────────────────────────── Types */
interface TenantItem {
  id: number;
  name: string;
  subdomain: string;
  status: string;
  _count: { users: number; products: number };
  subscription?: { plan?: { name: string } };
}

interface CentDash {
  totalTenants: number;
  activeTenants: number;
  inactiveTenants: number;
  totalUserAccounts: number;
  totalProducts: number;
  mrr: { value: string; currency: string };
  mtdRevenue: { value: string; currency: string };
  mtdTransactions: number;
  newTenantsMonth: number;
  trialTenants: number;
  suspendedTenants: number;
  lowStockCount: number;
  topTenants: TenantItem[];
}

/* ───────────────────────────────────────────── Helpers */
const fmt = (val: string) => {
  const n = parseFloat(val);
  if (Math.abs(n) >= 1e6) return `Rp ${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `Rp ${(n / 1e3).toFixed(1)}K`;
  return `Rp ${n.toLocaleString('id-ID')}`;
};

const statusMeta: Record<string, { label: string; cls: string }> = {
  active:    { label: 'Aktif',     cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  suspended: { label: 'Suspended', cls: 'bg-red-500/10 text-red-400 border-red-500/20'           },
  trial:     { label: 'Trial',     cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20'         },
  cancelled: { label: 'Dibatalkan',cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20'          },
};

/* ───────────────────────────────────────────── Component */
export function SuperAdminDashboard() {
  const [dash, setDash]   = useState<CentDash | null>(null);
  const [loading, setLet] = useState(true);
  const [query, setQuery] = useState('');
  const [spinning, setSpinning] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/central/dashboard');
      setDash(data);
    } catch {
      toast.error('Gagal memuat dasbor pusat.');
    } finally {
      setLet(false);
      setSpinning(false);
    }
  };

  useEffect(() => { load(); }, []);

  const refresh = () => { setSpinning(true); load(); };

  const shown = (dash?.topTenants ?? []).filter((t) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return t.name.toLowerCase().includes(q)
        || t.subdomain.toLowerCase().includes(q)
        || t.status.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--accent-primary)]" />
      </div>
    );
  }

  if (!dash) return null;

  return (
    <div className="animate-fade-in flex flex-col gap-8 pb-10">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-wider mb-2 border border-red-500/20">
            <ShieldAlert size={14}/> Super Admin Central
          </span>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Kelola Tenant Lazee POS</h1>
          <p className="text-[var(--text-secondary)] mt-1 font-medium">
            Pantau pertumbuhan SaaS, status langganan, dan operasional seluruh toko.
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={spinning}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-main)] hover:text-[var(--text-primary)] transition-all"
        >
          <RefreshCw size={14} className={spinning ? 'animate-spin' : ''} />
          Segarkan
        </button>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { icon: <Building2 size={22}/>, label: 'Total Tenant',  val: dash.totalTenants,    sub: `+${dash.newTenantsMonth} bulan ini`,        bg: 'bg-blue-500/10',    tc: 'text-blue-400'    },
          { icon: <CreditCard size={22}/>, label: 'MRR',          val: fmt(dash.mrr.value), sub: 'Pendapatan berulang bulanan',               bg: 'bg-emerald-500/10', tc: 'text-emerald-400' },
          { icon: <DollarSign size={22}/>, label: 'Revenue Bulan Ini', val: fmt(dash.mtdRevenue.value), sub: `${dash.mtdTransactions} transaksi`, bg: 'bg-purple-500/10', tc: 'text-purple-400'  },
          { icon: <CheckCircle2 size={22}/>, label: 'Tenant Aktif', val: dash.activeTenants, sub: `dari ${dash.totalTenants} total`,           bg: 'bg-amber-500/10',   tc: 'text-amber-400'   },
        ].map((m, i) => (
          <div key={i} className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--accent-primary)]/30 transition-all">
            <div className="flex justify-between items-start mb-3">
              <div className={`p-2.5 rounded-xl ${m.bg} ${m.tc}`}>{m.icon}</div>
              <ArrowUpRight size={16} className="text-[var(--text-secondary)]" />
            </div>
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">{m.label}</p>
            <p className="text-2xl font-extrabold text-[var(--text-primary)] mt-1">{m.val}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Secondary Stats ────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Pengguna',       val: dash.totalUserAccounts, icon: <Users size={16}/>      },
          { label: 'Produk',         val: dash.totalProducts,      icon: <Package size={16}/>    },
          { label: 'Trial',          val: dash.trialTenants,       icon: <TrendingUp size={16}/> },
          { label: 'Stok Menipis',   val: dash.lowStockCount,      icon: <Building2 size={16}/>  },
        ].map((s, i) => (
          <div key={i} className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--bg-main)] text-[var(--text-secondary)]">{s.icon}</div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] font-medium">{s.label}</p>
              <p className="text-lg font-bold text-[var(--text-primary)]">{s.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tenant Table ───────────────────────────────────── */}
      <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl flex flex-col">
        <div className="p-5 border-b border-[var(--border)] flex flex-col sm:flex-row justify-between items-center gap-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Daftar Toko Terdaftar</h2>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={16} />
            <input
              type="text" placeholder="Cari nama toko atau subdomain..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] text-sm outline-none focus:border-[var(--accent-primary)]"
              value={query} onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="text-[var(--text-secondary)] bg-[var(--bg-main)]/50 text-xs uppercase tracking-wider border-b border-[var(--border)]">
                <th className="p-4 font-semibold">Informasi Tenant</th>
                <th className="p-4 font-semibold">Subdomain</th>
                <th className="p-4 font-semibold">Paket Langganan</th>
                <th className="p-4 font-semibold text-center">Status</th>
                <th className="p-4 font-semibold text-center">Pengguna &amp; Produk</th>
                <th className="p-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-sm">
              {shown.map((t) => {
                const meta = statusMeta[t.status] ?? statusMeta.active;
                return (
                  <tr key={t.id} className="hover:bg-[var(--bg-main)] transition-colors group">
                    <td className="p-4">
                      <p className="font-bold text-[var(--text-primary)]">{t.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">ID: #{t.id}</p>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-xs bg-[var(--info)]/10 text-[var(--info)] px-2.5 py-1 rounded-lg border border-[var(--info)]/20">
                        {t.subdomain}.lazeepos.com
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-[var(--text-primary)] text-sm">
                      {t.subscription?.plan?.name ?? '—'}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${meta.cls}`}>
                        {/* badge dot */}
                        <span className="w-1.5 h-1.5 rounded-full bg-current"/> {meta.label}
                      </span>
                    </td>
                    <td className="p-4 text-center text-[var(--text-secondary)] text-sm">
                      <Users size={13} className="inline mr-1 opacity-60"/> {t._count.users} · <Package size={13} className="inline mx-1 opacity-60"/> {t._count.products} produk
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => toast('Detail tenant TODO — fitur berikutnya', { duration: 1500 })}
                        className="text-xs font-bold text-[var(--accent-primary)] hover:underline"
                      >
                        Detail <ChevronRight size={12} className="inline" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[var(--text-secondary)] text-sm">
                    Tidak ada toko yang cocok dengan pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
