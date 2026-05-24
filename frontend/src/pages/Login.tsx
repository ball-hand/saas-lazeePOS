import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Lock, Mail, Eye, EyeOff, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

export function Login() {
  const { login } = useAuth();
  const { storeName } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.token, data.user);
      toast.success(`Selamat datang, ${data.user.name}! 👋`);
      navigate(data.user.role === 'central' ? '/central' : '/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Email atau password salah.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] px-4 animate-fade-in">
      <div className="w-full max-w-md bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-8 shadow-xl flex flex-col gap-6">

        {/* Logo & Header */}
        <div className="text-center flex flex-col items-center gap-2">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md"
            style={{ background: 'var(--accent-gradient)' }}
          >
            <Store size={24} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mt-2 text-[var(--text-primary)]">
            {storeName || 'LazeePOS'}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] font-medium">
            Masuk ke akun kasir atau administrator Anda
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              Alamat Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
              <input
                type="email"
                required
                placeholder="nama@toko.com"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none transition-all text-sm font-medium"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                className="w-full pl-11 pr-11 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none transition-all text-sm font-medium tracking-wide"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-md"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm mt-2 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--accent-gradient)' }}
          >
            {isSubmitting ? 'Memproses Masuk...' : 'Masuk ke Aplikasi'}
          </button>
        </form>

        {/* Demo credentials */}
        <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-xs text-[var(--text-secondary)] font-medium space-y-1">
          <p className="font-bold text-[var(--text-primary)] mb-1">💡 Akun Demo:</p>
          <p>• Admin: <span className="font-mono text-[var(--accent-primary)]">demo@lazeepos.com</span> / <span className="font-mono text-[var(--accent-primary)]">Demo123!</span></p>
          <p>• Kasir: <span className="font-mono text-[var(--accent-primary)]">kasir@lazeepos.com</span> / <span className="font-mono text-[var(--accent-primary)]">Kasir123!</span></p>
        </div>
      </div>
    </div>
  );
}
