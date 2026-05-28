import { useState, useEffect } from 'react';
import { Eye, Calendar } from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { ReceiptModal } from '../components/ReceiptModal';
import { Breadcrumb } from '../components/shared/Breadcrumb';
import { Pagination } from '../components/shared/Pagination';

export function Receipts() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const search = searchParams.get('q') || '';
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(receipts.length / itemsPerPage);
  const currentReceipts = receipts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [search, startDate, endDate]);

  const fetchReceipts = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/receipts', {
        params: { search, startDate, endDate }
      });
      setReceipts(data.receipts || []);
    } catch (error) {
      toast.error('Gagal memuat riwayat struk');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search slightly
    const timeout = setTimeout(() => {
      fetchReceipts();
    }, 500);
    return () => clearTimeout(timeout);
  }, [search, startDate, endDate]);

  return (
    <div className="animate-fade-in flex flex-col gap-4 pb-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <Breadcrumb items={[{ label: 'Keuangan & Laporan' }, { label: 'Riwayat Struk' }]} />
        {/* Filter Bar */}
        <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-end shadow-sm">
        <div className="flex items-center gap-2 bg-[var(--bg-main)] p-1.5 rounded-xl border border-[var(--border)] w-full md:w-auto justify-between md:justify-start">
          <Calendar size={16} className="text-[var(--text-secondary)] ml-2 hidden md:block" />
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-[var(--text-primary)] text-sm px-2 py-0.5 outline-none" />
          <span className="text-[var(--text-secondary)] text-xs font-bold px-1">s/d</span>
          <span className="text-[var(--text-secondary)] text-xs font-bold px-1">s/d</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-[var(--text-primary)] text-sm px-2 py-0.5 outline-none" />
        </div>
      </div>
      </div>

      {/* List Invoice Card/Table */}
      <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="text-[var(--text-secondary)] border-b border-[var(--border)] text-xs uppercase tracking-wider bg-[var(--bg-main)]/30">
                <th className="p-4 font-semibold">Nomor Nota</th>
                <th className="p-4 font-semibold">Waktu Transaksi</th>
                <th className="p-4 font-semibold">Pelanggan</th>
                <th className="p-4 font-semibold">Metode</th>
                <th className="p-4 font-semibold text-right">Total Tagihan</th>
                <th className="p-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-5 text-center text-[var(--text-secondary)] animate-pulse font-medium">Memuat data...</td>
                </tr>
              ) : currentReceipts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-5 text-center text-[var(--text-secondary)] font-medium">Belum ada riwayat transaksi yang ditemukan.</td>
                </tr>
              ) : (
                currentReceipts.map((r) => (
                  <tr key={r.id} className="hover:bg-[var(--bg-main)]/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-[var(--accent-primary)]">{r.receiptNumber}</td>
                    <td className="p-4 text-[var(--text-secondary)]">{new Date(r.createdAt).toLocaleString()}</td>
                    <td className="p-4 text-[var(--text-primary)] font-medium">{r.customerName || 'Umum'}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-md bg-[var(--bg-main)] border border-[var(--border)] text-xs font-bold text-[var(--text-secondary)] capitalize">{r.paymentMethod}</span>
                    </td>
                    <td className="p-4 text-right font-extrabold text-[var(--text-primary)]">Rp {r.totalAmount.toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => setSelectedReceipt(r)}
                        className="px-3 py-1.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)] transition-all text-xs font-bold flex items-center gap-1 mx-auto shadow-sm"
                      >
                        <Eye size={14} /> Detail Nota
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={setCurrentPage} 
          totalItems={receipts.length} 
        />
      </div>
      
      <ReceiptModal 
        isOpen={!!selectedReceipt} 
        onClose={() => setSelectedReceipt(null)} 
        receipt={selectedReceipt} 
      />
    </div>
  );
}