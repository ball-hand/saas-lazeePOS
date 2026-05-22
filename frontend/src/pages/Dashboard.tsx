import { useEffect, useState } from 'react';
import { DollarSign, ShoppingBag, Package, TrendingUp, Wallet } from 'lucide-react';
// import api from '../api/client'; // Sesuaikan path
import { StatsCard } from '../components/StatsCard'; // Sesuaikan path

export function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulasi Fetch Data (Ganti dengan API aslimu)
    const fetchStats = async () => {
      try {
        // const { data } = await api.get('/dashboard');
        // setStats(data);
        
        // Dummy data sementara untuk preview UI
        setStats({
          todaySalesAmount: 1250.50,
          todaySalesCount: 45,
          monthSalesAmount: 35400.00,
          lowStockCount: 8,
          popularProducts: [
            { id: 1, name: 'Espresso Blend 200g', quantitySold: 120, revenue: 1500 },
            { id: 2, name: 'Premium Matcha Powder', quantitySold: 85, revenue: 850 }
          ],
          recentTransactions: [
            { id: 1, type: 'sale', description: 'POS Sale #INV-001', amount: 45.00, transactionDate: new Date() },
            { id: 2, type: 'expense', description: 'Restock Gelas Cup', amount: 120.00, transactionDate: new Date() }
          ]
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse p-4">
        <div className="h-8 bg-[var(--bg-surface-elevated)] w-1/4 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-[var(--bg-surface-elevated)] rounded-2xl"></div>)}
        </div>
      </div>
    );
  }
  
  if (!stats) return <div className="text-[var(--danger)]">Failed to load dashboard</div>;

  return (
    <div className="animate-fade-in flex flex-col gap-8 pb-10">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Ringkasan Dasbor</h1>
        <p className="text-[var(--text-secondary)] mt-1 font-medium">Pantau performa dan aktivitas tokomu hari ini.</p>
      </div>

      {/* Grid Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Penjualan Hari Ini"
          value={`$${parseFloat(stats.todaySalesAmount).toFixed(2)}`}
          icon={<DollarSign size={20} />}
          iconColorClass="text-[var(--success)]"
          iconBgClass="bg-[var(--success)]/10"
          trend={{ value: 12, label: 'vs kemarin' }}
        />
        <StatsCard
          title="Total Transaksi (Hari Ini)"
          value={stats.todaySalesCount}
          icon={<ShoppingBag size={20} />}
          iconColorClass="text-[var(--accent-primary)]"
          iconBgClass="bg-[var(--accent-primary-transparent)]"
        />
        <StatsCard
          title="Pendapatan Bulanan"
          value={`$${parseFloat(stats.monthSalesAmount).toFixed(2)}`}
          icon={<TrendingUp size={20} />}
          iconColorClass="text-[var(--info)]"
          iconBgClass="bg-[var(--info)]/10"
        />
        <StatsCard
          title="Peringatan Stok Tipis"
          value={stats.lowStockCount}
          icon={<Package size={20} />}
          iconColorClass="text-[var(--warning)]"
          iconBgClass="bg-[var(--warning)]/10"
        />
      </div>

      {/* Section Bawah (Tabel & List) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Popular Products */}
        <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-5 flex items-center gap-2">
            Produk Terlaris Bulan Ini
          </h2>
          <div className="overflow-x-auto custom-scrollbar -mx-6 px-6">
            <table className="w-full text-left min-w-[400px]">
              <thead>
                <tr className="text-[var(--text-secondary)] border-b border-[var(--border)] text-sm uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Produk</th>
                  <th className="pb-3 font-semibold text-center">Terjual</th>
                  <th className="pb-3 font-semibold text-right">Pendapatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {stats.popularProducts.map((p: any) => (
                  <tr key={p.id} className="hover:bg-[var(--bg-main)] transition-colors group">
                    <td className="py-4 font-semibold text-[var(--text-primary)]">{p.name}</td>
                    <td className="py-4 text-[var(--text-primary)] text-center font-medium">
                      <span className="bg-[var(--bg-main)] px-3 py-1 rounded-full border border-[var(--border)]">{p.quantitySold}</span>
                    </td>
                    <td className="py-4 text-[var(--success)] font-bold text-right">${parseFloat(p.revenue).toFixed(2)}</td>
                  </tr>
                ))}
                {stats.popularProducts.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center text-[var(--text-secondary)] py-8 font-medium">Belum ada data penjualan</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-5 flex items-center gap-2">
            Transaksi Terakhir
          </h2>
          <div className="flex flex-col gap-3 flex-1 overflow-y-auto custom-scrollbar pr-2 max-h-[400px]">
            {stats.recentTransactions.map((t: any) => {
              const isSale = t.type === 'sale';
              const isExpense = t.type === 'expense';
              return (
                <div key={t.id} className="flex justify-between items-center p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-main)] hover:border-[var(--accent-primary)]/40 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                      isSale ? 'bg-[var(--success)]/10 text-[var(--success)]' :
                      isExpense ? 'bg-[var(--danger)]/10 text-[var(--danger)]' :
                      'bg-[var(--info)]/10 text-[var(--info)]'
                    }`}>
                      {isSale ? <DollarSign size={20} /> :
                       isExpense ? <TrendingUp size={20} className="rotate-180" /> :
                       <Wallet size={20} />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[var(--text-primary)] capitalize">{t.type}</p>
                      <p className="text-xs text-[var(--text-secondary)] truncate max-w-[180px] sm:max-w-[250px] mt-0.5">{t.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-base ${isExpense ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>
                      {isExpense ? '-' : '+'}${parseFloat(t.amount).toFixed(2)}
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)] font-medium mt-0.5">
                      {new Date(t.transactionDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
            {stats.recentTransactions.length === 0 && (
              <p className="text-center text-[var(--text-secondary)] py-8 font-medium">Tidak ada transaksi terbaru</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}