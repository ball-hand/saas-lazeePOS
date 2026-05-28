import { useState, useEffect } from 'react';
import { Timer, CheckCircle, ChefHat, Search } from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { Breadcrumb } from '../components/shared/Breadcrumb';

interface QueueItem {
  id: string;
  receiptNumber: string;
  customerName: string | null;
  orderType: string;
  tableName: string | null;
  createdAt: string;
  items: {
    id: string;
    productName: string;
    quantity: number;
    notes?: string;
  }[];
}

export function Queue() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'dine-in' | 'takeaway'>('all');

  const fetchQueue = async () => {
    try {
      const { data } = await api.get('/queue');
      setQueue(data.queue);
    } catch (error) {
      toast.error('Gagal memuat antrean pesanan');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    // Poll every 10 seconds for new orders
    const interval = setInterval(fetchQueue, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleComplete = async (id: string) => {
    try {
      await api.put(`/queue/${id}/complete`);
      toast.success('Pesanan selesai dan siap disajikan!');
      fetchQueue();
    } catch (error) {
      toast.error('Gagal menyelesaikan pesanan');
    }
  };

  const filteredQueue = queue.filter(item => {
    const matchesSearch = item.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.customerName && item.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (item.tableName && item.tableName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = filterType === 'all' || item.orderType === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="relative bg-[var(--bg-surface-elevated)] rounded-2xl border border-[var(--border)] shadow-sm min-h-[80vh] flex flex-col overflow-hidden animate-fade-in">
      {/* Subtle Dot Pattern Background */}
      <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--text-primary) 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
      
      {/* Card Header with Title */}
      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--border)] p-6 bg-[var(--bg-surface-elevated)]">
        <Breadcrumb items={[{ label: 'Toko & Transaksi' }, { label: 'Antrean Dapur' }]} />
      </div>

      {/* Card Content */}
      <div className="relative z-10 p-6 flex-1 flex flex-col">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Cari no. struk, nama, atau meja..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--bg-main)] border border-[var(--border)] rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none"
          />
        </div>
        <div className="flex bg-[var(--bg-main)] border border-[var(--border)] rounded-xl p-1 shrink-0">
          <button 
            onClick={() => setFilterType('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === 'all' ? 'bg-[var(--accent-primary)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            Semua
          </button>
          <button 
            onClick={() => setFilterType('dine-in')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === 'dine-in' ? 'bg-[var(--accent-primary)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            Makan di Tempat
          </button>
          <button 
            onClick={() => setFilterType('takeaway')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === 'takeaway' ? 'bg-[var(--accent-primary)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            Bawa Pulang
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] h-64"></div>
          ))}
        </div>
      ) : filteredQueue.length === 0 ? (
        <div className="bg-[var(--bg-card)] rounded-3xl p-12 text-center border border-[var(--border)] shadow-sm">
          <div className="w-24 h-24 bg-[var(--bg-main)] rounded-full flex items-center justify-center mx-auto mb-6">
            <ChefHat size={48} className="text-[var(--accent-primary)] opacity-50" />
          </div>
          <h3 className="text-xl font-black text-[var(--text-primary)] mb-2">Dapur Sedang Kosong</h3>
          <p className="text-[var(--text-secondary)] font-bold max-w-md mx-auto">Tidak ada pesanan yang sedang diproses. Bersantai sejenak sambil menunggu pesanan baru masuk!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQueue.map(order => (
            <div key={order.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-sm flex flex-col overflow-hidden">
              <div className={`p-4 ${order.orderType === 'dine-in' ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'bg-orange-50/50 dark:bg-orange-900/10'} border-b border-[var(--border)] flex justify-between items-start`}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black text-[var(--text-primary)]">{order.receiptNumber}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${order.orderType === 'dine-in' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                      {order.orderType === 'dine-in' ? 'DINE-IN' : 'TAKEAWAY'}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-[var(--text-primary)]">
                    {order.orderType === 'dine-in' && order.tableName ? order.tableName : (order.customerName || 'Takeaway')}
                  </h3>
                  {order.orderType === 'dine-in' && order.customerName && (
                    <p className="text-xs font-bold text-[var(--text-secondary)]">{order.customerName}</p>
                  )}
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1 text-[var(--accent-primary)] bg-[var(--bg-main)] px-2 py-1 rounded-lg border border-[var(--border)] shadow-sm">
                    <Timer size={14} />
                    <span className="text-xs font-black">{formatDistanceToNow(new Date(order.createdAt), { locale: id })} lalu</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 flex-1 overflow-y-auto">
                <ul className="space-y-3">
                  {order.items.map((item, idx) => (
                    <li key={idx} className="flex justify-between items-start gap-3 py-2 border-b border-[var(--border)] last:border-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <div className="bg-[var(--bg-main)] w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-[var(--border)]">
                          <span className="text-sm font-black text-[var(--text-primary)]">{item.quantity}x</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[var(--text-primary)] leading-tight">{item.productName}</p>
                          {item.notes && (
                            <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium bg-[var(--bg-main)] px-2 py-1 rounded">Catatan: {item.notes}</p>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-[var(--bg-main)] border-t border-[var(--border)] mt-auto">
                <button 
                  onClick={() => handleComplete(order.id)}
                  className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-black py-3 rounded-xl transition-colors shadow-sm"
                >
                  <CheckCircle size={18} />
                  Selesai & Antar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
