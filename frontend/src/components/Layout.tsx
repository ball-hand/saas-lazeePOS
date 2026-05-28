import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { VerifyPaymentModal } from './VerifyPaymentModal';
import { Menu, Search, Mail, Bell, LogOut, Coffee } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/client';

export function Layout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [activeTableOrders, setActiveTableOrders] = useState<any[]>([]);
  const [verifyOrderId, setVerifyOrderId] = useState<string | null>(null);
  const previousOrderCount = useRef(0);
  const { storeName } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const globalSearch = searchParams.get('q') || '';
  const isFullWidth = location.pathname.includes('/pos') || location.pathname.includes('/tables');

  const playNotificationSound = () => {
    const soundEnabled = localStorage.getItem('pos_notification_sound');
    if (soundEnabled === 'false') return;

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      // Play a pleasant double chime (ding-dong)
      oscillator.type = 'sine';
      
      // First chime (ding - A5)
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

      // Second chime (dong - E5)
      oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.3); 
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime + 0.3);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 1.0);
    } catch (e) {
      console.warn('AudioContext not supported or blocked');
    }
  };

  useEffect(() => {
    // Poll active table orders every 15 seconds
    const fetchOrders = async () => {
      try {
        if (!user) return;
        const res = await api.get('/tables/orders/active');
        const newOrders = res.data.orders || [];
        
        if (newOrders.length > previousOrderCount.current) {
          playNotificationSound();
        }
        previousOrderCount.current = newOrders.length;
        
        setActiveTableOrders(newOrders);
      } catch (err) {
        console.error('Failed to fetch active orders', err);
      }
    };
    
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const getPageInfo = () => {
    const path = location.pathname;
    if (path.includes('/pos')) return { title: 'POS Terminal', desc: 'Sistem Kasir Pintar' };
    if (path.includes('/tables')) return { title: 'Manajemen Meja', desc: 'Atur Denah & Meja' };
    if (path.includes('/products')) return { title: 'Katalog Produk', desc: 'Kelola Item & Menu' };
    if (path.includes('/warehouse')) return { title: 'Stok Gudang', desc: 'Inventaris & Bahan Baku' };
    if (path.includes('/discounts')) return { title: 'Aturan Diskon', desc: 'Manajemen Promo' };
    if (path.includes('/receipts')) return { title: 'Riwayat Struk', desc: 'Catatan Transaksi' };
    if (path.includes('/cashflow')) return { title: 'Arus Kas', desc: 'Pemasukan & Pengeluaran' };
    if (path.includes('/settings')) return { title: 'Pengaturan Toko', desc: 'Konfigurasi Sistem' };
    if (path.includes('/users')) return { title: 'Staf & Kasir', desc: 'Manajemen Akses' };
    if (path.includes('/dashboard') || path === '/') return { title: 'Dashboard', desc: 'Ringkasan Aktivitas Toko' };
    if (path.includes('/queue')) return { title: 'Antrean Dapur', desc: 'Kelola dan proses pesanan yang masuk' };
    return { title: 'LazeePOS', desc: 'Manajemen Bisnis' };
  };

  const { title, desc } = getPageInfo();

  return (
    <div className="flex h-screen bg-[var(--bg-main)] text-[var(--text-primary)] overflow-hidden p-3 gap-3">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm transition-opacity md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container (Responsif: tersembunyi di mobile, menetap di desktop) */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:relative md:z-50 md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden gap-1.5 md:gap-2">
        {/* Desktop Header */}
        <header className="hidden md:flex relative z-[60] items-center justify-between bg-[var(--bg-surface-elevated)] p-2 pr-4 pl-6 rounded-full border border-[var(--border)] shadow-sm shrink-0 h-16">
          {/* Page Title */}
          <div className="flex flex-col justify-center">
            <h1 className="text-lg font-black text-[var(--text-primary)] leading-none mb-1">{title}</h1>
            <p className="text-[10px] font-bold text-[var(--text-secondary)] leading-none uppercase tracking-wider">{desc}</p>
          </div>
          
          <div className="flex items-center gap-4 lg:gap-6">
            {/* Search (Moved to right side) */}
            <div className="relative w-48 lg:w-64 hidden xl:flex items-center">
              <Search className="absolute left-3.5 text-[var(--text-secondary)]" size={14} />
              <input 
                type="text" 
                value={globalSearch}
                onChange={e => {
                  const newParams = new URLSearchParams(searchParams);
                  if (e.target.value) newParams.set('q', e.target.value);
                  else newParams.delete('q');
                  setSearchParams(newParams);
                }}
                placeholder="Cari fitur atau data..." 
                className="w-full bg-[var(--bg-main)] border border-transparent focus:border-[var(--border)] rounded-full py-2.5 pl-11 pr-4 text-sm font-medium outline-none transition-all shadow-inner"
              />
            </div>
            
            {/* Right Actions */}
          <div className="flex items-center gap-3 lg:gap-5">
            <div className="flex items-center gap-2">
              <button className="p-2.5 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] bg-[var(--bg-main)] hover:bg-[var(--accent-primary-transparent)] rounded-full transition-all border border-transparent hover:border-[var(--accent-primary)]/20">
                <Mail size={18} />
              </button>

              <div className="relative">
                <button 
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="p-2.5 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] bg-[var(--bg-main)] hover:bg-[var(--accent-primary-transparent)] rounded-full transition-all border border-transparent hover:border-[var(--accent-primary)]/20 relative"
                >
                  <Bell size={18} />
                  {activeTableOrders.length > 0 && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[var(--bg-main)] animate-pulse" />
                  )}
                </button>

                {isNotificationOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotificationOpen(false)} />
                    <div className="absolute right-0 mt-2 w-80 bg-[var(--bg-surface-elevated)] rounded-2xl shadow-xl border border-[var(--border)] p-2 z-50 flex flex-col overflow-hidden animate-fade-in origin-top-right">
                      <div className="px-3 py-2 border-b border-[var(--border)] mb-2 flex items-center justify-between">
                        <span className="font-bold text-sm text-[var(--text-primary)]">Pesanan Meja Aktif</span>
                        <span className="text-[10px] font-black bg-[var(--danger-transparent)] text-[var(--danger)] px-2 py-0.5 rounded-full">{activeTableOrders.length} Baru</span>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto max-h-[300px] custom-scrollbar space-y-1">
                        {activeTableOrders.length === 0 ? (
                          <div className="p-4 text-center text-xs text-[var(--text-secondary)]">Tidak ada pesanan meja saat ini.</div>
                        ) : (
                          activeTableOrders.map(order => (
                            <button
                              key={order.id}
                              onClick={() => {
                                setIsNotificationOpen(false);
                                if (order.paymentStatus === 'VERIFYING') {
                                  setVerifyOrderId(order.id);
                                } else {
                                  navigate(`/pos?tableOrderId=${order.id}`);
                                }
                              }}
                              className="w-full text-left p-3 hover:bg-[var(--bg-main)] rounded-xl transition-all border border-transparent hover:border-[var(--border)] flex gap-3 group relative"
                            >
                              <div className="w-10 h-10 rounded-full bg-[var(--accent-primary-transparent)] text-[var(--accent-primary)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                <Coffee size={18} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                  <p className="text-sm font-bold text-[var(--text-primary)] truncate">{order.tableName} <span className="font-medium text-[var(--text-secondary)] text-[10px] ml-1">({order.zoneName})</span></p>
                                  {order.paymentStatus === 'VERIFYING' && (
                                    <span className="text-[10px] font-black bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full whitespace-nowrap">Cek Bayar</span>
                                  )}
                                </div>
                                <p className="text-[11px] text-[var(--text-secondary)] truncate">{order.customerName} • Rp {order.totalAmount.toLocaleString('id-ID')}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="h-8 w-px bg-[var(--border)] mx-1" />

            <div className="flex items-center gap-3 pl-1">
              <div className="relative">
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-3 focus:outline-none group"
                >
                  <div className="w-10 h-10 rounded-full bg-[var(--accent-gradient)] text-white flex items-center justify-center font-black text-lg shadow-md border-2 border-[var(--bg-surface-elevated)] group-hover:ring-2 group-hover:ring-[var(--accent-primary)]/40 transition-all">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="hidden lg:flex flex-col text-left justify-center">
                    <p className="text-sm font-bold text-[var(--text-primary)] leading-none mb-1 group-hover:text-[var(--accent-primary)] transition-colors">{user?.name || 'User'}</p>
                    <p className="text-[10px] font-medium text-[var(--text-secondary)] leading-none truncate w-32">{user?.email || 'user@email.com'}</p>
                  </div>
                </button>

                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-surface-elevated)] rounded-xl shadow-lg border border-[var(--border)] py-1.5 z-50 overflow-hidden">
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors"
                      >
                        <LogOut size={16} />
                        Keluar
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            </div>
          </div>
        </header>

        {/* Mobile Header (Hanya muncul di layar HP/Tablet kecil) */}
        <header className="md:hidden flex relative z-[60] items-center justify-between p-3 px-5 bg-[var(--bg-surface-elevated)] rounded-full border border-[var(--border)] shadow-sm shrink-0 h-16">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-full bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all border border-[var(--border)] shadow-sm"
            >
              <Menu size={20} />
            </button>
            <span className="font-black text-lg text-[var(--accent-primary)] truncate max-w-[150px]">
              {storeName}
            </span>
          </div>

          <div className="relative">
            <button 
              onClick={() => setIsMobileProfileOpen(!isMobileProfileOpen)}
              className="flex items-center focus:outline-none"
            >
              <div className="w-9 h-9 rounded-full bg-[var(--accent-gradient)] text-white flex items-center justify-center font-black text-sm shadow-md border-2 border-[var(--bg-surface-elevated)]">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            </button>

            {isMobileProfileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsMobileProfileOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-surface-elevated)] rounded-xl shadow-lg border border-[var(--border)] py-1.5 z-50 overflow-hidden">
                  <div className="px-4 py-2 border-b border-[var(--border)] mb-1">
                    <p className="text-sm font-bold text-[var(--text-primary)] truncate">{user?.name}</p>
                    <p className="text-[10px] text-[var(--text-secondary)] truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors"
                  >
                    <LogOut size={16} />
                    Keluar
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className={`flex-1 flex flex-col overflow-y-auto relative custom-scrollbar`}>
          <div className={`flex-1 w-full ${isFullWidth ? 'h-full' : 'pt-4 md:pt-6'}`}>
            {children}
          </div>
        </main>
      </div>

      <VerifyPaymentModal 
        orderId={verifyOrderId} 
        onClose={() => setVerifyOrderId(null)} 
        onSuccess={() => {
          setVerifyOrderId(null);
          const fetchOrders = async () => {
            try {
              const res = await api.get('/tables/orders/active');
              setActiveTableOrders(res.data.orders || []);
            } catch (err) {}
          };
          fetchOrders();
        }}
      />
    </div>
  );
}