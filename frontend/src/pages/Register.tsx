import { useState, useEffect } from 'react';
import { Store, ArrowRight, ShieldCheck, CheckCircle2, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    storeName: '',
    subdomain: '',
    planId: ''
  });
  
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch active plans (excluding free plan if any, although backend handles it)
    api.get('/payment/plans')
      .then(res => {
        const activePlans = res.data.plans.filter((p: any) => p.monthlyPrice > 0);
        setPlans(activePlans);
        if (activePlans.length > 0) {
          setFormData(prev => ({ ...prev, planId: activePlans[0].id.toString() }));
        }
      })
      .catch(err => console.error("Failed to load plans", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/register', formData);
      const token = res.data.token;
      
      // Auto-redirect to the tenant's new subdomain login page with token
      const tenantUrl = `http://${formData.subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '')}${domainSuffix}/login?token=${token}`;
      window.location.href = tenantUrl;
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Terjadi kesalahan saat pendaftaran.');
      setLoading(false);
    }
  };

  const domainSuffix = (() => {
    if (typeof window === 'undefined') return '.lazeepos.com';
    const hostname = window.location.hostname;
    if (hostname === 'localhost') return '.localhost';
    const parts = hostname.split('.');
    if (parts.length > 2) parts.shift();
    return '.' + parts.join('.');
  })();

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] flex items-center justify-center p-4 relative selection:bg-[var(--accent-primary)] selection:text-white">
      {/* Background Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[var(--accent-primary)]/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse-soft" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse-soft" style={{ animationDelay: '2s' }} />

      {/* Main Centered Wrapper Card */}
      <div className="w-full max-w-[1100px] bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl flex flex-col lg:flex-row overflow-hidden relative z-10 animate-fade-in">
        
        {/* LEFT PANEL - ILLUSTRATION & BRANDING */}
        <div className="hidden lg:flex flex-col justify-between w-5/12 bg-[var(--bg-main)] p-10 relative overflow-hidden border-r border-[var(--border)]">
          
          {/* Header */}
          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-2 text-[var(--accent-primary)] mb-8 w-max hover:opacity-80 transition-opacity">
              <Store size={28} strokeWidth={2.5} />
              <span className="text-xl font-extrabold tracking-tight text-[var(--text-primary)]">Lazee POS</span>
            </Link>
            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight mb-4 leading-tight">
              Mulai Ekosistem <br/><span className="text-transparent bg-clip-text" style={{ backgroundImage: 'var(--accent-gradient)' }}>Bisnis Anda</span> Sekarang.
            </h1>
            <p className="text-[var(--text-secondary)] font-medium text-sm max-w-[280px]">
              Tingkatkan efisiensi dan pantau bisnis secara real-time.
            </p>
          </div>

          {/* Dynamic Abstract Illustration (CSS Animated) */}
          <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center py-8">
            <div className="relative w-full max-w-[280px] aspect-square rounded-[2rem] bg-gradient-to-br from-[var(--bg-surface-elevated)] to-[var(--bg-surface)] border border-[var(--border)] shadow-2xl p-6 flex flex-col items-center justify-center animate-float group">
               {/* Background Glow inside card */}
               <div className="absolute inset-0 bg-[var(--accent-primary)]/5 rounded-[2rem] overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--accent-primary)]/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
               </div>
               
               {/* Isometric Animated Elements */}
               <div className="relative z-10 w-full flex flex-col items-center gap-5">
                  
                  {/* Floating Shield/Security Icon */}
                  <div className="w-14 h-14 rounded-2xl bg-[var(--bg-main)] border border-[var(--border)] shadow-xl flex items-center justify-center animate-float-reverse relative">
                     <div className="absolute inset-0 rounded-2xl border-2 border-[var(--accent-primary)]/30 animate-ping opacity-20" />
                     <Store className="text-[var(--accent-primary)]" size={24} />
                  </div>
                  
                  {/* Mock Form Lines */}
                  <div className="w-full space-y-2.5 bg-[var(--bg-main)] p-4 rounded-xl border border-[var(--border)] shadow-sm">
                     <div className="w-1/3 h-1.5 bg-[var(--text-secondary)]/20 rounded-full" />
                     <div className="w-full h-6 bg-[var(--bg-surface-elevated)] rounded-md border border-[var(--border)] overflow-hidden relative">
                        <div className="absolute top-0 left-0 h-full w-0 bg-[var(--accent-primary)]/20 animate-grow-bar" />
                     </div>
                     <div className="w-1/2 h-1.5 bg-[var(--text-secondary)]/20 rounded-full mt-2" />
                     <div className="w-full h-6 bg-[var(--bg-surface-elevated)] rounded-md border border-[var(--border)] overflow-hidden relative">
                        <div className="absolute top-0 left-0 h-full w-0 bg-emerald-500/20 animate-grow-bar" style={{ animationDelay: '0.5s' }} />
                     </div>
                  </div>
                  
                  {/* Submit Button Mock */}
                  <div className="w-full h-8 rounded-lg flex items-center justify-center gap-2 shadow-md" style={{ background: 'var(--accent-gradient)' }}>
                     <div className="w-3 h-3 rounded-full border-2 border-white/50 border-t-white animate-spin" />
                     <div className="w-12 h-1.5 bg-white/50 rounded-full" />
                  </div>

               </div>
               
               {/* Floating Badge */}
               <div className="absolute -bottom-4 -right-4 bg-[var(--bg-surface)] border border-[var(--border)] px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 animate-float-reverse backdrop-blur-md">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--text-secondary)]">Setup Instan</span>
               </div>
            </div>
          </div>

          <div className="relative z-10 bg-[var(--bg-surface-elevated)] p-5 rounded-2xl border border-[var(--border)] shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-emerald-500">
              <ShieldCheck size={20} />
              <span className="font-extrabold text-sm">Keamanan Terpusat</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
              Data terisolasi secara khusus (multi-tenant) dan terenkripsi tingkat lanjut untuk 100% kerahasiaan.
            </p>
          </div>

          {/* Decorative Background Patterns in Left Column */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none opacity-[0.03]">
            <div className="w-[600px] h-[600px] border-[1px] border-[var(--text-primary)] rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            <div className="w-[450px] h-[450px] border-[1px] border-[var(--text-primary)] rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* RIGHT PANEL - REGISTRATION FORM */}
        <div className="flex-1 p-8 md:p-12 lg:p-14 relative z-10 bg-[var(--bg-surface-elevated)] flex flex-col justify-center">
          
          {/* Mobile Header */}
          <div className="w-full lg:hidden flex justify-between items-center mb-8">
            <Link to="/" className="flex items-center gap-2 text-[var(--accent-primary)]">
              <Store size={24} strokeWidth={2.5} />
              <span className="text-lg font-extrabold tracking-tight text-[var(--text-primary)]">Lazee POS</span>
            </Link>
            <Link to="/" className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1">
              <ChevronLeft size={14} /> Kembali
            </Link>
          </div>
            
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold mb-2">Daftar Toko Baru</h2>
            <p className="text-[var(--text-secondary)] font-medium text-sm">
              Satu langkah lagi menuju sistem kasir terotomatisasi.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-xs font-bold mb-6 flex items-center gap-2 animate-shake">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-widest">Nama Lengkap</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[var(--bg-main)] border border-[var(--border)] px-4 py-3 rounded-xl focus:border-[var(--accent-primary)] outline-none transition-colors font-medium text-sm" placeholder="Budi Santoso" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-widest">Email (Login Utama)</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-[var(--bg-main)] border border-[var(--border)] px-4 py-3 rounded-xl focus:border-[var(--accent-primary)] outline-none transition-colors font-medium text-sm" placeholder="budi@email.com" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-widest">Kata Sandi (Password)</label>
              <input required type="password" minLength={6} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-[var(--bg-main)] border border-[var(--border)] px-4 py-3 rounded-xl focus:border-[var(--accent-primary)] outline-none transition-colors font-medium text-sm" placeholder="Minimal 6 karakter" />
            </div>

            <div className="pt-4 border-t border-[var(--border)] border-dashed">
              <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-widest">Nama Bisnis / Toko</label>
              <input required type="text" value={formData.storeName} onChange={e => setFormData({...formData, storeName: e.target.value})} className="w-full bg-[var(--bg-main)] border border-[var(--border)] px-4 py-3 rounded-xl focus:border-[var(--accent-primary)] outline-none transition-colors font-medium text-sm" placeholder="Kopi Senja" />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-widest">Subdomain Toko Anda</label>
              <div className="flex items-center rounded-xl focus-within:ring-2 focus-within:ring-[var(--accent-primary)]/30 transition-shadow bg-[var(--bg-main)] border border-[var(--border)]">
                <input required type="text" value={formData.subdomain} onChange={e => setFormData({...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} className="w-full bg-transparent border-none px-4 py-3 outline-none font-medium text-sm" placeholder="kopisenja" />
                <div className="bg-[var(--bg-surface)] border-l border-[var(--border)] px-4 py-3 rounded-r-xl text-[var(--text-secondary)] font-bold text-xs whitespace-nowrap">
                  {domainSuffix}
                </div>
              </div>
              <p className="text-[9px] text-[var(--text-secondary)] mt-1.5 font-medium flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-[var(--text-secondary)]" />
                Hanya huruf kecil, angka, dan tanda hubung (-).
              </p>
            </div>

            <div className="pt-4 border-t border-[var(--border)] border-dashed">
              <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-widest">Pilih Paket Langganan</label>
              <div className="relative">
                <select required value={formData.planId} onChange={e => setFormData({...formData, planId: e.target.value})} className="w-full bg-[var(--bg-main)] border border-[var(--border)] px-4 py-3 rounded-xl focus:border-[var(--accent-primary)] outline-none transition-colors appearance-none font-bold text-sm shadow-sm">
                  {plans.length === 0 && <option value="">Memuat Paket...</option>}
                  {plans.map((p, idx) => (
                    <option key={idx} value={p.id}>
                      {p.name} — Rp {p.monthlyPrice?.toLocaleString('id-ID')} / bln
                    </option>
                  ))}
                </select>
                {/* Custom Select Arrow */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>

            <button disabled={loading} type="submit" className="w-full py-3.5 rounded-xl text-sm font-bold text-white shadow-lg hover:shadow-[var(--accent-primary)]/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:hover:translate-y-0" style={{ background: 'var(--accent-gradient)' }}>
              {loading ? 'Memproses...' : 'Kirim Pengajuan Pendaftaran'} <ArrowRight size={16} />
            </button>
            
            <p className="text-center text-xs text-[var(--text-secondary)] mt-4 font-medium">
              Sudah memiliki toko aktif? <button type="button" onClick={() => window.location.href = '/'} className="text-[var(--text-primary)] font-extrabold hover:text-[var(--accent-primary)] transition-colors">Masuk di sini</button>
            </p>
          </form>
        </div>
        
      </div>
    </div>
  );
}
