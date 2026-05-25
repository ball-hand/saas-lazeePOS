import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getMediaUrl } from '../api/client';
import { 
  LayoutDashboard, ShoppingCart, Package, ReceiptText, 
  Wallet, Tags, Settings as SettingsIcon, LogOut, X,
  CreditCard, Warehouse, Building2, ChevronDown, ChevronRight, Receipt,
  LifeBuoy, Rocket, ServerCrash, Server, Users
} from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const { storeName, logoUrl, logoShape } = useTheme();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const tenantNavGroups = [
    {
      title: "Toko & Transaksi",
      items: [
        ...(user?.role === 'admin' ? [{ to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' }] : []),
        { to: '/pos', icon: <ShoppingCart size={20} />, label: 'POS Terminal' },
      ]
    },
    {
      title: "Katalog & Gudang",
      items: [
        { to: '/products',  icon: <Package size={20} />,       label: 'Katalog Produk' },
        { to: '/warehouse',  icon: <Warehouse size={20} />,     label: 'Stok Gudang' },
        ...(user?.role === 'admin' ? [{ to: '/discounts', icon: <Tags size={20} />, label: 'Aturan Diskon' }] : []),
      ]
    },
    {
      title: "Keuangan & Laporan",
      items: [
        { to: '/receipts',   icon: <ReceiptText size={20} />,   label: 'Riwayat Struk' },
        { to: '/cashflow',   icon: <Wallet size={20} />,        label: 'Arus Kas' },
        { to: '/support',    icon: <LifeBuoy size={20} />,      label: 'Pusat Bantuan' }
      ]
    },
    ...(user?.role === 'admin' ? [{
      title: "Sistem & Langganan",
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
      items: [
        { to: '/central', icon: <LayoutDashboard size={20} />, label: 'Platform Dashboard' },
        { to: '/central/tenants', icon: <Building2 size={20} />, label: 'Daftar Tenant' },
        { to: '/central/billing', icon: <Receipt size={20} />, label: 'Tagihan SaaS' },
        { to: '/central/tickets', icon: <LifeBuoy size={20} />, label: 'Sistem Tiket' },
        { to: '/central/releases', icon: <Rocket size={20} />, label: 'Manajemen Versi' },
        { to: '/central/plans', icon: <CreditCard size={20} />, label: 'Paket Berlangganan' },
        { to: '/central/platform', icon: <SettingsIcon size={20} />, label: 'Pengaturan' },
        { to: '/central/server-status', icon: <Server size={20} />, label: 'Status Server' },
        { to: '/central/system', icon: <ServerCrash size={20} />, label: 'Command Center' },
      ]
    }
  ];

  const navGroups = user?.role === 'central' ? centralNavGroups : tenantNavGroups;

  return (
    <aside className="w-64 h-full flex flex-col bg-[var(--bg-surface-elevated)] border-r border-[var(--border)] shadow-xl md:shadow-none">
      {/* Header Sidebar */}
      <div className="p-6 pb-4 flex justify-between items-start">
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
          <div className="mt-2 inline-flex items-center gap-2 bg-[var(--bg-main)] px-3 py-1.5 rounded-full border border-[var(--border)] shadow-sm">
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
      <nav className="flex-1 px-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar py-4">
        {navGroups.map((group, idx) => {
          // Initialize expanded state for this group if it doesn't exist
          const isExpanded = expandedGroups[group.title] !== false; // Default to true
          
          return (
            <div key={idx}>
              {group.title && (
                <button 
                  onClick={() => setExpandedGroups(prev => ({ ...prev, [group.title]: !isExpanded }))}
                  className="w-full flex items-center justify-between px-3 mb-2 group-btn"
                >
                  <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider group-btn-hover:text-[var(--text-primary)] transition-colors">
                    {group.title}
                  </p>
                  <div className="text-[var(--text-secondary)]">
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </div>
                </button>
              )}
              
              <div 
                className={`grid transition-all duration-300 ease-in-out ${
                  isExpanded ? 'grid-rows-[1fr] opacity-100 mt-1' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="flex flex-col gap-1.5">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/central' || item.to === '/'}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                          isActive
                            ? 'bg-[var(--accent-primary-transparent)] text-[var(--accent-primary)] font-semibold shadow-[inset_3px_0_0_0_var(--accent-primary)]'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-main)] hover:text-[var(--text-primary)] font-medium'
                        }`
                      }
                    >
                      <span className={`transition-transform duration-200 group-hover:scale-110`}>{item.icon}</span>
                      <span className="text-sm">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Profil User & Logout */}
      <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-surface-elevated)]">
        <div className="flex items-center gap-3 px-3 py-3 mb-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] shadow-sm">
          <div className="w-9 h-9 shrink-0 rounded-full bg-[var(--accent-gradient)] flex items-center justify-center text-white font-bold text-sm shadow-inner">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--text-primary)] truncate leading-tight">{user?.name}</p>
            <p className="text-[11px] font-medium text-[var(--text-secondary)] truncate mt-0.5">{user?.email}</p>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 px-4 py-2.5 w-full text-[var(--danger)] hover:bg-[var(--danger)]/10 hover:text-[var(--danger)] rounded-xl transition-colors font-semibold text-sm border border-transparent hover:border-[var(--danger)]/20"
        >
          <LogOut size={18} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}