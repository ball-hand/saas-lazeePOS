import { useEffect, useState } from 'react';
import {
  Building2, CreditCard, Users, TrendingUp, RefreshCw,
  ShieldAlert, CheckCircle2, DollarSign, Activity, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';

/* ───────────────────────────────────────────── Types */
interface AnalyticsData {
  metrics: {
    mrr: {
      value: number;
      byPlan: Array<{ planName: string; monthlyPrice: number; subscriberCount: number; revenue: number }>;
    };
    mtdRevenue: {
      value: number;
      momGrowth: number;
    };
    lifetimeRevenue: {
      value: number;
    };
  };
  tenants: {
    total: number;
    active: number;
    trial: number;
    suspended: number;
  };
  activeOutlets: number;
  churnRate: {
    value: number;
    churned: number;
  };
  periodStart: string;
  periodEnd: string;
}

/* ───────────────────────────────────────────── Helpers */
const fmt = (val: number) => {
  if (Math.abs(val) >= 1e9) return `Rp ${(val / 1e9).toFixed(1)}B`;
  if (Math.abs(val) >= 1e6) return `Rp ${(val / 1e6).toFixed(1)}M`;
  if (Math.abs(val) >= 1e3) return `Rp ${(val / 1e3).toFixed(1)}K`;
  return `Rp ${val.toLocaleString('id-ID')}`;
};

export function CentralDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);

  const load = async () => {
    try {
      const res = await api.get('/central/analytics');
      setData(res.data);
    } catch {
      toast.error('Gagal memuat analitik SaaS.');
    } finally {
      setLoading(false);
      setSpinning(false);
    }
  };

  useEffect(() => { load(); }, []);

  const refresh = () => { setSpinning(true); load(); };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--accent-primary)]" />
      </div>
    );
  }

  if (!data) return null;

  const { metrics, tenants, churnRate, activeOutlets } = data;

  return (
    <div className="animate-fade-in flex flex-col gap-8 pb-10">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-wider mb-2 border border-red-500/20">
            <ShieldAlert size={14}/> Super Admin Central
          </span>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">SaaS Analytics</h1>
          <p className="text-[var(--text-secondary)] mt-1 font-medium">
            Pantau pertumbuhan, pendapatan, dan retensi pelanggan.
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

      {/* ── Primary Financial KPIs ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--accent-primary)]/30 transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-[var(--accent-primary)]"><DollarSign size={80} className="-mr-4 -mt-4"/></div>
          <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Monthly Recurring Revenue</p>
          <p className="text-3xl font-extrabold text-[var(--text-primary)]">{fmt(metrics.mrr.value)}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-2">Total pendapatan berlangganan</p>
        </div>

        <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--accent-primary)]/30 transition-all">
          <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Pendapatan Bulan Ini</p>
          <p className="text-3xl font-extrabold text-[var(--text-primary)]">{fmt(metrics.mtdRevenue.value)}</p>
          <p className={`text-xs mt-2 font-bold ${metrics.mtdRevenue.momGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {metrics.mtdRevenue.momGrowth >= 0 ? '+' : ''}{metrics.mtdRevenue.momGrowth}% dibanding bulan lalu
          </p>
        </div>

        <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--accent-primary)]/30 transition-all">
          <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Churn Rate</p>
          <p className="text-3xl font-extrabold text-[var(--text-primary)]">{churnRate.value}%</p>
          <p className="text-xs text-[var(--text-secondary)] mt-2">{churnRate.churned} toko membatalkan bulan ini</p>
        </div>

        <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--accent-primary)]/30 transition-all">
          <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Lifetime Revenue</p>
          <p className="text-3xl font-extrabold text-[var(--text-primary)]">{fmt(metrics.lifetimeRevenue.value)}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-2">Total GMV seluruh tenant</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ── Tenant Stats ──────────────────────────────────────── */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2"><Building2 size={18}/> Status Toko</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-xl p-4">
              <p className="text-xs text-[var(--text-secondary)] font-medium">Total Toko</p>
              <p className="text-xl font-bold text-[var(--text-primary)] mt-1">{tenants.total}</p>
            </div>
            <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-xl p-4">
              <p className="text-xs text-[var(--text-secondary)] font-medium">Toko Aktif</p>
              <p className="text-xl font-bold text-amber-400 mt-1">{tenants.active}</p>
            </div>
            <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-xl p-4">
              <p className="text-xs text-[var(--text-secondary)] font-medium">Sedang Trial</p>
              <p className="text-xl font-bold text-purple-400 mt-1">{tenants.trial}</p>
            </div>
            <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-xl p-4">
              <p className="text-xs text-[var(--text-secondary)] font-medium">Suspended</p>
              <p className="text-xl font-bold text-red-400 mt-1">{tenants.suspended}</p>
            </div>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mt-2 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 rounded-lg text-emerald-400"><Activity size={24}/></div>
            <div>
              <p className="text-emerald-400 font-bold text-lg">{activeOutlets} Active Outlets</p>
              <p className="text-emerald-500/80 text-xs mt-0.5">Memiliki transaksi dalam 30 hari terakhir</p>
            </div>
          </div>
        </div>

        {/* ── MRR By Plan ──────────────────────────────────────── */}
        <div className="lg:col-span-2 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-6">
          <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border)] pb-4 mb-4">
            <CreditCard size={18}/> Kontribusi MRR Berdasarkan Paket
          </h2>
          
          <div className="flex flex-col gap-4">
            {metrics.mrr.byPlan.map((plan, i) => {
              const percentage = metrics.mrr.value > 0 ? (plan.revenue / metrics.mrr.value) * 100 : 0;
              return (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-1/3">
                    <p className="font-bold text-[var(--text-primary)] text-sm">{plan.planName}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{plan.subscriberCount} Subscribers</p>
                  </div>
                  <div className="flex-1">
                    <div className="h-3 w-full bg-[var(--bg-main)] rounded-full overflow-hidden border border-[var(--border)]">
                      <div className="h-full bg-[var(--accent-gradient)] rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                  <div className="w-1/4 text-right">
                    <p className="font-bold text-[var(--text-primary)] text-sm">{fmt(plan.revenue)}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{percentage.toFixed(1)}%</p>
                  </div>
                </div>
              );
            })}
            {metrics.mrr.byPlan.length === 0 && (
              <p className="text-sm text-[var(--text-secondary)] text-center py-4">Belum ada paket langganan berbayar yang aktif.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
