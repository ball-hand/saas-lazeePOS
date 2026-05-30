import { useState, useEffect } from 'react';
import { 
  Settings, Save, Globe, Palette, Moon, Sun, Check, LayoutTemplate, Type, Eye, EyeOff, Bell
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import toast from 'react-hot-toast';
import api, { getMediaUrl } from '../../api/client';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { RichTextEditor } from '../../components/shared/RichTextEditor';
import { Breadcrumb } from '../../components/shared/Breadcrumb';

export function CentralPlatform() {
  const { user } = useAuth();
  const { themeMode, primaryColor, logoUrl, updateTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('umum');
  
  // General Form State
  const [formData, setFormData] = useState({
    platformName: 'Lazee POS',
    supportEmail: 'support@lazeepos.com',
    allowRegistrations: true,
    maintenanceMode: false,
    maxTenants: 1000,
  });

  // CMS Landing Page State
  const [cmsConfig, setCmsConfig] = useState<any>({
    hero: { visible: true, headline: 'Platform Kasir Pintar untuk Semua Bisnis', subheadline: 'Tingkatkan efisiensi dan pantau bisnis Anda secara real-time dari mana saja. Bergabunglah dengan ribuan pemilik usaha yang sudah mempercayakan operasional harian mereka pada Lazee POS.' },
    announcement: { visible: false, content: '' },
    features: { visible: true, items: [
      { icon: 'Store', title: 'Multi-Tenant SaaS', desc: 'Isolasi subdomain, branding per toko, landing page publik otomatis' },
      { icon: 'Monitor', title: 'Terminal POS', desc: 'Checkout cepat, scan barcode, split payment, hold order' },
      { icon: 'LayoutDashboard', title: 'Manajemen Meja', desc: 'Layout meja drag-and-drop, status real-time, QR Code pelanggan' },
      { icon: 'ChefHat', title: 'Antrean Dapur', desc: 'Kitchen Display System, status pesanan, notifikasi real-time' },
      { icon: 'Package', title: 'Produk & Gudang', desc: 'Katalog SKU, stok otomatis terpotong, audit inventaris' },
      { icon: 'Tag', title: 'Diskon Cerdas', desc: 'BOGO, diskon persen, minimal belanja, kupon kondisional' },
      { icon: 'Wallet', title: 'Buku Kas Ledger', desc: 'Arus kas masuk/keluar, setoran kasir, rekonsiliasi harian' },
      { icon: 'Printer', title: 'Printer & Hardware', desc: 'Thermal printer (58mm/80mm), scanner barcode, kalibrasi periferal' },
      { icon: 'Receipt', title: 'Struk Kustom', desc: 'Desain struk, logo, pesan penutup, QR Code di struk' },
      { icon: 'Smartphone', title: 'Menu Pelanggan', desc: 'Scan QR → lihat menu digital, pesan langsung dari meja' },
      { icon: 'Users', title: 'Manajemen Staf', desc: 'Role-based access (Owner, Admin, Kasir), audit log aksi' },
      { icon: 'CreditCard', title: 'Billing & Langganan', desc: 'Midtrans payment gateway, QRIS, VA Bank, upgrade paket' },
      { icon: 'Ticket', title: 'Support Ticketing', desc: 'Sistem tiket komplain, chat real-time dengan Central Admin' },
      { icon: 'BarChart3', title: 'Dashboard Analytics', desc: 'Grafik penjualan, statistik harian, revenue tracking' },
      { icon: 'Palette', title: 'Kustomisasi Tema', desc: 'Light/Dark mode, warna aksen, logo branding' },
      { icon: 'Rocket', title: 'Release Management', desc: 'Push update ke semua tenant, mandatory update' }
    ] },
    howItWorks: { visible: true, steps: [
      { step: "01", title: "Registrasi Tenant", desc: "Daftarkan brand Anda dan pilih subdomain unik toko Anda secara gratis." },
      { step: "02", title: "Branding Toko", desc: "Atur warna tema, Landing Page publik, dan pajak PPN bawaan." },
      { step: "03", title: "Input Katalog", desc: "Tambahkan produk, SKU barang, harga pokok modal, dan jumlah stok awal." },
      { step: "04", title: "Siap Checkout", desc: "Buka Terminal POS, scan produk, dan cetak struk pertama pelanggan Anda!" }
    ] },
    demo: { visible: true },
    pricing: { visible: true },
    faq: { visible: true, items: [
      { q: 'Apakah saya bisa menggunakan nama domain sendiri (Custom Domain)?', a: 'Saat ini setiap tenant akan mendapatkan subdomain gratis (contoh: tokoanda.lazeepos.com). Fitur custom domain sedang dalam tahap pengembangan.' },
      { q: 'Bagaimana keamanan data pelanggan dan transaksi saya?', a: 'Sangat aman. Kami menggunakan sistem isolasi tenant (multi-tenant architecture) di tingkat database, sehingga data antar toko tidak akan pernah tercampur.' },
      { q: 'Apakah aplikasi bisa digunakan saat offline (tanpa internet)?', a: 'Sistem membutuhkan koneksi internet (online). Namun cache browser akan menyimpan keranjang belanja sehingga kasir tidak hilang datanya jika koneksi terputus sesaat.' },
      { q: 'Apakah ada batasan jumlah produk yang bisa ditambahkan?', a: 'Tergantung paket yang Anda pilih. Paket Gratis mendukung hingga 100 SKU Produk, sedangkan paket Premium atau Enterprise tidak memiliki batasan (unlimited).' }
    ] },
    docs: { visible: true, topics: [
      {
        id: 'getting-started',
        title: 'Mulai Cepat',
        content: `<h2>Selamat Datang di Panduan LazeePOS</h2>
          <p>LazeePOS dirancang untuk memudahkan operasional bisnis Anda, dari skala UMKM hingga Enterprise.</p>
          <p>Langkah pertama yang harus Anda lakukan:</p>
          <ol>
            <li>Daftar akun di halaman utama.</li>
            <li>Atur nama dan subdomain toko Anda.</li>
            <li>Tambahkan produk pertama Anda di menu Produk.</li>
            <li>Buka Terminal POS untuk mulai bertransaksi!</li>
          </ol>
        `
      },
      {
        id: 'pos',
        title: 'Terminal Kasir (POS)',
        content: `<h2>Menggunakan Terminal POS</h2>
          <p>Terminal POS adalah layar utama tempat kasir bekerja.</p>
          <ul>
            <li><strong>Pilih Produk:</strong> Klik produk atau gunakan scanner barcode.</li>
            <li><strong>Tahan Pesanan (Hold):</strong> Simpan pesanan sementara untuk pelanggan yang masih memilih.</li>
            <li><strong>Diskon:</strong> Terapkan kupon atau diskon manual.</li>
            <li><strong>Checkout:</strong> Selesaikan transaksi dengan metode bayar Tunai, QRIS, atau Kartu.</li>
          </ul>
        `
      },
      {
        id: 'inventory',
        title: 'Gudang & Stok',
        content: `<h2>Manajemen Inventaris</h2>
          <p>Kelola persediaan barang secara real-time. Setiap transaksi yang selesai di POS akan langsung memotong stok di Gudang.</p>
          <p>Fitur utama:</p>
          <ul>
            <li>Notifikasi Stok Menipis.</li>
            <li>Audit Stok Manual.</li>
            <li>Lacak riwayat masuk/keluar barang.</li>
          </ul>
        `
      }
    ] },
    footer: { tagline: 'Lazee POS membantu UMKM & Perusahaan Franchise mengelola penjualan cabang, melacak arus kas, dan mempermudah checkout secara real-time.', copyright: `© ${new Date().getFullYear()} PT Lazee Teknologi Global. Hak Cipta Dilindungi.` }
  });

  useEffect(() => {
    const fetchCms = async () => {
      try {
        const { data } = await api.get('/central/platform/cms');
        if (data.cmsConfig) {
          setCmsConfig((prev: any) => ({ ...prev, ...data.cmsConfig }));
        }
      } catch (e) {
        console.error('Failed to load CMS config', e);
      }
    };
    fetchCms();
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
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
      await api.post('/central/platform/cms', { cmsConfig });
      toast.success('Pengaturan CMS berhasil disimpan');
    } catch (err) {
      toast.error('Gagal menyimpan pengaturan CMS');
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
    <div className="relative bg-[var(--bg-surface-elevated)] rounded-2xl border border-[var(--border)] shadow-sm min-h-[80vh] flex flex-col overflow-hidden animate-fade-in">
      {/* Subtle Dot Pattern Background */}
      <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--text-primary) 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
      
      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--border)] p-6 bg-[var(--bg-surface-elevated)]">
        <div>
          <div className="flex items-center gap-3">
            <Settings className="text-[var(--accent-primary)]" size={24} />
            <Breadcrumb items={[{ label: 'Central Admin' }, { label: 'Pengaturan Platform' }]} />
          </div>
          <p className="text-[var(--text-secondary)] mt-2 text-sm font-medium">
            Konfigurasi global platform, tampilan UI, dan CMS Landing Page.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)] transition-all font-bold shadow-lg shadow-[var(--accent-primary)]/20 hover:shadow-[var(--accent-primary)]/40 hover:-translate-y-0.5"
        >
          <Save size={18} /> {loading ? 'Menyimpan...' : 'Simpan Semua Perubahan'}
        </button>
      </div>

      <div className="flex space-x-2 border-b border-[var(--border)] overflow-x-auto custom-scrollbar px-6 mt-4">
        <button type="button" onClick={() => setActiveTab('umum')} className={`pb-3 px-3 border-b-2 font-bold text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'umum' ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border)]'}`}>
          <Settings size={16} /> Pengaturan Umum
        </button>
        <button type="button" onClick={() => setActiveTab('visual')} className={`pb-3 px-3 border-b-2 font-bold text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'visual' ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border)]'}`}>
          <Palette size={16} /> Tampilan & Visual
        </button>
        <button type="button" onClick={() => setActiveTab('cms')} className={`pb-3 px-3 border-b-2 font-bold text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'cms' ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border)]'}`}>
          <LayoutTemplate size={16} /> CMS Landing Page
        </button>
      </div>

      <div className="relative z-10 p-6 flex-1 space-y-8">
        
        {/* SECTION 1: Pengaturan Umum */}
        <section className={`bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-3xl p-5 md:p-5 shadow-sm animate-fade-in ${activeTab === 'umum' ? 'block' : 'hidden'}`}>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-3">
            <Globe className="text-blue-500" size={24} /> 1. Pengaturan Umum
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Nama Platform / Merek</label>
                <input type="text" className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none transition-colors font-medium" 
                  value={formData.platformName} onChange={e => setFormData({...formData, platformName: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Email Dukungan (Support)</label>
                <input type="email" className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none transition-colors font-medium" 
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
        <section className={`bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-3xl p-5 md:p-5 shadow-sm animate-fade-in ${activeTab === 'visual' ? 'block' : 'hidden'}`}>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-8 flex items-center gap-3">
            <Palette className="text-purple-500" size={24} /> 2. Tampilan & Visual
          </h2>
          
          <div className="space-y-10">
            {/* Logo Upload */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
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
        <section className={`bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-3xl p-5 md:p-5 shadow-sm animate-fade-in ${activeTab === 'cms' ? 'block' : 'hidden'}`}>
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
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Headline Utama</label>
                    <input type="text" className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none font-bold text-lg" 
                      value={cmsConfig.hero.headline} onChange={e => setCmsConfig({...cmsConfig, hero: {...cmsConfig.hero, headline: e.target.value}})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Sub-Headline</label>
                    <textarea className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none resize-none" rows={2}
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
                <div className="p-5">
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

            {/* FEATURES EDITOR */}
            <div className="border border-[var(--border)] rounded-2xl overflow-hidden">
              <div className="bg-[var(--bg-main)] p-4 flex items-center justify-between border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-[var(--text-primary)]">3. Fitur Utama</h3>
                </div>
                <button onClick={() => toggleCmsVisibility('features')} className={`p-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors ${cmsConfig.features.visible ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-500/10 text-gray-500'}`}>
                  {cmsConfig.features.visible ? <><Eye size={16}/> Tampil</> : <><EyeOff size={16}/> Sembunyi</>}
                </button>
              </div>
              {cmsConfig.features.visible && (
                <div className="p-5 space-y-4">
                  {(cmsConfig.features.items || []).map((feature: any, idx: number) => {
                    const IconComponent = (LucideIcons as any)[feature.icon] || LucideIcons.HelpCircle;
                    return (
                    <div key={idx} className="flex gap-4 items-start border border-[var(--border)] p-4 rounded-xl">
                      <div className="flex-1 space-y-3">
                        <div className="flex gap-3">
                          <div className="relative w-1/3">
                            <input className="w-full pl-3 pr-10 py-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border)] text-sm focus:border-[var(--accent-primary)] outline-none" placeholder="Nama Ikon" value={feature.icon} onChange={e => {
                              const newItems = [...cmsConfig.features.items];
                              newItems[idx].icon = e.target.value;
                              setCmsConfig({...cmsConfig, features: {...cmsConfig.features, items: newItems}});
                            }} />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none">
                              <IconComponent size={16} />
                            </div>
                          </div>
                          <input className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border)] text-sm font-bold focus:border-[var(--accent-primary)] outline-none" placeholder="Judul Fitur" value={feature.title} onChange={e => {
                            const newItems = [...cmsConfig.features.items];
                            newItems[idx].title = e.target.value;
                            setCmsConfig({...cmsConfig, features: {...cmsConfig.features, items: newItems}});
                          }} />
                        </div>
                        <textarea className="w-full px-3 py-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border)] text-sm focus:border-[var(--accent-primary)] outline-none" placeholder="Deskripsi Fitur" rows={2} value={feature.desc} onChange={e => {
                          const newItems = [...cmsConfig.features.items];
                          newItems[idx].desc = e.target.value;
                          setCmsConfig({...cmsConfig, features: {...cmsConfig.features, items: newItems}});
                        }} />
                      </div>
                      <button onClick={() => {
                        const newItems = cmsConfig.features.items.filter((_: any, i: number) => i !== idx);
                        setCmsConfig({...cmsConfig, features: {...cmsConfig.features, items: newItems}});
                      }} className="text-red-500 font-bold text-sm mt-2 hover:bg-red-500/10 p-2 rounded-lg transition-colors">Hapus</button>
                    </div>
                  )})}
                  <button onClick={() => {
                    const newItems = [...(cmsConfig.features.items || []), { icon: 'Star', title: '', desc: '' }];
                    setCmsConfig({...cmsConfig, features: {...cmsConfig.features, items: newItems}});
                  }} className="px-4 py-2 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl font-bold text-sm hover:border-[var(--accent-primary)] text-[var(--text-primary)]">
                    + Tambah Fitur
                  </button>
                </div>
              )}
            </div>

            {/* HOW IT WORKS EDITOR */}
            <div className="border border-[var(--border)] rounded-2xl overflow-hidden">
              <div className="bg-[var(--bg-main)] p-4 flex items-center justify-between border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-[var(--text-primary)]">4. Cara Kerja</h3>
                </div>
                <button onClick={() => toggleCmsVisibility('howItWorks')} className={`p-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors ${cmsConfig.howItWorks.visible ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-500/10 text-gray-500'}`}>
                  {cmsConfig.howItWorks.visible ? <><Eye size={16}/> Tampil</> : <><EyeOff size={16}/> Sembunyi</>}
                </button>
              </div>
              {cmsConfig.howItWorks.visible && (
                <div className="p-5 space-y-4">
                  {(cmsConfig.howItWorks.steps || []).map((step: any, idx: number) => (
                    <div key={idx} className="flex gap-4 items-start border border-[var(--border)] p-4 rounded-xl">
                      <div className="flex-1 space-y-3">
                        <div className="flex gap-3">
                          <input className="w-1/4 px-3 py-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border)] text-sm focus:border-[var(--accent-primary)] outline-none" placeholder="No (misal: 01)" value={step.step} onChange={e => {
                            const newSteps = [...cmsConfig.howItWorks.steps];
                            newSteps[idx].step = e.target.value;
                            setCmsConfig({...cmsConfig, howItWorks: {...cmsConfig.howItWorks, steps: newSteps}});
                          }} />
                          <input className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border)] text-sm font-bold focus:border-[var(--accent-primary)] outline-none" placeholder="Judul Langkah" value={step.title} onChange={e => {
                            const newSteps = [...cmsConfig.howItWorks.steps];
                            newSteps[idx].title = e.target.value;
                            setCmsConfig({...cmsConfig, howItWorks: {...cmsConfig.howItWorks, steps: newSteps}});
                          }} />
                        </div>
                        <textarea className="w-full px-3 py-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border)] text-sm focus:border-[var(--accent-primary)] outline-none" placeholder="Deskripsi Langkah" rows={2} value={step.desc} onChange={e => {
                          const newSteps = [...cmsConfig.howItWorks.steps];
                          newSteps[idx].desc = e.target.value;
                          setCmsConfig({...cmsConfig, howItWorks: {...cmsConfig.howItWorks, steps: newSteps}});
                        }} />
                      </div>
                      <button onClick={() => {
                        const newSteps = cmsConfig.howItWorks.steps.filter((_: any, i: number) => i !== idx);
                        setCmsConfig({...cmsConfig, howItWorks: {...cmsConfig.howItWorks, steps: newSteps}});
                      }} className="text-red-500 font-bold text-sm mt-2">Hapus</button>
                    </div>
                  ))}
                  <button onClick={() => {
                    const newSteps = [...(cmsConfig.howItWorks.steps || []), { step: '00', title: '', desc: '' }];
                    setCmsConfig({...cmsConfig, howItWorks: {...cmsConfig.howItWorks, steps: newSteps}});
                  }} className="px-4 py-2 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl font-bold text-sm hover:border-[var(--accent-primary)] text-[var(--text-primary)]">
                    + Tambah Langkah
                  </button>
                </div>
              )}
            </div>

            {/* DOCS EDITOR */}
            <div className="border border-[var(--border)] rounded-2xl overflow-hidden">
              <div className="bg-[var(--bg-main)] p-4 flex items-center justify-between border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-[var(--text-primary)]">5. Dokumentasi (Docs)</h3>
                </div>
                <button onClick={() => toggleCmsVisibility('docs')} className={`p-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors ${cmsConfig.docs.visible ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-500/10 text-gray-500'}`}>
                  {cmsConfig.docs.visible ? <><LucideIcons.Eye size={16}/> Tampil</> : <><LucideIcons.EyeOff size={16}/> Sembunyi</>}
                </button>
              </div>
              {cmsConfig.docs.visible && (
                <div className="p-5 space-y-6">
                  {(cmsConfig.docs?.topics || []).map((topic: any, idx: number) => (
                    <div key={idx} className="flex flex-col gap-3 border border-[var(--border)] p-4 rounded-xl">
                      <div className="flex gap-3 items-center">
                        <input className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border)] text-sm font-bold focus:border-[var(--accent-primary)] outline-none" placeholder="Judul Topik" value={topic.title} onChange={e => {
                          const newTopics = [...cmsConfig.docs.topics];
                          newTopics[idx].title = e.target.value;
                          setCmsConfig({...cmsConfig, docs: {...cmsConfig.docs, topics: newTopics}});
                        }} />
                        <button onClick={() => {
                          const newTopics = cmsConfig.docs.topics.filter((_: any, i: number) => i !== idx);
                          setCmsConfig({...cmsConfig, docs: {...cmsConfig.docs, topics: newTopics}});
                        }} className="text-red-500 font-bold text-sm">Hapus</button>
                      </div>
                      <div className="bg-[var(--bg-main)] rounded-xl border border-[var(--border)] overflow-hidden">
                        <RichTextEditor 
                          value={topic.content} 
                          onChange={(val) => {
                            const newTopics = [...cmsConfig.docs.topics];
                            newTopics[idx].content = val;
                            setCmsConfig({...cmsConfig, docs: {...cmsConfig.docs, topics: newTopics}});
                          }} 
                        />
                      </div>
                    </div>
                  ))}
                  <button onClick={() => {
                    const newTopics = [...(cmsConfig.docs.topics || []), { id: `topic-${Date.now()}`, title: 'Topik Baru', content: '' }];
                    setCmsConfig({...cmsConfig, docs: {...cmsConfig.docs, topics: newTopics}});
                  }} className="px-4 py-2 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl font-bold text-sm hover:border-[var(--accent-primary)] text-[var(--text-primary)]">
                    + Tambah Topik Dokumen
                  </button>
                </div>
              )}
            </div>

            {/* FAQ EDITOR */}
            <div className="border border-[var(--border)] rounded-2xl overflow-hidden">
              <div className="bg-[var(--bg-main)] p-4 flex items-center justify-between border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-[var(--text-primary)]">6. Tanya Jawab (FAQ)</h3>
                </div>
                <button onClick={() => toggleCmsVisibility('faq')} className={`p-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors ${cmsConfig.faq.visible ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-500/10 text-gray-500'}`}>
                  {cmsConfig.faq.visible ? <><LucideIcons.Eye size={16}/> Tampil</> : <><LucideIcons.EyeOff size={16}/> Sembunyi</>}
                </button>
              </div>
              {cmsConfig.faq.visible && (
                <div className="p-5 space-y-4">
                  {(cmsConfig.faq.items || []).map((faq: any, idx: number) => (
                    <div key={idx} className="flex gap-4 items-start border border-[var(--border)] p-4 rounded-xl">
                      <div className="flex-1 space-y-3">
                        <input className="w-full px-3 py-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border)] text-sm font-bold focus:border-[var(--accent-primary)] outline-none" placeholder="Pertanyaan" value={faq.question} onChange={e => {
                          const newItems = [...cmsConfig.faq.items];
                          newItems[idx].question = e.target.value;
                          setCmsConfig({...cmsConfig, faq: {...cmsConfig.faq, items: newItems}});
                        }} />
                        <textarea className="w-full px-3 py-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border)] text-sm focus:border-[var(--accent-primary)] outline-none" placeholder="Jawaban" rows={2} value={faq.answer} onChange={e => {
                          const newItems = [...cmsConfig.faq.items];
                          newItems[idx].answer = e.target.value;
                          setCmsConfig({...cmsConfig, faq: {...cmsConfig.faq, items: newItems}});
                        }} />
                      </div>
                      <button onClick={() => {
                        const newItems = cmsConfig.faq.items.filter((_: any, i: number) => i !== idx);
                        setCmsConfig({...cmsConfig, faq: {...cmsConfig.faq, items: newItems}});
                      }} className="text-red-500 font-bold text-sm mt-2">Hapus</button>
                    </div>
                  ))}
                  <button onClick={() => {
                    const newItems = [...(cmsConfig.faq.items || []), { q: '', a: '' }];
                    setCmsConfig({...cmsConfig, faq: {...cmsConfig.faq, items: newItems}});
                  }} className="px-4 py-2 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl font-bold text-sm hover:border-[var(--accent-primary)] text-[var(--text-primary)]">
                    + Tambah FAQ
                  </button>
                </div>
              )}
            </div>

            {/* FOOTER EDITOR */}
            <div className="border border-[var(--border)] rounded-2xl overflow-hidden">
              <div className="bg-[var(--bg-main)] p-4 flex items-center justify-between border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-[var(--text-primary)]">7. Footer</h3>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Tagline Footer</label>
                  <input type="text" className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm" 
                    value={cmsConfig.footer?.tagline || ''} onChange={e => setCmsConfig({...cmsConfig, footer: {...cmsConfig.footer, tagline: e.target.value}})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Teks Copyright</label>
                  <input type="text" className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm" 
                    value={cmsConfig.footer?.copyright || ''} onChange={e => setCmsConfig({...cmsConfig, footer: {...cmsConfig.footer, copyright: e.target.value}})} />
                </div>
              </div>
            </div>

            {/* OTHER SECTIONS VISIBILITY */}
            <div className="border border-[var(--border)] rounded-2xl p-5">
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
                  <span className="font-bold text-sm">Dokumentasi</span>
                  <button onClick={() => toggleCmsVisibility('docs')} className={cmsConfig.docs.visible ? 'text-emerald-500' : 'text-gray-500'}>
                    {cmsConfig.docs.visible ? <Eye size={20}/> : <EyeOff size={20}/>}
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
