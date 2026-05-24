import { useEffect, useState } from 'react';
import { DollarSign, ShoppingBag, Package, TrendingUp, Wallet, RefreshCw, Crown } from 'lucide-react';
import api from '../api/client';
import { StatsCard } from '../components/StatsCard';
import toast from 'react-hot-toast';

const fmt = (val: number) =>
  'Rp ' + Math.round(val).toLocaleString('id-ID');

export function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/dashboard');
      setStats(data);
    } catch (error: any) {
      toast.error('Gagal memuat dasbor. Coba lagi.');
      console.error('Dashboard fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse p-4">
        <div className="h-8 bg-[var(--bg-surface-elevated)] w-1/4 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-[var(--bg-surface-elevated)] rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="h-64 bg-[var(--bg-surface-elevated)] rounded-2xl" />
          <div className="h-64 bg-[var(--bg-surface-elevated)] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-[var(--danger)] font-semibold">Gagal memuat dasbor.</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 rounded-xl font-bold text-white text-sm flex items-center gap-2"
          style={{ background: 'var(--accent-gradient)' }}
        >
          <RefreshCw size={16} /> Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col gap-8 pb-10">

      {/* Header */}
      <div className="sticky top-[-1rem] z-10 bg-[var(--bg-main)]/80 backdrop-blur-md pb-4 pt-4 -mt-4 mb-2 flex items-start justify-between border-b border-transparent">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Ringkasan Dasbor</h1>
          <p className="text-[var(--text-secondary)] mt-1 font-medium">Pantau performa dan aktivitas tokomu hari ini.</p>
        </div>
        <button
          onClick={fetchStats}
          className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary-transparent)] transition-all border border-[var(--border)]"
          title="Refresh"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Penjualan Hari Ini"
          value={fmt(stats.todaySalesAmount || 0)}
          icon={<DollarSign size={20} />}
          iconColorClass="text-[var(--success)]"
          iconBgClass="bg-[var(--success)]/10"
        />
        <StatsCard
          title="Transaksi Hari Ini"
          value={stats.todaySalesCount || 0}
          icon={<ShoppingBag size={20} />}
          iconColorClass="text-[var(--accent-primary)]"
          iconBgClass="bg-[var(--accent-primary-transparent)]"
        />
        <StatsCard
          title="Pendapatan Bulan Ini"
          value={fmt(stats.monthSalesAmount || 0)}
          icon={<TrendingUp size={20} />}
          iconColorClass="text-[var(--info)]"
          iconBgClass="bg-[var(--info)]/10"
        />
        <StatsCard
          title="Stok Hampir Habis"
          value={stats.lowStockCount || 0}
          icon={<Package size={20} />}
          iconColorClass="text-[var(--warning)]"
          iconBgClass="bg-[var(--warning)]/10"
        />
      </div>

      {/* Bottom Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Popular Products */}
        <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-extrabold text-[var(--text-primary)] mb-5 flex items-center gap-2">
            <Crown size={20} className="text-yellow-500" /> Produk Terlaris Bulan Ini
          </h2>
          <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2 max-h-72">
            {(stats.popularProducts || []).map((p: any, i: number) => {
              // Calculate a simple percentage relative to the top selling product for visual bar
              const maxSold = stats.popularProducts[0]?.quantitySold || 1;
              const percentage = Math.min((p.quantitySold / maxSold) * 100, 100);
              
              return (
                <div key={p.id ?? i} className="flex items-center gap-4 group">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black flex-shrink-0 shadow-sm ${
                    i === 0 ? 'bg-yellow-100 text-yellow-600 border border-yellow-300' :
                    i === 1 ? 'bg-gray-100 text-gray-500 border border-gray-300' :
                    i === 2 ? 'bg-orange-100 text-orange-600 border border-orange-300' :
                    'bg-[var(--bg-main)] text-[var(--text-secondary)] border border-[var(--border)]'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-end mb-1">
                      <p className="font-bold text-[var(--text-primary)] text-sm truncate pr-2">{p.name}</p>
                      <p className="text-[var(--success)] font-extrabold text-sm">{fmt(p.revenue || 0)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-[var(--bg-main)] rounded-full overflow-hidden border border-[var(--border)]">
                        <div 
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ 
                            width: `${percentage}%`,
                            background: i === 0 ? 'linear-gradient(to right, #f59e0b, #fbbf24)' : 'var(--accent-gradient)' 
                          }}
                        />
                      </div>
                      <span className="text-xs font-bold text-[var(--text-secondary)] whitespace-nowrap">
                        {p.quantitySold} terjual
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {(!stats.popularProducts || stats.popularProducts.length === 0) && (
              <div className="flex flex-col items-center justify-center py-10 text-[var(--text-secondary)] opacity-60">
                <Package size={40} className="mb-3 opacity-50" />
                <p className="font-medium text-sm">Belum ada data penjualan</p>
                <p className="text-xs mt-1">Transaksi bulan ini akan muncul di sini</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-5">🕐 Transaksi Terakhir</h2>
          <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar max-h-72 pr-1">
            {(stats.recentTransactions || []).map((t: any) => {
              const isSale = t.type === 'sale' || t.type === 'income';
              const isExpense = t.type === 'expense';
              return (
                <div
                  key={t.id}
                  className="flex justify-between items-center p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-main)] hover:border-[var(--accent-primary)]/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isSale ? 'bg-[var(--success)]/10 text-[var(--success)]' :
                      isExpense ? 'bg-[var(--danger)]/10 text-[var(--danger)]' :
                      'bg-[var(--info)]/10 text-[var(--info)]'
                    }`}>
                      {isSale ? <DollarSign size={18} /> :
                       isExpense ? <TrendingUp size={18} className="rotate-180" /> :
                       <Wallet size={18} />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-[var(--text-primary)] capitalize">{t.type}</p>
                      <p className="text-xs text-[var(--text-secondary)] truncate max-w-[180px] mt-0.5">{t.description}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className={`font-bold text-sm ${isExpense ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>
                      {isExpense ? '-' : '+'}{fmt(parseFloat(t.amount) || 0)}
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                      {new Date(t.transactionDate).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>
              );
            })}
            {(!stats.recentTransactions || stats.recentTransactions.length === 0) && (
              <p className="text-center text-[var(--text-secondary)] py-8 font-medium text-sm">
                Tidak ada transaksi terbaru
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
