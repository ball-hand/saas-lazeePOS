import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, TrendingDown, Plus, Archive } from 'lucide-react';
import { Modal } from "../components/Modal";
import { Breadcrumb } from "../components/shared/Breadcrumb";
import api from "../api/client";
import toast from 'react-hot-toast';

export function CashFlow() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState({ today: { income: 0, expense: 0, net: 0 }, thisMonth: { income: 0, expense: 0, net: 0 } });
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter state
  const [typeFilter, setTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Manual entry modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ type: 'expense', amount: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCashFlow = async () => {
    try {
      const [transRes, sumRes] = await Promise.all([
        api.get('/cashflow', { params: { type: typeFilter, startDate, endDate } }),
        api.get('/cashflow/summary')
      ]);
      
      setTransactions(transRes.data.transactions || []);
      setSummary({
        today: sumRes.data.today || { income: 0, expense: 0, net: 0 },
        thisMonth: sumRes.data.thisMonth || { income: 0, expense: 0, net: 0 }
      });
    } catch (error) {
      toast.error('Gagal memuat data arus kas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCashFlow();
  }, [typeFilter, startDate, endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/cashflow', formData);
      toast.success('Transaksi berhasil dicatat');
      setIsModalOpen(false);
      setFormData({ type: 'expense', amount: '', description: '' });
      fetchCashFlow();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mencatat transaksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSoftDelete = async (_id: number) => {
    if (!window.confirm('Yakin ingin mengarsipkan transaksi ini? (Data tidak akan dihapus permanen)')) return;
    
    try {
      // Endpoint arsip belum ada di cashflow.js (opsional untuk nanti)
      toast.error('Fitur arsip belum tersedia');
    } catch (error) {
      toast.error('Gagal mengarsipkan transaksi');
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-4 pb-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <Breadcrumb items={[{ label: 'Keuangan & Laporan' }, { label: 'Arus Kas' }]} />
        <div className="flex justify-end gap-2">
        
        <button onClick={() => setIsModalOpen(true)} className="px-5 py-2.5 rounded-xl font-bold text-white flex items-center gap-2 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5" style={{ background: 'var(--accent-gradient)' }}>
          <Plus size={18} /> Catat Transaksi
        </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4">Ringkasan Hari Ini</h3>
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-sm text-[var(--success)] flex items-center gap-1.5 font-medium">
                <TrendingUp size={16} /> +Rp{parseFloat(summary.today.income.toString()).toLocaleString()}
              </p>
              <p className="text-sm text-[var(--danger)] flex items-center gap-1.5 font-medium">
                <TrendingDown size={16} /> -Rp{parseFloat(summary.today.expense.toString()).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[var(--text-secondary)] font-medium mb-1">Kas Bersih</p>
              <p className={`text-xl font-extrabold tracking-tight ${summary.today.net >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                {summary.today.net >= 0 ? '+' : ''}Rp{parseFloat(summary.today.net.toString()).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4">Ringkasan Bulan Ini</h3>
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-sm text-[var(--success)] flex items-center gap-1.5 font-medium">
                <TrendingUp size={16} /> +Rp{parseFloat(summary.thisMonth.income.toString()).toLocaleString()}
              </p>
              <p className="text-sm text-[var(--danger)] flex items-center gap-1.5 font-medium">
                <TrendingDown size={16} /> -Rp{parseFloat(summary.thisMonth.expense.toString()).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[var(--text-secondary)] font-medium mb-1">Kas Bersih</p>
              <p className={`text-xl font-extrabold tracking-tight ${summary.thisMonth.net >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                {summary.thisMonth.net >= 0 ? '+' : ''}Rp{parseFloat(summary.thisMonth.net.toString()).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col xl:flex-row gap-4 mb-6 justify-between border-b border-[var(--border)] pb-5">
          <div className="flex flex-wrap gap-2">
            {[
              { id: '', label: 'Semua' },
              { id: 'sale', label: 'Penjualan', color: 'success' },
              { id: 'income', label: 'Pemasukan Lain', color: 'info' },
              { id: 'expense', label: 'Pengeluaran', color: 'danger' }
            ].map(filter => (
              <button 
                key={filter.id}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                  typeFilter === filter.id 
                    ? filter.id === '' ? 'bg-[var(--text-primary)] text-[var(--bg-main)] shadow-md' : `bg-[var(--${filter.color})]/10 text-[var(--${filter.color})] border border-[var(--${filter.color})]/30` 
                    : 'bg-[var(--bg-main)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--text-secondary)]'
                }`}
                onClick={() => setTypeFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2 bg-[var(--bg-main)] p-1.5 rounded-xl border border-[var(--border)] w-fit">
            <input 
              type="date" 
              className="bg-transparent text-[var(--text-primary)] text-sm px-3 py-1 outline-none" 
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
            <span className="text-[var(--text-secondary)] text-sm font-medium">s/d</span>
            <input 
              type="date" 
              className="bg-transparent text-[var(--text-primary)] text-sm px-3 py-1 outline-none"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {isLoading ? (
            <div className="text-center py-12 text-[var(--text-secondary)] font-medium animate-pulse">Memuat data...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-16 text-[var(--text-secondary)] flex flex-col items-center gap-4">
              <Wallet size={48} className="opacity-20" />
              <span className="font-medium text-lg">Belum ada transaksi ditemukan.</span>
            </div>
          ) : (
            transactions.map((t: any) => {
              const isExpense = t.type === 'expense';
              const isSale = t.type === 'sale';
              return (
                <div key={t.id} className="flex justify-between items-center p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-main)] hover:border-[var(--accent-primary)]/40 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                      isSale ? 'bg-[var(--success)]/10 text-[var(--success)]' :
                      isExpense ? 'bg-[var(--danger)]/10 text-[var(--danger)]' :
                      'bg-[var(--info)]/10 text-[var(--info)]'
                    }`}>
                      {isSale ? <Wallet size={20} /> :
                       isExpense ? <TrendingDown size={20} /> :
                       <TrendingUp size={20} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-[var(--text-primary)]">{t.description}</p>
                        {t.referenceId && <span className="px-2 py-0.5 rounded-md bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-[10px] font-mono text-[var(--text-secondary)]">{t.referenceId}</span>}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-medium text-[var(--text-secondary)]">
                        <span className="capitalize px-2 py-0.5 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border)]">{t.type}</span>
                        <span>{new Date(t.transactionDate).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <p className={`font-bold text-lg ${isExpense ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>
                      {isExpense ? '-' : '+'}Rp{parseFloat(t.amount).toLocaleString()}
                    </p>
                    <button 
                      onClick={() => handleSoftDelete(t.id)}
                      className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--warning)] hover:bg-[var(--warning)]/10 transition-colors opacity-0 group-hover:opacity-100"
                      title="Arsipkan Transaksi (Soft Delete)"
                    >
                      <Archive size={18} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal Manual Entry */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Catat Transaksi Manual">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
          <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Jenis Transaksi</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`cursor-pointer p-3.5 rounded-xl border text-center transition-all ${formData.type === 'expense' ? 'bg-[var(--danger)]/10 border-[var(--danger)] text-[var(--danger)] font-bold shadow-sm' : 'bg-[var(--bg-main)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]'}`}>
                <input type="radio" className="hidden" name="type" value="expense" checked={formData.type === 'expense'} onChange={e => setFormData({...formData, type: e.target.value})} />
                Pengeluaran (Kas Keluar)
              </label>
              <label className={`cursor-pointer p-3.5 rounded-xl border text-center transition-all ${formData.type === 'income' ? 'bg-[var(--info)]/10 border-[var(--info)] text-[var(--info)] font-bold shadow-sm' : 'bg-[var(--bg-main)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]'}`}>
                <input type="radio" className="hidden" name="type" value="income" checked={formData.type === 'income'} onChange={e => setFormData({...formData, type: e.target.value})} />
                Pemasukan (Kas Masuk)
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Jumlah (Rp) *</label>
            <input required type="number" step="0.01" min="0.01" className="w-full px-4 py-2.5 text-lg font-bold rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none transition-all" placeholder="0" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">Deskripsi *</label>
            <input required type="text" className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none transition-all" placeholder={formData.type === 'expense' ? 'Cth: Beli ATK, Bayar WiFi' : 'Cth: Modal awal kasir'} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[var(--border)]">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-[var(--text-primary)] bg-[var(--bg-main)] border border-[var(--border)] hover:bg-[var(--bg-surface-elevated)] transition-colors">Batal</button>
            <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 rounded-xl font-bold text-white transition-all disabled:opacity-50" style={{ background: 'var(--accent-gradient)' }}>
              Simpan Transaksi
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}