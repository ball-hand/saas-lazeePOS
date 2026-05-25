import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Save, Store, Moon, Sun, Receipt, Percent, FileText } from 'lucide-react';
import api, { getMediaUrl } from '../api/client';
import toast from 'react-hot-toast';

export function Settings() {
  const { themeMode, primaryColor, storeName: contextStoreName, logoUrl: contextLogoUrl, logoShape: contextLogoShape, updateTheme } = useTheme();
  
  // Branding state
  const [storeName, setStoreName] = useState(contextStoreName);
  const [color, setColor] = useState(primaryColor);
  const [mode, setMode] = useState(themeMode);
  const [logoUrl, setLogoUrl] = useState(contextLogoUrl);
  const [logoShape, setLogoShape] = useState(contextLogoShape || 'square');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  
  // Custom Receipt & Tax state
  const [receiptSubtitle, setReceiptSubtitle] = useState('Sistem Kasir Digital');
  const [receiptFooter, setReceiptFooter] = useState('Terima kasih atas kunjungan Anda!');
  const [taxRate, setTaxRate] = useState('0');

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
  }, [contextStoreName, primaryColor, themeMode, contextLogoUrl]);

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
      let configPayload = { ...landingPageConfig };

      // 1. Upload logo if new file selected
      if (logoFile) {
        uploadedLogoUrl = await handleMediaUpload(logoFile);
        setLogoUrl(uploadedLogoUrl);
      }

      // 2. Persist branding changes to backend DB
      const { data } = await api.put('/settings/tenant', {
        name: storeName,
        primaryColor: color,
        themeMode: mode,
        logoUrl: uploadedLogoUrl,
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

      toast.success('Pengaturan toko & personalisasi berhasil disimpan!', { id: loadingToast });
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Gagal menyimpan pengaturan ke server.', { id: loadingToast });
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6 pb-10">
      <div className="sticky top-[-16px] md:top-[-24px] lg:top-[-32px] z-20 bg-[var(--bg-main)] pt-4 md:pt-6 lg:pt-8 pb-4 -mt-4 md:-mt-6 lg:-mt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--border)] mb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Pengaturan Toko</h1>
          <p className="text-[var(--text-secondary)] mt-1 font-medium">Atur profil, tema, pajak, dan cetak struk kasir Anda.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        
        {/* Section 1: Branding Identitas Tenant */}
        <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-6 shadow-sm flex flex-col gap-6">
          <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <Store size={18} className="text-[var(--accent-primary)]" /> Branding & Tema Aplikasi
          </h2>

          <div className="flex flex-col sm:flex-row gap-6">
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

            {/* Nama Toko & Bentuk Logo */}
            <div className="flex-1 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">
                  Nama Bisnis / Tenant *
                </label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none transition-all font-semibold text-sm"
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
        <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-6 shadow-sm flex flex-col gap-6">
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
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm font-semibold transition-all"
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
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm font-bold transition-all"
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
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm font-semibold transition-all resize-none"
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
            />
          </div>
        </div>

        {/* Section 3: Landing Page Publik */}
        <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-6 shadow-sm flex flex-col gap-6">
          <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <Store size={18} className="text-[var(--accent-primary)]" /> Pengaturan Halaman Publik (Landing Page)
          </h2>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">
                Judul Utama (Hero Title)
              </label>
              <input 
                type="text" 
                placeholder={`Selamat Datang di ${storeName}`}
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm font-semibold transition-all"
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
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm font-semibold transition-all resize-none custom-scrollbar"
                value={landingPageConfig?.heroSubtitle || ''}
                onChange={(e) => setLandingPageConfig({ ...landingPageConfig, heroSubtitle: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">
                Kata Pengantar (Tentang Toko)
              </label>
              <textarea 
                placeholder="Toko kami berdiri sejak tahun... Kami selalu menyajikan kualitas..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm font-semibold transition-all resize-none custom-scrollbar"
                value={landingPageConfig?.introduction || ''}
                onChange={(e) => setLandingPageConfig({ ...landingPageConfig, introduction: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">Jargon / Slogan</label>
                <input type="text" placeholder="Harga pas, kualitas puas!" className="w-full px-4 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm font-semibold transition-all" value={landingPageConfig?.jargon || ''} onChange={(e) => setLandingPageConfig({ ...landingPageConfig, jargon: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">Link / Alamat Google Maps (iframe/URL)</label>
                <input type="text" placeholder="https://maps.google.com/..." className="w-full px-4 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm font-semibold transition-all" value={landingPageConfig?.mapLocation || ''} onChange={(e) => setLandingPageConfig({ ...landingPageConfig, mapLocation: e.target.value })} />
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-4 pb-2 mt-2">
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">Pengumuman Toko (Promo / Info)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">Judul Pengumuman</label>
                  <input type="text" placeholder="Cth: Promo Ramadhan!" className="w-full px-4 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm font-semibold transition-all mb-4" value={landingPageConfig?.announcement?.title || ''} onChange={(e) => setLandingPageConfig({ ...landingPageConfig, announcement: { ...landingPageConfig.announcement, title: e.target.value } })} />
                  
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">Isi Pengumuman</label>
                  <textarea rows={3} placeholder="Dapatkan diskon 50% untuk..." className="w-full px-4 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm font-semibold transition-all resize-none custom-scrollbar" value={landingPageConfig?.announcement?.description || ''} onChange={(e) => setLandingPageConfig({ ...landingPageConfig, announcement: { ...landingPageConfig.announcement, description: e.target.value } })} />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">Banner Pengumuman (Opsional)</label>
                  <label className="w-full h-32 border-2 border-dashed border-[var(--border)] rounded-xl flex items-center justify-center cursor-pointer hover:border-[var(--accent-primary)] transition-colors relative overflow-hidden group">
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        setIsUploadingMedia(true);
                        try {
                          const url = await handleMediaUpload(e.target.files[0]);
                          setLandingPageConfig({ ...landingPageConfig, announcement: { ...landingPageConfig.announcement, bannerUrl: url } });
                        } catch(err) { toast.error('Gagal upload banner'); }
                        finally { setIsUploadingMedia(false); }
                      }
                    }} />
                    {landingPageConfig?.announcement?.bannerUrl ? (
                      <img src={getMediaUrl(landingPageConfig.announcement.bannerUrl)} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-[var(--text-secondary)]">{isUploadingMedia ? 'Mengunggah...' : 'Upload Banner'}</span>
                    )}
                  </label>
                </div>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[var(--border)] pt-4">
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">WhatsApp</label>
                <input type="text" placeholder="081234567890" className="w-full px-4 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm font-semibold transition-all" value={landingPageConfig?.whatsapp || ''} onChange={(e) => setLandingPageConfig({ ...landingPageConfig, whatsapp: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">Instagram</label>
                <input type="text" placeholder="tokosaya" className="w-full px-4 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm font-semibold transition-all" value={landingPageConfig?.instagram || ''} onChange={(e) => setLandingPageConfig({ ...landingPageConfig, instagram: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">TikTok</label>
                <input type="text" placeholder="tokosaya_tiktok" className="w-full px-4 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none text-sm font-semibold transition-all" value={landingPageConfig?.tiktok || ''} onChange={(e) => setLandingPageConfig({ ...landingPageConfig, tiktok: e.target.value })} />
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