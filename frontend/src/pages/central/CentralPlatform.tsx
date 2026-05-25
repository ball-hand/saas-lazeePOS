import { useState, useEffect } from 'react';
import { 
  Settings, Save, Globe, Palette, Moon, Sun, Check, LayoutTemplate, Type, Eye, EyeOff, Plus, Bell
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { getMediaUrl } from '../../api/client';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { RichTextEditor } from '../../components/shared/RichTextEditor';

export function CentralPlatform() {
  const { user } = useAuth();
  const { themeMode, primaryColor, logoUrl, updateTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  
  // General Form State
  const [formData, setFormData] = useState({
    platformName: 'Lazee POS',
    supportEmail: 'support@lazeepos.com',
    allowRegistrations: true,
    maintenanceMode: false,
    maxTenants: 1000,
  });

  // CMS Landing Page State
  const [cmsConfig, setCmsConfig] = useState({
    hero: { visible: true, headline: 'Platform Kasir Pintar untuk Semua Bisnis', subheadline: 'Tingkatkan efisiensi dan pantau bisnis Anda secara real-time dari mana saja. Bergabunglah dengan ribuan pemilik usaha yang sudah mempercayakan operasional harian mereka pada Lazee POS.' },
    announcement: { visible: false, content: '' },
    features: { visible: true },
    demo: { visible: true },
    pricing: { visible: true },
    faq: { visible: true }
  });

  useEffect(() => {
    const savedCms = localStorage.getItem('central_cms_config');
    if (savedCms) {
      try {
        setCmsConfig(JSON.parse(savedCms));
      } catch(e) {}
    }
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('image', file);
    
    const loadingToast = toast.loading('Mengunggah logo...');
    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateTheme({ logoUrl: res.data.url });
      if (user?.role === 'SUPERADMIN') {
         localStorage.setItem('central_logoUrl', res.data.url);
      }
      toast.success('Logo berhasil diperbarui', { id: loadingToast });
    } catch (err) {
      toast.error('Gagal mengunggah logo', { id: loadingToast });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      localStorage.setItem('central_cms_config', JSON.stringify(cmsConfig));
      toast.success('Pengaturan platform & CMS berhasil disimpan');
    } catch (err) {
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setLoading(false);
    }
  };

  const toggleCmsVisibility = (section: keyof typeof cmsConfig) => {
    setCmsConfig({
      ...cmsConfig,
      [section]: { ...cmsConfig[section], visible: !cmsConfig[section].visible }
    });
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6 pb-10 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--border)] pb-6 sticky top-0 bg-[var(--bg-main)] z-10 pt-2">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] flex items-center gap-3">
            <Settings className="text-[var(--accent-primary)]" size={32} /> Pengaturan Platform
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Konfigurasi global platform, tampilan UI, dan CMS Landing Page.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)] transition-all font-bold shadow-lg shadow-[var(--accent-primary)]/20 hover:shadow-[var(--accent-primary)]/40 hover:-translate-y-0.5"
        >
          <Save size={18} /> {loading ? 'Menyimpan...' : 'Simpan Semua Perubahan'}
        </button>
      </div>

      <div className="space-y-8">
        
        {/* SECTION 1: Pengaturan Umum */}
        <section className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-3xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-3">
            <Globe className="text-blue-500" size={24} /> 1. Pengaturan Umum
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Nama Platform / Merek</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none transition-colors font-medium" 
                  value={formData.platformName} onChange={e => setFormData({...formData, platformName: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Email Dukungan (Support)</label>
                <input type="email" className="w-full px-4 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none transition-colors font-medium" 
                  value={formData.supportEmail} onChange={e => setFormData({...formData, supportEmail: e.target.value})} />
              </div>
            </div>
            
            <div className="space-y-4">
              <label className="flex items-start gap-4 p-4 rounded-2xl border border-[var(--border)] hover:border-[var(--accent-primary)] transition-colors cursor-pointer bg-[var(--bg-main)]">
                <input type="checkbox" className="mt-1 w-5 h-5 rounded text-[var(--accent-primary)] bg-[var(--bg-surface)] border-[var(--border)] focus:ring-[var(--accent-primary)]"
                  checked={formData.allowRegistrations} onChange={e => setFormData({...formData, allowRegistrations: e.target.checked})} />
                <div>
                  <span className="block font-bold text-[var(--text-primary)]">Buka Pendaftaran (Self-Service)</span>
                  <span className="block text-sm text-[var(--text-secondary)] mt-1">Izinkan pengguna baru mendaftar dan membuat tenant secara mandiri.</span>
                </div>
              </label>
              
              <label className="flex items-start gap-4 p-4 rounded-2xl border border-[var(--border)] hover:border-red-500/50 transition-colors cursor-pointer bg-[var(--bg-main)]">
                <input type="checkbox" className="mt-1 w-5 h-5 rounded text-red-500 bg-[var(--bg-surface)] border-[var(--border)] focus:ring-red-500"
                  checked={formData.maintenanceMode} onChange={e => setFormData({...formData, maintenanceMode: e.target.checked})} />
                <div>
                  <span className="block font-bold text-[var(--text-primary)]">Mode Maintenance</span>
                  <span className="block text-sm text-[var(--text-secondary)] mt-1">Tutup akses aplikasi untuk semua tenant. Hanya Superadmin yang bisa login.</span>
                </div>
              </label>
            </div>
          </div>
        </section>

        {/* SECTION 2: Tampilan & Visual */}
        <section className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-3xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-8 flex items-center gap-3">
            <Palette className="text-purple-500" size={24} /> 2. Tampilan & Visual
          </h2>
          
          <div className="space-y-10">
            {/* Logo Upload */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-28 h-28 rounded-3xl bg-[var(--bg-main)] border-2 border-dashed border-[var(--border)] flex items-center justify-center overflow-hidden p-3 shadow-inner">
                {logoUrl ? (
                  <img src={getMediaUrl(logoUrl)} alt="Logo" className="max-w-full max-h-full object-contain drop-shadow-md" />
                ) : (
                  <Globe className="text-[var(--text-secondary)] opacity-50" size={40} />
                )}
              </div>
              <div>
                <h3 className="font-bold text-[var(--text-primary)] text-lg mb-2">Logo Utama Platform</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4 max-w-md">Logo transparan dengan proporsi kotak disarankan. Ekstensi PNG, JPG, atau WebP. Maks 2MB.</p>
                <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-[var(--border)] hover:border-[var(--accent-primary)] bg-[var(--bg-main)] transition-colors cursor-pointer text-sm font-bold text-[var(--text-primary)]">
                  Pilih Gambar Logo Baru
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-8 border-t border-[var(--border)]">
              {/* Mode Gelap / Terang */}
              <div>
                <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Tema Default Dasbor</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => updateTheme({ themeMode: 'light' })}
                    className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all ${
                      themeMode === 'light' ? 'border-[var(--accent-primary)] bg-[var(--accent-primary-transparent)]' : 'border-[var(--border)] hover:border-[var(--text-secondary)] bg-[var(--bg-main)]'
                    }`}
                  >
                    <div className={`p-3 rounded-full shadow-sm ${themeMode === 'light' ? 'bg-[var(--accent-primary)] text-white' : 'bg-white text-gray-500 border border-gray-200'}`}>
                      <Sun size={24} />
                    </div>
                    <span className={`font-bold ${themeMode === 'light' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`}>Light Mode</span>
                  </button>
                  
                  <button
                    onClick={() => updateTheme({ themeMode: 'dark' })}
                    className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all ${
                      themeMode === 'dark' ? 'border-[var(--accent-primary)] bg-[var(--accent-primary-transparent)]' : 'border-[var(--border)] hover:border-[var(--text-secondary)] bg-[var(--bg-main)]'
                    }`}
                  >
                    <div className={`p-3 rounded-full shadow-sm ${themeMode === 'dark' ? 'bg-[var(--accent-primary)] text-white' : 'bg-[#1a1b23] text-gray-400 border border-gray-800'}`}>
                      <Moon size={24} />
                    </div>
                    <span className={`font-bold ${themeMode === 'dark' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`}>Dark Mode</span>
                  </button>
                </div>
              </div>

              {/* Warna Aksen */}
              <div>
                <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4">Warna Aksen Global</h3>
                <div className="flex flex-wrap gap-4">
                  {[
                    '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', 
                    '#EF4444', '#EC4899', '#14B8A6', '#6366F1'
                  ].map((color) => (
                    <button
                      key={color}
                      onClick={() => updateTheme({ primaryColor: color })}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${
                        primaryColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--bg-surface-elevated)] scale-110' : 'hover:-translate-y-1'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {primaryColor === color && <Check className="text-white" size={20} strokeWidth={3} />}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-4">
                  Menentukan warna *button*, *link*, dan elemen grafis interaktif baik di Central Admin maupun Landing Page.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: CMS Landing Page */}
        <section className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-3">
              <LayoutTemplate className="text-emerald-500" size={24} /> 3. Konten Landing Page (CMS)
            </h2>
            <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-bold text-[var(--accent-primary)] hover:underline">
              Lihat Hasil <Globe size={16} />
            </a>
          </div>

          <div className="space-y-6">
            {/* HERO SETTINGS */}
            <div className="border border-[var(--border)] rounded-2xl overflow-hidden">
              <div className="bg-[var(--bg-main)] p-4 flex items-center justify-between border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <Type className="text-[var(--text-secondary)]" size={20} />
                  <h3 className="font-bold text-[var(--text-primary)]">1. Hero Section</h3>
                </div>
                <button onClick={() => toggleCmsVisibility('hero')} className={`p-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors ${cmsConfig.hero.visible ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-500/10 text-gray-500'}`}>
                  {cmsConfig.hero.visible ? <><Eye size={16}/> Tampil</> : <><EyeOff size={16}/> Sembunyi</>}
                </button>
              </div>
              {cmsConfig.hero.visible && (
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Headline Utama</label>
                    <input type="text" className="w-full px-4 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none font-bold text-lg" 
                      value={cmsConfig.hero.headline} onChange={e => setCmsConfig({...cmsConfig, hero: {...cmsConfig.hero, headline: e.target.value}})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Sub-Headline</label>
                    <textarea className="w-full px-4 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none resize-none" rows={2}
                      value={cmsConfig.hero.subheadline} onChange={e => setCmsConfig({...cmsConfig, hero: {...cmsConfig.hero, subheadline: e.target.value}})} />
                  </div>
                </div>
              )}
            </div>

            {/* ANNOUNCEMENT / BANNER SETTINGS */}
            <div className="border border-[var(--border)] rounded-2xl overflow-hidden">
              <div className="bg-[var(--bg-main)] p-4 flex items-center justify-between border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <Bell className="text-[var(--text-secondary)]" size={20} />
                  <h3 className="font-bold text-[var(--text-primary)]">2. Pengumuman / Banner / Rich Text</h3>
                </div>
                <button onClick={() => toggleCmsVisibility('announcement')} className={`p-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors ${cmsConfig.announcement.visible ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-500/10 text-gray-500'}`}>
                  {cmsConfig.announcement.visible ? <><Eye size={16}/> Tampil</> : <><EyeOff size={16}/> Sembunyi</>}
                </button>
              </div>
              {cmsConfig.announcement.visible && (
                <div className="p-6">
                  <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Konten HTML Rich Text</label>
                  <div className="bg-[var(--bg-main)] rounded-xl border border-[var(--border)] overflow-hidden">
                     <RichTextEditor 
                        value={cmsConfig.announcement.content} 
                        onChange={(val) => setCmsConfig({...cmsConfig, announcement: {...cmsConfig.announcement, content: val}})} 
                     />
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-2">Bisa digunakan untuk membuat artikel kecil, promo bulan ini, atau pengumuman maintenance sistem.</p>
                </div>
              )}
            </div>

            {/* OTHER SECTIONS VISIBILITY */}
            <div className="border border-[var(--border)] rounded-2xl p-6">
              <h3 className="font-bold text-[var(--text-primary)] mb-4">Pengaturan Visibilitas Segmen Lainnya</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                
                <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border)]">
                  <span className="font-bold text-sm">Fitur Utama</span>
                  <button onClick={() => toggleCmsVisibility('features')} className={cmsConfig.features.visible ? 'text-emerald-500' : 'text-gray-500'}>
                    {cmsConfig.features.visible ? <Eye size={20}/> : <EyeOff size={20}/>}
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border)]">
                  <span className="font-bold text-sm">Simulator Interaktif</span>
                  <button onClick={() => toggleCmsVisibility('demo')} className={cmsConfig.demo.visible ? 'text-emerald-500' : 'text-gray-500'}>
                    {cmsConfig.demo.visible ? <Eye size={20}/> : <EyeOff size={20}/>}
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border)]">
                  <span className="font-bold text-sm">Paket Harga</span>
                  <button onClick={() => toggleCmsVisibility('pricing')} className={cmsConfig.pricing.visible ? 'text-emerald-500' : 'text-gray-500'}>
                    {cmsConfig.pricing.visible ? <Eye size={20}/> : <EyeOff size={20}/>}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border)]">
                  <span className="font-bold text-sm">Tanya Jawab (FAQ)</span>
                  <button onClick={() => toggleCmsVisibility('faq')} className={cmsConfig.faq.visible ? 'text-emerald-500' : 'text-gray-500'}>
                    {cmsConfig.faq.visible ? <Eye size={20}/> : <EyeOff size={20}/>}
                  </button>
                </div>

              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
