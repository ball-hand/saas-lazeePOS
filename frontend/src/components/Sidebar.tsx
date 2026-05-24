import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, ShoppingCart, Package, ReceiptText, 
  Wallet, Tags, Settings as SettingsIcon, LogOut, X,
  CreditCard, Warehouse, Building2
} from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const { storeName, logoUrl } = useTheme();

  const tenantNavItems = [
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/pos', icon: <ShoppingCart size={20} />, label: 'POS Terminal' },
    { to: '/products',  icon: <Package size={20} />,       label: 'Produk' },
    { to: '/warehouse',  icon: <Warehouse size={20} />,     label: 'Gudang' },
    { to: '/receipts',   icon: <ReceiptText size={20} />,   label: 'Struk' },
    { to: '/cashflow',   icon: <Wallet size={20} />,        label: 'Kas' },
    ...(user?.role === 'admin' ? [
      { to: '/discounts', icon: <Tags size={20} />,         label: 'Diskon' },
      { to: '/billing',   icon: <CreditCard size={20} />,  label: 'Langganan' },
      { to: '/settings',  icon: <SettingsIcon size={20} />, label: 'Pengaturan' },
    ] : []),
  ];

  const centralNavItems = [
    { to: '/central', icon: <LayoutDashboard size={20} />, label: 'Platform Dashboard' },
    { to: '/central/tenants', icon: <Building2 size={20} />, label: 'Daftar Tenant' },
    { to: '/central/plans', icon: <CreditCard size={20} />, label: 'Paket Berlangganan' },
    { to: '/central/platform', icon: <SettingsIcon size={20} />, label: 'Pengaturan Sistem' },
  ];

  const navItems = user?.role === 'central' ? centralNavItems : tenantNavItems;

  return (
    <aside className="w-64 h-full flex flex-col bg-[var(--bg-surface-elevated)] border-r border-[var(--border)] shadow-xl md:shadow-none">
      {/* Header Sidebar */}
      <div className="p-6 pb-4 flex justify-between items-start">
        <div className="flex-1 min-w-0">
          {logoUrl ? (
            <img src={logoUrl} alt={storeName} className="h-10 w-auto mb-2 object-contain" />
          ) : (
            <h1 className="text-2xl font-extrabold mb-1 truncate text-[var(--accent-primary)] tracking-tight">
              {storeName}
            </h1>
          )}
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
      <nav className="flex-1 px-4 flex flex-col gap-1.5 overflow-y-auto custom-scrollbar py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose} // Auto-close di mobile saat pindah halaman
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
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