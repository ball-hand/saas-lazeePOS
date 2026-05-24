import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layout } from './Layout';

interface ProtectedRouteProps {
  requireAdmin?: boolean;
  requireCentral?: boolean;
}

export function ProtectedRoute({ requireAdmin = false, requireCentral = false }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, isCentral } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0B0E14]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--accent-primary)]" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (requireCentral && !isCentral) return <Navigate to="/" replace />;
  // requireAdmin — let central pass too (they manage tenants too)
  if (requireAdmin && user?.role !== 'admin' && !isCentral) return <Navigate to="/" replace />;

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
