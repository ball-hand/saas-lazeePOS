import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import { LandingPage } from './pages/LandingPage';
import { Register } from './pages/Register';
import { Login } from './pages/Login';
import { CentralLogin } from './pages/central/CentralLogin';
import { CentralDashboard } from './pages/central/CentralDashboard';
import { CentralTenants } from './pages/central/CentralTenants';
import { CentralPlans } from './pages/central/CentralPlans';
import { CentralPlatform } from './pages/central/CentralPlatform';
import { CentralServerStatus } from './pages/central/CentralServerStatus';
import { CentralTenantDetail } from './pages/central/CentralTenantDetail';
import { CentralBilling } from './pages/central/CentralBilling';
import { CentralTickets } from './pages/central/CentralTickets';
import { CentralReleases } from './pages/central/CentralReleases';
import { CentralSystemLogs } from './pages/central/CentralSystemLogs';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ReleaseManager } from './components/ReleaseManager';

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
import { Support } from './pages/Support';
import { Users } from './pages/Users';

import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ReleaseManager />

        <Routes>

          {/* ── PUBLIC ─────────────────────────────────── */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/central-login" element={<CentralLogin />} />

          {/* ── TENANT ROUTES  (toko subdomain) ─────────── */}
          <Route element={<ProtectedRoute />}>
            <Route path="/pos"        element={<POS />} />
            <Route path="/products"   element={<Products />} />
            <Route path="/warehouse"  element={<Warehouse />} />
            <Route path="/receipts"   element={<Receipts />} />
            <Route path="/cashflow"   element={<CashFlow />} />
            <Route path="/billing"    element={<Billing />} />
            <Route path="/support"    element={<Support />} />
          </Route>

          {/* ── TENANT ADMIN ROUTES ────────────────────── */}
          <Route element={<ProtectedRoute requireAdmin={true} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users"     element={<Users />} />
            <Route path="/discounts" element={<Discounts />} />
            <Route path="/settings"  element={<Settings />} />
          </Route>

          {/* ── CENTRAL ROUTES ──────────────────────── */}
          <Route element={<ProtectedRoute requireCentral={true} />}>
            <Route path="/central"         element={<CentralDashboard />} />
            <Route path="/central/tenants" element={<CentralTenants />} />
            <Route path="/central/tenants/:id" element={<CentralTenantDetail />} />
            <Route path="/central/billing" element={<CentralBilling />} />
            <Route path="/central/tickets" element={<CentralTickets />} />
            <Route path="/central/releases" element={<CentralReleases />} />
            <Route path="/central/plans"   element={<CentralPlans />} />
            <Route path="/central/platform" element={<CentralPlatform />} />
            <Route path="/central/server-status" element={<CentralServerStatus />} />
            <Route path="/central/system" element={<CentralSystemLogs />} />
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
