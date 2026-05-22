import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { SuperAdminLogin } from './pages/central/SuperAdminLogin';
import { SuperAdminDashboard } from './pages/central/SuperAdminDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';

// Tenant (toko) pages
import { Dashboard } from './pages/Dashboard';
import { POS } from './pages/POS';
import { Products } from './pages/Products';
import { Warehouse } from './pages/Warehouse';
import { Receipts } from './pages/Receipts';
import { CashFlow } from './pages/CashFlow';
import { Discounts } from './pages/Discounts';
import { Settings } from './pages/Settings';
import { Billing } from './pages/Billing';

import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>

        <Routes>

          {/* ── PUBLIC ─────────────────────────────────── */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/central-login" element={<SuperAdminLogin />} />

          {/* ── TENANT ROUTES  (toko subdomain) ─────────── */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pos"        element={<POS />} />
            <Route path="/products"   element={<Products />} />
            <Route path="/warehouse"  element={<Warehouse />} />
            <Route path="/receipts"   element={<Receipts />} />
            <Route path="/cashflow"   element={<CashFlow />} />
            <Route path="/billing"    element={<Billing />} />
          </Route>

          {/* ── TENANT ADMIN ROUTES ────────────────────── */}
          <Route element={<ProtectedRoute requireAdmin={true} />}>
            <Route path="/discounts" element={<Discounts />} />
            <Route path="/settings"  element={<Settings />} />
          </Route>

          {/* ── SUPERADMIN ROUTES ──────────────────────── */}
          <Route element={<ProtectedRoute requireSuperadmin={true} />}>
            <Route path="/super-admin"         element={<SuperAdminDashboard />} />
            <Route path="/super-admin/tenants" element={<SuperAdminDashboard />} />   {/* placeholder — future page */}
            <Route path="/super-admin/plans"   element={<SuperAdminDashboard />} />   {/* placeholder — future page */}
            <Route path="/super-admin/platform" element={<SuperAdminDashboard />} /> {/* placeholder — future page */}
          </Route>

          {/* ── 404 ─────────────────────────────────────── */}
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center h-screen bg-[var(--bg-main)] text-[var(--text-primary)]">
              <h1 className="text-6xl font-extrabold text-[var(--accent-primary)]">404</h1>
              <p className="text-xl font-medium text-[var(--text-secondary)] mt-2">Halaman tidak ditemukan</p>
              <a href="/" className="mt-6 px-5 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all hover:scale-105"
                style={{ background: 'var(--accent-gradient)' }}>Kembali</a>
            </div>
          } />
        </Routes>

        <Toaster
          position="top-right"
          toastOptions={{
            className: '!bg-[var(--bg-surface-elevated)] !text-[var(--text-primary)] !border !border-[var(--border)] !rounded-xl !text-sm !font-semibold !shadow-xl !px-4 !py-3',
            success: { iconTheme: { primary: 'var(--success)', secondary: '#fff' } },
            error:   { iconTheme: { primary: 'var(--danger)',  secondary: '#fff' } },
          }}
        />

      </ThemeProvider>
    </AuthProvider>
  );
}
