import { useEffect, useState } from 'react';
import { Search, Receipt, DollarSign, ArrowUpRight, CheckCircle2, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { Link } from 'react-router-dom';
import { CustomSelect } from '../../components/shared/CustomSelect';
import { Breadcrumb } from '../../components/shared/Breadcrumb';
import { Pagination } from '../../components/shared/Pagination';

interface Transaction {
  id: string;
  orderId: string;
  amount: number;
  status: string;
  billingCycle: string;
  paymentType: string | null;
  createdAt: string;
  paidAt: string | null;
  tenant: {
    name: string;
    subdomain: string;
    status: string;
  };
  plan: {
    name: string;
  };
}

export function CentralBilling() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/central/billing/invoices', {
        params: { search, status: statusFilter, page, limit: 15 }
      });
      setTransactions(res.data.transactions);
      setTotalPages(res.data.totalPages);
      setTotalRevenue(res.data.totalRevenue);
    } catch (err) {
      toast.error('Gagal memuat log tagihan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(fetchInvoices, 300);
    return () => clearTimeout(delay);
  }, [search, statusFilter, page]);

  return (
    <div className="relative bg-[var(--bg-surface-elevated)] rounded-2xl border border-[var(--border)] shadow-sm min-h-[80vh] flex flex-col overflow-hidden animate-fade-in">
      {/* Subtle Dot Pattern Background */}
      <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--text-primary) 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
      
      {/* Card Header with Title */}
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--border)] p-6 bg-[var(--bg-surface-elevated)]">
        <div>
          <div className="flex items-center gap-3">
            <Receipt className="text-blue-500" size={24} />
            <Breadcrumb items={[{ label: 'Central Admin' }, { label: 'Log Tagihan SaaS' }]} />
          </div>
          <p className="text-[var(--text-secondary)] mt-2 text-sm font-medium">Pantau seluruh pembayaran masuk dari semua tenant secara real-time.</p>
        </div>
        <div className="bg-[var(--bg-surface-elevated)] border border-emerald-500/20 px-6 py-2.5 rounded-2xl flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--text-secondary)]">Total Pendapatan Sukses</p>
            <p className="text-xl font-extrabold text-[var(--text-primary)]">
              Rp {totalRevenue.toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="relative z-10 p-6 flex-1 flex flex-col">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
          <input
            type="text"
            placeholder="Cari Order ID atau Nama Tenant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-xl focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
          />
        </div>
        <div className="w-full md:w-56">
          <CustomSelect
            value={statusFilter}
            onChange={(val) => setStatusFilter(String(val))}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'settlement', label: 'Settlement (Berhasil)' },
              { value: 'pending', label: 'Pending' },
              { value: 'expire', label: 'Expire / Cancel' }
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl flex-1 flex flex-col min-h-0 overflow-hidden shadow-sm">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 bg-[var(--bg-surface-elevated)] z-10 shadow-sm">
              <tr className="text-[var(--text-secondary)] border-b border-[var(--border)] text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold w-1/4">Order ID & Waktu</th>
                <th className="p-4 font-semibold w-1/4">Tenant</th>
                <th className="p-4 font-semibold">Paket & Siklus</th>
                <th className="p-4 font-semibold text-center">Status</th>
                <th className="p-4 font-semibold text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-5 text-center text-[var(--text-secondary)]">Memuat data...</td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-5 text-center">
                    <div className="flex flex-col items-center justify-center text-[var(--text-secondary)]">
                      <Receipt size={48} className="mb-4 opacity-20" />
                      <p>Tidak ada transaksi ditemukan.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[var(--bg-main)]/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-[var(--text-primary)] font-mono text-sm">{tx.orderId}</div>
                      <div className="text-xs text-[var(--text-secondary)] mt-1 flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(tx.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="p-4">
                      <Link to={`/central/tenants`} className="font-bold text-[var(--text-primary)] hover:text-blue-500 transition-colors flex items-center gap-1 group">
                        {tx.tenant.name}
                        <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                      <div className="text-xs text-[var(--text-secondary)] font-mono mt-0.5">{tx.tenant.subdomain}.lazeepos.com</div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-indigo-400">{tx.plan.name}</div>
                      <div className="text-xs text-[var(--text-secondary)] capitalize">{tx.billingCycle}</div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                        tx.status === 'settlement' || tx.status === 'capture' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        tx.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>
                        {tx.status === 'settlement' || tx.status === 'capture' ? <CheckCircle2 size={12}/> :
                         tx.status === 'pending' ? <Clock size={12}/> : <XCircle size={12}/>}
                        {tx.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-extrabold text-[var(--text-primary)]">
                        Rp {tx.amount.toLocaleString('id-ID')}
                      </div>
                      {tx.paymentType && (
                        <div className="text-[10px] text-[var(--text-secondary)] font-mono mt-1 uppercase">
                          {tx.paymentType.replace('_', ' ')}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-auto pt-6">
          <Pagination 
            currentPage={page} 
            totalPages={totalPages} 
            onPageChange={setPage} 
          />
        </div>
      </div>
      </div>
    </div>
  );
}
