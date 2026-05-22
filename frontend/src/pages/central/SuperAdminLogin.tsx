// frontend/src/pages/central/SuperAdminLogin.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Lock, Mail, Eye, EyeOff, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export function SuperAdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/central/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.message || 'Login gagal.');

      login(data.token, { ...data.user, tenant: null });
      toast.success('Selamat datang, Super Admin!');
      navigate('/super-admin');
    } catch {
      toast.error('Tidak bisa terhubung ke server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#080B12] text-[var(--text-primary)] px-4 animate-fade-in">
      <div className="w-full max-w-md bg-[#0F1420] border border-[#1E2740] rounded-2xl p-8 shadow-2xl shadow-black/40 flex flex-col gap-6">
        <div className="text-center flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white shadow-lg">
            <Shield size={28} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Central Admin</h1>
          <p className="text-sm text-gray-400 font-medium">Panel kontrol platform Lazee POS</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-400">Alamat Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="email" required placeholder="superadmin@lazeepos.com"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#080B12] border border-[#1E2740] text-white focus:border-red-500 focus:ring-1 focus:ring-red-500/50 outline-none transition-all text-sm"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-400">Kata Sandi</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type={showPassword ? 'text' : 'password'} required placeholder="••••••••"
                className="w-full pl-11 pr-11 py-3 rounded-xl bg-[#080B12] border border-[#1E2740] text-white focus:border-red-500 focus:ring-1 focus:ring-red-500/50 outline-none transition-all text-sm"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button
            type="submit" disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm mt-4 flex items-center justify-center gap-2 shadow-lg hover:shadow-red-500/30 transition-all hover:-translate-y-0.5 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #EF4444, #B91C1C)' }}
          >
            {isSubmitting ? 'Memverifikasi...' : 'Masuk Panel Pusat'} <ArrowRight size={16} />
          </button>
        </form>

        <div className="text-center">
          <Link to="/login" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            ← Kembali ke Login Toko
          </Link>
        </div>

        <div className="p-3 rounded-xl bg-[#080B12] border border-[#1E2740] text-xs text-gray-400 font-medium space-y-1">
          <p className="font-bold text-white mb-1">🔑 Demo Super Admin:</p>
          <p>• Email: <span className="font-mono text-red-400">superadmin@lazeepos.com</span></p>
          <p>• Sandi: <span className="font-mono text-red-400">superadmin123</span></p>
        </div>
      </div>
    </div>
  );
}
