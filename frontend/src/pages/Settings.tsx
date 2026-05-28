import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Save, Store, Moon, Sun, Receipt, Percent, FileText, Coffee, Sparkles, Plus, Trash2, Star, MessageSquare, Bell } from 'lucide-react';
import api, { getMediaUrl } from '../api/client';
import toast from 'react-hot-toast';
import { RichTextEditor } from '../components/shared/RichTextEditor';
import { CustomSelect } from '../components/shared/CustomSelect';
import { Breadcrumb } from '../components/shared/Breadcrumb';

export function Settings() {
  const { themeMode, primaryColor, storeName: contextStoreName, logoUrl: contextLogoUrl, logoShape: contextLogoShape, updateTheme } = useTheme();
  
  // Branding state
  const [storeName, setStoreName] = useState(contextStoreName);
  const [color, setColor] = useState(primaryColor);
  const [mode, setMode] = useState(themeMode);
  const [logoUrl, setLogoUrl] = useState(contextLogoUrl);
  const [logoShape, setLogoShape] = useState(contextLogoShape || 'square');
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // QRIS state
  const { qrisUrl: contextQrisUrl, isQrisActive: contextIsQrisActive } = useTheme();
  const [qrisUrl, setQrisUrl] = useState(contextQrisUrl);
  const [qrisFile, setQrisFile] = useState<File | null>(null);
  const [isQrisActive, setIsQrisActive] = useState(contextIsQrisActive || false);
  
  // Custom Receipt & Tax state
  const [receiptSubtitle, setReceiptSubtitle] = useState('Sistem Kasir Digital');
  const [receiptFooter, setReceiptFooter] = useState('Terima kasih atas kunjungan Anda!');
  const [taxRate, setTaxRate] = useState('0');

  // Notification & System State
  const [enableSound, setEnableSound] = useState(true);

  // Landing Page state
  const [landingPageConfig, setLandingPageConfig] = useState<any>({});
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  // Fetch full settings including landingPageConfig on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings/tenant');
        if (data?.tenant?.landingPageConfig) {
          setLandingPageConfig(data.tenant.landingPageConfig);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSettings();
  }, []);

  // Load current values from DB and localStorage
  useEffect(() => {
    setStoreName(contextStoreName);
    setColor(primaryColor);
    setMode(themeMode);
    setLogoUrl(contextLogoUrl);
    setQrisUrl(contextQrisUrl);
    setIsQrisActive(contextIsQrisActive || false);
    setLogoShape(contextLogoShape || 'square');

    const storedConfig = localStorage.getItem('pos_receipt_config');
    if (storedConfig) {
      try {
        const parsed = JSON.parse(storedConfig);
        setReceiptSubtitle(parsed.receiptSubtitle || 'Sistem Kasir Digital');
        setReceiptFooter(parsed.receiptFooter || 'Terima kasih atas kunjungan Anda!');
        setTaxRate(parsed.taxRate?.toString() || '0');
      } catch (e) {
        console.error('Error parsing pos_receipt_config:', e);
      }
    }

    const storedSound = localStorage.getItem('pos_notification_sound');
    if (storedSound !== null) {
      setEnableSound(storedSound === 'true');
    }
  }, [contextStoreName, primaryColor, themeMode, contextLogoUrl, contextQrisUrl, contextIsQrisActive]);

  const handleMediaUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data.url;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const loadingToast = toast.loading('Menyimpan pengaturan...');
    try {
      let uploadedLogoUrl = logoUrl;
      let uploadedQrisUrl = qrisUrl;
      let configPayload = { ...landingPageConfig };

      // 1. Upload logo if new file selected
      if (logoFile) {
        uploadedLogoUrl = await handleMediaUpload(logoFile);
        setLogoUrl(uploadedLogoUrl);
      }

      if (qrisFile) {
        uploadedQrisUrl = await handleMediaUpload(qrisFile);
        setQrisUrl(uploadedQrisUrl);
      }

      // 2. Persist branding changes to backend DB
      const { data } = await api.put('/settings/tenant', {
        name: storeName,
        primaryColor: color,
        themeMode: mode,
        logoUrl: uploadedLogoUrl,
        qrisUrl: uploadedQrisUrl,
        isQrisActive,
        logoShape,
        landingPageConfig: configPayload
      });

      // 3. Update frontend ThemeContext state
      if (data?.tenant) {
        updateTheme({
          name: data.tenant.name,
          primaryColor: data.tenant.primaryColor,
          themeMode: data.tenant.themeMode,
          logoUrl: data.tenant.logoUrl,
          qrisUrl: data.tenant.qrisUrl,
          isQrisActive: data.tenant.isQrisActive,
          logoShape: data.tenant.logoShape
        });
      }

      // 4. Save Custom Receipt Settings (Subtitle, Footer, Tax PPN) to localStorage
      const receiptConfig = {
        receiptSubtitle,
        receiptFooter,
        taxRate: parseFloat(taxRate) || 0
      };
      localStorage.setItem('pos_receipt_config', JSON.stringify(receiptConfig));
      localStorage.setItem('pos_notification_sound', String(enableSound));

      toast.success('Pengaturan toko & personalisasi berhasil disimpan!', { id: loadingToast });
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Gagal menyimpan pengaturan ke server.', { id: loadingToast });
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-4 pb-6">
      <div className="flex mb-2">
        <Breadcrumb items={[{ label: 'Toko & Transaksi' }, { label: 'Pengaturan' }]} />
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        
        {/* Section 1: Branding Identitas Tenant */}
        <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <Store size={18} className="text-[var(--accent-primary)]" /> Branding & Tema Aplikasi
          </h2>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Logo Upload */}
            <div className="flex flex-col gap-2 items-start">
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Logo Toko</label>
              <label className={`w-24 h-24 border-2 border-dashed border-[var(--border)] flex items-center justify-center cursor-pointer hover:border-[var(--accent-primary)] hover:bg-[var(--bg-main)] transition-all overflow-hidden group relative ${logoShape === 'circle' ? 'rounded-full' : 'rounded-2xl'}`}>
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/webp" 
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setLogoFile(e.target.files[0]);
                      setLogoUrl(URL.createObjectURL(e.target.files[0]));
                    }
                  }}
                />
                {logoUrl ? (
                  <>
                    <img src={getMediaUrl(logoUrl)} alt="Logo" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-white text-xs font-bold">Ubah</span>
                    </div>
                  </>
                ) : (
                  <div className="text-[var(--text-secondary)] flex flex-col items-center">
                    <Store size={24} className="mb-1 opacity-50" />
                    <span className="text-[10px] font-bold">Upload</span>
                  </div>
                )}
              </label>
            </div>

            {/* QRIS Upload */}
            <div className="flex flex-col gap-2 items-start">
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">QRIS Toko (Opsional)</label>
              <div className="flex items-center gap-4">
                <label className="w-24 h-24 border-2 border-dashed border-[var(--border)] flex items-center justify-center cursor-pointer hover:border-[var(--accent-primary)] hover:bg-[var(--bg-main)] transition-all overflow-hidden group relative rounded-2xl bg-[var(--bg-main)]">
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/webp" 
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setQrisFile(e.target.files[0]);
                        setQrisUrl(URL.createObjectURL(e.target.files[0]));
                      }
                    }}
                  />
                  {qrisUrl ? (
                    <>
                      <img src={getMediaUrl(qrisUrl)} alt="QRIS" className="w-full h-full object-contain p-1 bg-white" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="text-white text-xs font-bold">Ubah</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-[var(--text-secondary)] flex flex-col items-center">
                      <Receipt size={24} className="mb-1 opacity-50" />
                      <span className="text-[10px] font-bold">Upload</span>
                    </div>
                  )}
                </label>
                
                <div className="flex flex-col gap-1 justify-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={isQrisActive}
                        onChange={() => setIsQrisActive(!isQrisActive)}
                      />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${isQrisActive ? 'bg-[var(--accent-primary)]' : 'bg-gray-300'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isQrisActive ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                    <span className="text-xs font-bold text-[var(--text-primary)] cursor-pointer">Wajib QRIS di Meja</span>
                  </label>
                  <p className="text-[10px] text-[var(--text-secondary)] max-w-[150px] leading-tight mt-1">Aktifkan untuk memunculkan pembayaran setelah pelanggan memesan dari meja.</p>
                </div>
              </div>
            </div>

            {/* Nama Toko & Bentuk Logo */}
            <div className="flex-1 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">
                  Nama Bisnis / Tenant *
                </label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none transition-all font-semibold text-sm"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">
                  Bentuk Bingkai Logo
                </label>
                <div className="flex items-center gap-3">
                  <label className={`flex items-center gap-2 px-4 py-2 border rounded-xl cursor-pointer transition-all ${logoShape === 'square' ? 'border-[var(--accent-primary)] bg-[var(--accent-primary-transparent)] text-[var(--accent-primary)]' : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-main)]'}`}>
                    <input type="radio" name="logoShape" value="square" checked={logoShape === 'square'} onChange={(e) => setLogoShape(e.target.value as 'square' | 'circle')} className="hidden" />
                    <div className="w-4 h-4 rounded shadow-[inset_0_0_0_1px_currentColor] flex items-center justify-center">
                      {logoShape === 'square' && <div className="w-2 h-2 rounded-sm bg-current" />}
                    </div>
                    <span className="text-sm font-bold">Kotak (Rounded)</span>
                  </label>
                  <label className={`flex items-center gap-2 px-4 py-2 border rounded-xl cursor-pointer transition-all ${logoShape === 'circle' ? 'border-[var(--accent-primary)] bg-[var(--accent-primary-transparent)] text-[var(--accent-primary)]' : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-main)]'}`}>
                    <input type="radio" name="logoShape" value="circle" checked={logoShape === 'circle'} onChange={(e) => setLogoShape(e.target.value as 'square' | 'circle')} className="hidden" />
                    <div className="w-4 h-4 rounded-full shadow-[inset_0_0_0_1px_currentColor] flex items-center justify-center">
                      {logoShape === 'circle' && <div className="w-2 h-2 rounded-full bg-current" />}
                    </div>
                    <span className="text-sm font-bold">Bulat (Circle)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Pilihan Warna Tema */}
          <div>
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">
              Warna Utama Aplikasi (Aksen)
            </label>
            <div className="flex items-center gap-4 bg-[var(--bg-main)] p-3 rounded-xl border border-[var(--border)]">
              <input 
                type="color" 
                className="w-12 h-12 rounded-lg bg-transparent border-0 cursor-pointer"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">{color.toUpperCase()}</p>
                <p className="text-xs text-[var(--text-secondary)] font-medium">Warna aksen tombol, border aktif, dan gradien navigasi.</p>
              </div>
            </div>
          </div>

          {/* Mode Tampilan */}
          <div>
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3 block">
              Mode Tema Visual
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setMode('light')}
                className={`p-4 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all text-sm ${
                  mode === 'light'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-600 shadow-sm'
                    : 'bg-[var(--bg-main)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]'
                }`}
              >
                <Sun size={18} /> Light Mode
              </button>
              <button
                type="button"
                onClick={() => setMode('dark')}
                className={`p-4 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all text-sm ${
                  mode === 'dark'
                    ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-sm'
                    : 'bg-[var(--bg-main)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]'
                }`}
              >
                <Moon size={18} /> Dark Mode
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Personalisasi Struk & Pajak */}
        <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <Receipt size={18} className="text-[var(--accent-primary)]" /> Pengaturan Struk Belanja & Pajak
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tagline Struk */}
            <div>
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">
                Tagline / Subtitle Header Struk
              </label>
              <input 
                type="text"
                placeholder="Cth: Sistem Kasir Digital"
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm font-semibold transition-all"
                value={receiptSubtitle}
                onChange={(e) => setReceiptSubtitle(e.target.value)}
              />
            </div>

            {/* Pajak PPN Rate */}
            <div>
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block flex items-center gap-1">
                Tarif Pajak PPN (%) <Percent size={13} className="text-[var(--accent-primary)]" />
              </label>
              <input 
                type="number"
                min="0"
                max="100"
                step="any"
                placeholder="Cth: 11"
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm font-bold transition-all"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              />
            </div>
          </div>

          {/* Footer Struk */}
          <div>
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block flex items-center gap-1">
              Pesan Kaki Struk (Footer Message) <FileText size={13} className="text-[var(--accent-primary)]" />
            </label>
            <textarea
              rows={2}
              placeholder="Cth: Terima kasih atas kunjungan Anda!"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm font-semibold transition-all resize-none"
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
            />
          </div>
        </div>

        {/* Section 2.5: Notifikasi & Sistem */}
        <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <Bell size={18} className="text-[var(--accent-primary)]" /> Pengaturan Notifikasi & Sistem
          </h2>
          <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-main)]">
            <div className="flex flex-col">
              <span className="font-bold text-sm text-[var(--text-primary)]">Suara Notifikasi Pesanan Baru</span>
              <span className="text-[10px] text-[var(--text-secondary)] mt-0.5">Mainkan suara 'ding' saat ada pesanan meja baru masuk ke kasir</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={enableSound} onChange={() => setEnableSound(!enableSound)} />
              <div className="w-11 h-6 bg-[var(--border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent-primary)]"></div>
            </label>
          </div>
        </div>

        {/* Section 3: Landing Page Publik */}
        <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <Store size={18} className="text-[var(--accent-primary)]" /> Pengaturan Halaman Publik (Landing Page)
          </h2>

          <div className="flex flex-col gap-4">
            {/* Template Selector */}
            <div className="mb-4">
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3 block">
                Pilih Template Desain
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className={`flex flex-col gap-2 p-4 border-2 rounded-2xl cursor-pointer transition-all ${(!landingPageConfig?.template || landingPageConfig.template === 'retail') ? 'border-[var(--accent-primary)] bg-[var(--accent-primary-transparent)]' : 'border-[var(--border)] bg-[var(--bg-main)] hover:border-[var(--text-secondary)]'}`}>
                  <input type="radio" name="lp_template" value="retail" checked={!landingPageConfig?.template || landingPageConfig.template === 'retail'} onChange={(e) => setLandingPageConfig({ ...landingPageConfig, template: e.target.value })} className="hidden" />
                  <div className="flex items-center gap-2 mb-1">
                    <Store size={18} className={(!landingPageConfig?.template || landingPageConfig.template === 'retail') ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'} />
                    <span className={`font-bold ${(!landingPageConfig?.template || landingPageConfig.template === 'retail') ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>Retail (Standar)</span>
                  </div>
                  <p className="text-xs font-medium text-[var(--text-secondary)]">Katalog grid biasa, cocok untuk minimarket/toko umum.</p>
                </label>

                <label className={`flex flex-col gap-2 p-4 border-2 rounded-2xl cursor-pointer transition-all ${landingPageConfig?.template === 'resto' ? 'border-[var(--accent-primary)] bg-[var(--accent-primary-transparent)]' : 'border-[var(--border)] bg-[var(--bg-main)] hover:border-[var(--text-secondary)]'}`}>
                  <input type="radio" name="lp_template" value="resto" checked={landingPageConfig?.template === 'resto'} onChange={(e) => setLandingPageConfig({ ...landingPageConfig, template: e.target.value })} className="hidden" />
                  <div className="flex items-center gap-2 mb-1">
                    <Coffee size={18} className={landingPageConfig?.template === 'resto' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'} />
                    <span className={`font-bold ${landingPageConfig?.template === 'resto' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>Resto / F&B</span>
                  </div>
                  <p className="text-xs font-medium text-[var(--text-secondary)]">Tampilan layaknya buku menu, dikelompokkan per kategori.</p>
                </label>

                <label className={`flex flex-col gap-2 p-4 border-2 rounded-2xl cursor-pointer transition-all ${landingPageConfig?.template === 'lookbook' ? 'border-[var(--accent-primary)] bg-[var(--accent-primary-transparent)]' : 'border-[var(--border)] bg-[var(--bg-main)] hover:border-[var(--text-secondary)]'}`}>
                  <input type="radio" name="lp_template" value="lookbook" checked={landingPageConfig?.template === 'lookbook'} onChange={(e) => setLandingPageConfig({ ...landingPageConfig, template: e.target.value })} className="hidden" />
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={18} className={landingPageConfig?.template === 'lookbook' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'} />
                    <span className={`font-bold ${landingPageConfig?.template === 'lookbook' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>Lookbook (Fashion)</span>
                  </div>
                  <p className="text-xs font-medium text-[var(--text-secondary)]">Elegan dengan gambar mendominasi ala majalah fesyen.</p>
                </label>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 space-y-4">
                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">
                    Judul Utama (Hero Title)
                  </label>
                  <input 
                    type="text" 
                    placeholder={`Selamat Datang di ${storeName}`}
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm font-semibold transition-all"
                    value={landingPageConfig?.heroTitle || ''}
                    onChange={(e) => setLandingPageConfig({ ...landingPageConfig, heroTitle: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">
                    Subjudul (Deskripsi Singkat di Hero)
                  </label>
                  <textarea 
                    placeholder="Temukan berbagai produk terbaik kami di sini."
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm font-semibold transition-all resize-none custom-scrollbar"
                    value={landingPageConfig?.heroSubtitle || ''}
                    onChange={(e) => setLandingPageConfig({ ...landingPageConfig, heroSubtitle: e.target.value })}
                  />
                </div>
              </div>
              <div className="md:w-1/3">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">
                  Gambar Hero Utama (+ Gambar)
                </label>
                <label className="block w-full h-[148px] border-2 border-dashed border-[var(--border)] rounded-xl flex items-center justify-center cursor-pointer hover:border-[var(--accent-primary)] transition-colors relative overflow-hidden group">
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      setIsUploadingMedia(true);
                      try {
                        const url = await handleMediaUpload(e.target.files[0]);
                        setLandingPageConfig({ ...landingPageConfig, heroImage: url });
                      } catch(err) { toast.error('Gagal upload gambar hero'); }
                      finally { setIsUploadingMedia(false); }
                    }
                  }} />
                  {landingPageConfig?.heroImage ? (
                    <img src={getMediaUrl(landingPageConfig.heroImage)} alt="Hero" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-[var(--text-secondary)]">{isUploadingMedia ? 'Mengunggah...' : 'Upload Gambar Hero'}</span>
                  )}
                </label>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">
                Kata Pengantar (Tentang Toko)
              </label>
              <textarea 
                placeholder="Toko kami berdiri sejak tahun... Kami selalu menyajikan kualitas..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm font-semibold transition-all resize-none custom-scrollbar"
                value={landingPageConfig?.introduction || ''}
                onChange={(e) => setLandingPageConfig({ ...landingPageConfig, introduction: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">Jargon / Slogan</label>
                <input type="text" placeholder="Harga pas, kualitas puas!" className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm font-semibold transition-all" value={landingPageConfig?.jargon || ''} onChange={(e) => setLandingPageConfig({ ...landingPageConfig, jargon: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">Link / Alamat Google Maps (iframe/URL)</label>
                <input type="text" placeholder="https://maps.google.com/..." className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm font-semibold transition-all" value={landingPageConfig?.mapLocation || ''} onChange={(e) => setLandingPageConfig({ ...landingPageConfig, mapLocation: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">Alamat Lengkap (Teks)</label>
                <input type="text" placeholder="Jl. Sudirman No. 1..." className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm font-semibold transition-all" value={landingPageConfig?.address || ''} onChange={(e) => setLandingPageConfig({ ...landingPageConfig, address: e.target.value })} />
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-4 pb-2 mt-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Pengumuman Toko (Promo / Info)</h3>
                <button 
                  type="button" 
                  onClick={() => {
                    const currentAnnouncements = landingPageConfig?.announcements || (landingPageConfig?.announcement ? [landingPageConfig.announcement] : []);
                    if (currentAnnouncements.length >= 3) {
                      toast.error('Maksimal 3 pengumuman diperbolehkan');
                      return;
                    }
                    setLandingPageConfig({ 
                      ...landingPageConfig, 
                      announcements: [...currentAnnouncements, { title: '', description: '' }] 
                    });
                  }}
                  className="text-xs font-bold bg-[var(--accent-primary-transparent)] text-[var(--accent-primary)] px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity flex items-center gap-1"
                >
                  <Plus size={14} /> Tambah Pengumuman
                </button>
              </div>
              
              <div className="flex flex-col gap-4">
                {(landingPageConfig?.announcements || (landingPageConfig?.announcement ? [landingPageConfig.announcement] : [])).map((ann, idx) => (
                  <div key={idx} className="bg-[var(--bg-main)] border border-[var(--border)] rounded-2xl p-4 relative group">
                    <button 
                      type="button"
                      onClick={() => {
                        const newAnn = [...(landingPageConfig?.announcements || (landingPageConfig?.announcement ? [landingPageConfig.announcement] : []))];
                        newAnn.splice(idx, 1);
                        setLandingPageConfig({ ...landingPageConfig, announcements: newAnn });
                      }}
                      className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors p-1"
                      title="Hapus Pengumuman"
                    >
                      <Trash2 size={16} />
                    </button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">Judul Pengumuman {idx + 1}</label>
                        <input type="text" placeholder="Cth: Promo Ramadhan!" className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm font-semibold transition-all mb-4" value={ann.title || ''} onChange={(e) => {
                          const newAnn = [...(landingPageConfig?.announcements || (landingPageConfig?.announcement ? [landingPageConfig.announcement] : []))];
                          newAnn[idx].title = e.target.value;
                          setLandingPageConfig({ ...landingPageConfig, announcements: newAnn });
                        }} />
                        
                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">Isi Pengumuman</label>
                        <RichTextEditor 
                          value={ann.description || ''} 
                          placeholder="Dapatkan diskon 50% untuk..." 
                          onChange={(val) => {
                            const newAnn = [...(landingPageConfig?.announcements || (landingPageConfig?.announcement ? [landingPageConfig.announcement] : []))];
                            newAnn[idx].description = val;
                            setLandingPageConfig({ ...landingPageConfig, announcements: newAnn });
                          }} 
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">Banner Pengumuman (Opsional)</label>
                        <label className="w-full h-40 md:h-full border-2 border-dashed border-[var(--border)] rounded-xl flex items-center justify-center cursor-pointer hover:border-[var(--accent-primary)] transition-colors relative overflow-hidden group">
                          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            if (e.target.files && e.target.files[0]) {
                              setIsUploadingMedia(true);
                              try {
                                const url = await handleMediaUpload(e.target.files[0]);
                                const newAnn = [...(landingPageConfig?.announcements || (landingPageConfig?.announcement ? [landingPageConfig.announcement] : []))];
                                newAnn[idx].bannerUrl = url;
                                setLandingPageConfig({ ...landingPageConfig, announcements: newAnn });
                              } catch(err) { toast.error('Gagal upload banner'); }
                              finally { setIsUploadingMedia(false); }
                            }
                          }} />
                          {ann.bannerUrl ? (
                            <img src={getMediaUrl(ann.bannerUrl)} alt="Banner" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-[var(--text-secondary)]">{isUploadingMedia ? 'Mengunggah...' : 'Upload Banner'}</span>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
                {(landingPageConfig?.announcements || (landingPageConfig?.announcement ? [landingPageConfig.announcement] : [])).length === 0 && (
                  <div className="text-center py-6 text-xs font-bold text-[var(--text-secondary)] border-2 border-dashed border-[var(--border)] rounded-2xl">Belum ada pengumuman.</div>
                )}
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-4 pb-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Galeri Toko</h3>
                <label className="text-xs font-bold bg-[var(--accent-primary-transparent)] text-[var(--accent-primary)] px-3 py-1.5 rounded-lg cursor-pointer hover:opacity-80 transition-opacity">
                  <input type="file" accept="image/*" multiple className="hidden" onChange={async (e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setIsUploadingMedia(true);
                      try {
                        const newUrls = await Promise.all(Array.from(e.target.files).map(handleMediaUpload));
                        setLandingPageConfig({ ...landingPageConfig, gallery: [...(landingPageConfig.gallery || []), ...newUrls] });
                      } catch(err) { toast.error('Gagal upload galeri'); }
                      finally { setIsUploadingMedia(false); }
                    }
                  }} />
                  + Tambah Foto
                </label>
              </div>
              <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2">
                {landingPageConfig?.gallery?.map((url: string, idx: number) => (
                  <div key={idx} className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden group border border-[var(--border)]">
                    <img src={getMediaUrl(url)} alt="Gallery" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => {
                      const newGallery = [...landingPageConfig.gallery];
                      newGallery.splice(idx, 1);
                      setLandingPageConfig({ ...landingPageConfig, gallery: newGallery });
                    }} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity text-xs font-bold">Hapus</button>
                  </div>
                ))}
                {(!landingPageConfig?.gallery || landingPageConfig.gallery.length === 0) && (
                  <div className="w-full py-6 text-center border-2 border-dashed border-[var(--border)] rounded-xl text-[var(--text-secondary)] text-xs font-bold">Belum ada foto galeri</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[var(--border)] pt-4">
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">WhatsApp</label>
                <input type="text" placeholder="081234567890" className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm font-semibold transition-all" value={landingPageConfig?.whatsapp || ''} onChange={(e) => setLandingPageConfig({ ...landingPageConfig, whatsapp: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">Instagram</label>
                <input type="text" placeholder="tokosaya" className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm font-semibold transition-all" value={landingPageConfig?.instagram || ''} onChange={(e) => setLandingPageConfig({ ...landingPageConfig, instagram: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">TikTok</label>
                <input type="text" placeholder="tokosaya_tiktok" className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm font-semibold transition-all" value={landingPageConfig?.tiktok || ''} onChange={(e) => setLandingPageConfig({ ...landingPageConfig, tiktok: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">Jam Operasional</label>
                <input type="text" placeholder="Senin - Sabtu: 08:00 - 22:00" className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm font-semibold transition-all" value={landingPageConfig?.operationalHours || ''} onChange={(e) => setLandingPageConfig({ ...landingPageConfig, operationalHours: e.target.value })} />
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-4 pb-2">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Keunggulan Toko (Features)</h3>
                  <p className="text-[var(--text-secondary)] text-xs mt-1">Tampilkan hingga 3 keunggulan utama toko Anda.</p>
                </div>
                <button type="button" onClick={() => {
                  const current = landingPageConfig?.features || [];
                  if (current.length < 3) {
                    setLandingPageConfig({ ...landingPageConfig, features: [...current, { title: '', description: '' }] });
                  } else {
                    toast.error('Maksimal 3 keunggulan');
                  }
                }} className="text-xs font-bold bg-[var(--bg-surface-elevated)] border border-[var(--border)] px-3 py-1.5 rounded-lg hover:border-[var(--accent-primary)] transition-all">
                  + Tambah
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {landingPageConfig?.features?.map((feat: any, idx: number) => (
                  <div key={idx} className="flex gap-3 items-start bg-[var(--bg-main)] p-3 rounded-xl border border-[var(--border)]">
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <CustomSelect className="w-1/3" value={feat.icon || 'CheckCircle'} onChange={(val) => {
                          const newFeat = [...landingPageConfig.features];
                          newFeat[idx].icon = String(val);
                          setLandingPageConfig({ ...landingPageConfig, features: newFeat });
                        }} options={[
                          { value: 'CheckCircle', label: 'Check (Ceklis)' },
                          { value: 'Star', label: 'Star (Bintang)' },
                          { value: 'Shield', label: 'Shield (Keamanan)' },
                          { value: 'Heart', label: 'Heart (Hati)' },
                          { value: 'Truck', label: 'Truck (Pengiriman)' },
                          { value: 'ThumbsUp', label: 'Thumbs (Jempol)' },
                          { value: 'Coffee', label: 'Coffee (Kopi)' },
                          { value: 'Utensils', label: 'Utensils (Alat Makan)' }
                        ]} />
                        <input type="text" placeholder="Cth: Kualitas Premium" className="w-2/3 px-3 py-2 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm font-bold transition-all" value={feat.title} onChange={(e) => {
                          const newFeat = [...landingPageConfig.features];
                          newFeat[idx].title = e.target.value;
                          setLandingPageConfig({ ...landingPageConfig, features: newFeat });
                        }} />
                      </div>
                      <input type="text" placeholder="Deskripsi singkat..." className="w-full px-3 py-2 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm transition-all" value={feat.description} onChange={(e) => {
                        const newFeat = [...landingPageConfig.features];
                        newFeat[idx].description = e.target.value;
                        setLandingPageConfig({ ...landingPageConfig, features: newFeat });
                      }} />
                    </div>
                    <button type="button" onClick={() => {
                      const newFeat = [...landingPageConfig.features];
                      newFeat.splice(idx, 1);
                      setLandingPageConfig({ ...landingPageConfig, features: newFeat });
                    }} className="text-[var(--danger)] p-2 hover:bg-[var(--danger)] hover:text-white rounded-lg transition-colors">
                      <span className="text-xs font-bold">Hapus</span>
                    </button>
                  </div>
                ))}
                {(!landingPageConfig?.features || landingPageConfig.features.length === 0) && (
                  <div className="text-center py-4 text-xs font-bold text-[var(--text-secondary)]">Belum ada fitur/keunggulan yang ditambahkan.</div>
                )}
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-4 pb-2">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Bagaimana Kami Melayani? (Opsional)</h3>
                  <p className="text-[var(--text-secondary)] text-xs mt-1">Tambahkan alur langkah pemesanan atau pelayanan Anda (khususnya untuk Resto/Jasa).</p>
                </div>
                <button type="button" onClick={() => {
                  const current = landingPageConfig?.howWeServe || [];
                  setLandingPageConfig({ ...landingPageConfig, howWeServe: [...current, { title: '', description: '' }] });
                }} className="text-xs font-bold bg-[var(--bg-surface-elevated)] border border-[var(--border)] px-3 py-1.5 rounded-lg hover:border-[var(--accent-primary)] transition-all">
                  + Tambah Langkah
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {landingPageConfig?.howWeServe?.map((step: any, idx: number) => (
                  <div key={idx} className="flex gap-3 items-start bg-[var(--bg-main)] p-3 rounded-xl border border-[var(--border)]">
                    <div className="w-8 h-8 shrink-0 bg-[var(--accent-primary-transparent)] text-[var(--accent-primary)] rounded-full flex items-center justify-center font-bold">{idx + 1}</div>
                    <div className="flex-1 space-y-2">
                      <input type="text" placeholder="Cth: Pesan & Bayar" className="w-full px-3 py-2 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm font-bold transition-all" value={step.title} onChange={(e) => {
                        const newSteps = [...landingPageConfig.howWeServe];
                        newSteps[idx].title = e.target.value;
                        setLandingPageConfig({ ...landingPageConfig, howWeServe: newSteps });
                      }} />
                      <input type="text" placeholder="Lakukan pemesanan di kasir atau via WhatsApp..." className="w-full px-3 py-2 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm transition-all" value={step.description} onChange={(e) => {
                        const newSteps = [...landingPageConfig.howWeServe];
                        newSteps[idx].description = e.target.value;
                        setLandingPageConfig({ ...landingPageConfig, howWeServe: newSteps });
                      }} />
                    </div>
                    <button type="button" onClick={() => {
                      const newSteps = [...landingPageConfig.howWeServe];
                      newSteps.splice(idx, 1);
                      setLandingPageConfig({ ...landingPageConfig, howWeServe: newSteps });
                    }} className="text-[var(--danger)] p-2 hover:bg-[var(--danger)] hover:text-white rounded-lg transition-colors">
                      <span className="text-xs font-bold">Hapus</span>
                    </button>
                  </div>
                ))}
                {(!landingPageConfig?.howWeServe || landingPageConfig.howWeServe.length === 0) && (
                  <div className="text-center py-4 text-xs font-bold text-[var(--text-secondary)]">Belum ada langkah pelayanan yang ditambahkan.</div>
                )}
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-4 pb-2 mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Testimoni Pelanggan (Rating & Ulasan)</h3>
                <button 
                  type="button" 
                  onClick={() => setLandingPageConfig({ 
                    ...landingPageConfig, 
                    testimonials: [...(landingPageConfig.testimonials || []), { name: '', rating: 5, review: '' }] 
                  })}
                  className="text-xs font-bold bg-[var(--accent-primary-transparent)] text-[var(--accent-primary)] px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity flex items-center gap-1"
                >
                  <Plus size={14} /> Tambah Ulasan
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {landingPageConfig?.testimonials?.map((t: any, idx: number) => (
                  <div key={idx} className="flex flex-col gap-3 bg-[var(--bg-main)] p-4 rounded-xl border border-[var(--border)] relative group">
                    <button type="button" onClick={() => {
                      const newTesti = [...landingPageConfig.testimonials];
                      newTesti.splice(idx, 1);
                      setLandingPageConfig({ ...landingPageConfig, testimonials: newTesti });
                    }} className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--danger)] p-1 rounded-lg transition-colors z-10" title="Hapus Ulasan">
                      <Trash2 size={16} />
                    </button>
                    
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="md:w-32 flex flex-col gap-2 shrink-0">
                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">Foto (Opsional)</label>
                        <label className="w-full aspect-square border-2 border-dashed border-[var(--border)] rounded-full flex items-center justify-center cursor-pointer hover:border-[var(--accent-primary)] transition-colors relative overflow-hidden group/avatar">
                          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            if (e.target.files && e.target.files[0]) {
                              setIsUploadingMedia(true);
                              try {
                                const url = await handleMediaUpload(e.target.files[0]);
                                const newTesti = [...landingPageConfig.testimonials];
                                newTesti[idx].avatarUrl = url;
                                setLandingPageConfig({ ...landingPageConfig, testimonials: newTesti });
                              } catch(err) { toast.error('Gagal upload foto'); }
                              finally { setIsUploadingMedia(false); }
                            }
                          }} />
                          {t.avatarUrl ? (
                            <img src={getMediaUrl(t.avatarUrl)} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] text-center font-bold text-[var(--text-secondary)] p-2">{isUploadingMedia ? 'Mengunggah...' : 'Pilih Foto'}</span>
                          )}
                        </label>
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-1 block">Nama Pelanggan</label>
                            <input type="text" placeholder="Budi Santoso" className="w-full px-3 py-2 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm font-bold transition-all" value={t.name} onChange={(e) => {
                              const newTesti = [...landingPageConfig.testimonials];
                              newTesti[idx].name = e.target.value;
                              setLandingPageConfig({ ...landingPageConfig, testimonials: newTesti });
                            }} />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-1 block">Rating (1-5)</label>
                            <CustomSelect value={t.rating} onChange={(val) => {
                              const newTesti = [...landingPageConfig.testimonials];
                              newTesti[idx].rating = parseInt(String(val));
                              setLandingPageConfig({ ...landingPageConfig, testimonials: newTesti });
                            }} options={[
                              { value: 5, label: '5 Bintang (Sangat Bagus)' },
                              { value: 4, label: '4 Bintang (Bagus)' },
                              { value: 3, label: '3 Bintang (Cukup)' },
                              { value: 2, label: '2 Bintang (Kurang)' },
                              { value: 1, label: '1 Bintang (Sangat Kurang)' }
                            ]} />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-1 block">Isi Ulasan</label>
                          <textarea rows={2} placeholder="Sangat puas dengan pelayanannya..." className="w-full px-3 py-2 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm transition-all resize-none custom-scrollbar" value={t.review} onChange={(e) => {
                            const newTesti = [...landingPageConfig.testimonials];
                            newTesti[idx].review = e.target.value;
                            setLandingPageConfig({ ...landingPageConfig, testimonials: newTesti });
                          }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {(!landingPageConfig?.testimonials || landingPageConfig.testimonials.length === 0) && (
                  <div className="text-center py-4 text-xs font-bold text-[var(--text-secondary)] border-2 border-dashed border-[var(--border)] rounded-xl">Belum ada ulasan yang ditambahkan.</div>
                )}
              </div>
            </div>
            
            {/* Kustomisasi Visibilitas & Judul Komponen */}
            <div className="border-t border-[var(--border)] pt-4 pb-2 mt-4">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Visibilitas & Judul Komponen</h3>
                <p className="text-[var(--text-secondary)] text-xs mt-1">Tentukan komponen mana yang ingin ditampilkan dan sesuaikan judulnya.</p>
              </div>
              
              <div className="flex flex-col gap-3">
                {[
                  { key: 'hero', label: 'Hero (Bagian Atas)', noTitle: true },
                  { key: 'jargon', label: 'Tentang Kami / Jargon', noTitle: true },
                  { key: 'announcement', label: 'Pengumuman Toko', defaultTitle: 'Pengumuman' },
                  { key: 'features', label: 'Keunggulan Toko', defaultTitle: 'Keunggulan Toko' },
                  { key: 'testimonials', label: 'Testimoni & Ulasan', defaultTitle: 'Ulasan Pelanggan' },
                  { key: 'howWeServe', label: 'Bagaimana Kami Melayani?', defaultTitle: 'Bagaimana Kami Melayani?' },
                  { key: 'catalog', label: 'Katalog Produk / Menu', defaultTitle: 'Katalog Produk' },
                  { key: 'gallery', label: 'Galeri Foto', defaultTitle: 'Galeri Kami' },
                  { key: 'contact', label: 'Kontak & Lokasi', defaultTitle: 'Kunjungi Kami' }
                ].map((sec) => {
                  const current = landingPageConfig?.sectionSettings?.[sec.key] || { show: true, title: '' };
                  const updateSection = (field: 'show' | 'title', value: any) => {
                    setLandingPageConfig({
                      ...landingPageConfig,
                      sectionSettings: {
                        ...(landingPageConfig?.sectionSettings || {}),
                        [sec.key]: { ...current, [field]: value }
                      }
                    });
                  };
                  
                  return (
                    <div key={sec.key} className="flex flex-col md:flex-row md:items-center gap-4 bg-[var(--bg-main)] p-3 rounded-xl border border-[var(--border)]">
                      <div className="w-48 flex items-center gap-3 shrink-0">
                        <button
                          type="button"
                          className={`w-10 h-6 rounded-full flex items-center transition-colors px-1 ${current.show !== false ? 'bg-[var(--success)]' : 'bg-[var(--border)]'}`}
                          onClick={() => updateSection('show', current.show === false ? true : false)}
                        >
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform ${current.show !== false ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                        <span className="text-xs font-bold">{sec.label}</span>
                      </div>
                      
                      {!sec.noTitle && (
                        <div className="flex-1">
                          <input 
                            type="text" 
                            disabled={current.show === false}
                            placeholder={`Judul Default: ${sec.defaultTitle}`}
                            className={`w-full px-3 py-2 rounded-lg border border-[var(--border)] text-sm font-semibold transition-all ${current.show === false ? 'bg-[var(--bg-main)] opacity-50' : 'bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none'}`}
                            value={current.title || ''}
                            onChange={(e) => updateSection('title', e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Action Save Button */}
        <div className="flex justify-end mt-2">
          <button 
            type="submit" 
            className="px-6 py-3.5 rounded-xl font-bold text-white flex items-center gap-2 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 text-sm"
            style={{ background: 'var(--accent-gradient)' }}
          >
            <Save size={18} /> Simpan Seluruh Pengaturan
          </button>
        </div>

      </form>
    </div>
  );
}