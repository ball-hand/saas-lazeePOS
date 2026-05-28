import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getMediaUrl } from '../api/client';
import { 
  LayoutDashboard, ShoppingCart, Package, ReceiptText, 
  Wallet, Tags, Settings as SettingsIcon, X,
  CreditCard, Warehouse, Building2, ChevronDown, ChevronRight, Receipt,
  LifeBuoy, Rocket, ServerCrash, Server, Users, Store, Box, LineChart, ShieldCheck, Map, ChefHat
} from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const { user } = useAuth();
  const { storeName, logoUrl, logoShape } = useTheme();
  const location = useLocation();

  const tenantNavGroups = [
    {
      title: "Toko & Transaksi",
      groupIcon: <Store size={18} />,
      items: [
        ...(user?.role === 'admin' ? [{ to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' }] : []),
        { to: '/pos', icon: <ShoppingCart size={20} />, label: 'POS Terminal' },
        { to: '/queue', icon: <ChefHat size={20} />, label: 'Antrean Dapur' },
        { to: '/tables', icon: <Map size={20} />, label: 'Denah & Tata Ruang' },
      ]
    },
    {
      title: "Katalog & Gudang",
      groupIcon: <Box size={18} />,
      items: [
        { to: '/products',  icon: <Package size={20} />,       label: 'Katalog Produk' },
        { to: '/warehouse',  icon: <Warehouse size={20} />,     label: 'Stok Gudang' },
        ...(user?.role === 'admin' ? [{ to: '/discounts', icon: <Tags size={20} />, label: 'Aturan Diskon' }] : []),
      ]
    },
    {
      title: "Keuangan & Laporan",
      groupIcon: <LineChart size={18} />,
      items: [
        { to: '/receipts',   icon: <ReceiptText size={20} />,   label: 'Riwayat Struk' },
        { to: '/cashflow',   icon: <Wallet size={20} />,        label: 'Arus Kas' },
        { to: '/support',    icon: <LifeBuoy size={20} />,      label: 'Pusat Bantuan' }
      ]
    },
    ...(user?.role === 'admin' ? [{
      title: "Sistem & Langganan",
      groupIcon: <SettingsIcon size={18} />,
      isBottomNav: true,
      items: [
        { to: '/settings',  icon: <SettingsIcon size={20} />, label: 'Pengaturan Toko' },
        { to: '/users',     icon: <Users size={20} />, label: 'Staf & Kasir' },
        { to: '/billing',   icon: <CreditCard size={20} />,  label: 'Langganan' },
      ]
    }] : []),
  ];

  const centralNavGroups = [
    {
      title: "Platform Admin",
      groupIcon: <ShieldCheck size={18} />,
      items: [
        { to: '/central', icon: <LayoutDashboard size={20} />, label: 'Platform Dashboard' },
        { to: '/central/tenants', icon: <Building2 size={20} />, label: 'Daftar Tenant' },
        { to: '/central/billing', icon: <Receipt size={20} />, label: 'Tagihan SaaS' },
      ]
    },
    {
      title: "Sistem & Tiket",
      groupIcon: <LifeBuoy size={18} />,
      items: [
        { to: '/central/tickets', icon: <LifeBuoy size={20} />, label: 'Sistem Tiket' },
        { to: '/central/releases', icon: <Rocket size={20} />, label: 'Manajemen Versi' },
        { to: '/central/plans', icon: <CreditCard size={20} />, label: 'Paket Berlangganan' },
      ]
    },
    {
      title: "Pengaturan & Server",
      groupIcon: <Server size={18} />,
      isBottomNav: true,
      items: [
        { to: '/central/platform', icon: <SettingsIcon size={20} />, label: 'Pengaturan' },
        { to: '/central/server-status', icon: <Server size={20} />, label: 'Status Server' },
        { to: '/central/system', icon: <ServerCrash size={20} />, label: 'Command Center' },
      ]
    }
  ];

  const navGroups = user?.role === 'central' ? centralNavGroups : tenantNavGroups;
  
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    navGroups.forEach(g => {
      const isActive = g.items.some(item => 
        location.pathname === item.to || 
        (item.to !== '/' && item.to !== '/central' && location.pathname.startsWith(item.to))
      );
      initialState[g.title] = isActive;
    });
    return initialState;
  });

  // Automatically expand group if active route changes
  useEffect(() => {
    const activeGroup = navGroups.find(g => 
      g.items.some(item => 
        location.pathname === item.to || 
        (item.to !== '/' && item.to !== '/central' && location.pathname.startsWith(item.to))
      )
    );
    if (activeGroup) {
      setExpandedGroups(prev => {
        if (prev[activeGroup.title]) return prev; // Mencegah infinite re-render
        return {
          ...prev,
          [activeGroup.title]: true
        };
      });
    }
  }, [location.pathname]);

  return (
    <aside className="w-72 h-full flex flex-col bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-3xl shadow-sm overflow-hidden">
      {/* Header Sidebar */}
      <div className="p-6 pb-2 flex justify-between items-start">
        <div className="flex-1 min-w-0 flex flex-col items-center text-center">
          {logoUrl ? (
            <img 
              src={getMediaUrl(logoUrl)} 
              alt={storeName} 
              className={`h-16 w-16 mb-3 object-cover shadow-sm border border-[var(--border)] bg-white ${logoShape === 'circle' ? 'rounded-full' : 'rounded-2xl'}`} 
            />
          ) : (
            <div className={`h-16 w-16 bg-[var(--accent-gradient)] flex items-center justify-center text-white mb-3 shadow-md ${logoShape === 'circle' ? 'rounded-full' : 'rounded-2xl'}`}>
              <span className="font-black text-3xl">L</span>
            </div>
          )}
          <h1 className="text-xl font-extrabold mb-1 text-[var(--accent-primary)] tracking-tight leading-tight">
            {storeName}
          </h1>
          <div className="mt-1 inline-flex items-center gap-2 bg-[var(--bg-main)] px-3 py-1.5 rounded-full border border-[var(--border)] shadow-sm">
            <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${user?.role === 'admin' ? 'bg-[var(--accent-primary)]' : 'bg-[var(--success)]'}`}></div>
            <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">{user?.role}</span>
          </div>
        </div>
        
        {/* Tombol Close untuk Mobile */}
        {onClose && (
          <button 
            onClick={onClose} 
            className="md:hidden p-2 ml-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg bg-[var(--bg-main)] border border-[var(--border)]"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigasi Utama */}
      <nav className="flex-1 px-4 flex flex-col overflow-y-auto custom-scrollbar py-4">
        <ul role="list" className="flex flex-1 flex-col gap-y-4">
          {navGroups.map((group, idx) => {
            const isExpanded = expandedGroups[group.title];
            const isBottom = group.isBottomNav;
            const hasBorderBottom = !isBottom && idx !== navGroups.length - 1 && !navGroups[idx+1].isBottomNav;
            
            return (
              <li 
                key={group.title} 
                className={`${isBottom ? 'pt-4 mt-2 border-t border-[var(--border)]' : `pb-4 ${hasBorderBottom ? 'border-b border-[var(--border)]' : ''}`}`}
              >
                <button
                  onClick={() => setExpandedGroups(prev => ({...prev, [group.title]: !isExpanded}))}
                  className="w-full flex items-center justify-between px-2 text-xs font-bold leading-6 text-[var(--text-secondary)] uppercase tracking-wider mb-2 hover:text-[var(--text-primary)] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {group.groupIcon}
                    <span>{group.title}</span>
                  </div>
                  <div className="text-[var(--text-secondary)]">
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </div>
                </button>
                <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <ul role="list" className="space-y-1 pl-6 pt-1">
                      {group.items.map((item: any) => (
                        <li key={item.to}>
                          <NavLink
                            to={item.to}
                            end={item.to === '/central' || item.to === '/'}
                            onClick={onClose}
                            className={({ isActive }) =>
                              `group flex gap-x-3 rounded-xl px-3 py-2 text-sm leading-6 font-semibold transition-all ${
                                isActive
                                  ? 'bg-[var(--accent-primary-transparent)] text-[var(--accent-primary)]'
                                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-main)]'
                              }`
                            }
                          >
                            {item.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </nav>

    </aside>
  );
}