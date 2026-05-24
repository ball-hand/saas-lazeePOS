import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Save, Store, Palette, Moon, Sun, Receipt, Percent, FileText } from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';

export function Settings() {
  const { themeMode, primaryColor, storeName, updateTheme } = useTheme();
  
  // Branding state
  const [name, setName] = useState(storeName);
  const [color, setColor] = useState(primaryColor);
  const [mode, setMode] = useState(themeMode);
  
  // Custom Receipt & Tax state
  const [receiptSubtitle, setReceiptSubtitle] = useState('Sistem Kasir Digital');
  const [receiptFooter, setReceiptFooter] = useState('Terima kasih atas kunjungan Anda!');
  const [taxRate, setTaxRate] = useState('0');

  // Load current values from DB and localStorage
  useEffect(() => {
    setName(storeName);
    setColor(primaryColor);
    setMode(themeMode);

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
  }, [storeName, primaryColor, themeMode]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading('Menyimpan pengaturan...');
    try {
      // 1. Persist branding changes to backend DB
      const { data } = await api.put('/settings/tenant', {
        name,
        primaryColor: color,
        themeMode: mode
      });

      // 2. Update frontend ThemeContext state
      if (data?.tenant) {
        updateTheme({
          name: data.tenant.name,
          primaryColor: data.tenant.primaryColor,
          themeMode: data.tenant.themeMode
        });
      }

      // 3. Save Custom Receipt Settings (Subtitle, Footer, Tax PPN) to localStorage
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
    <div className="animate-fade-in flex flex-col gap-8 pb-10 max-w-3xl">
      <div>
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Pengaturan & Personalisasi</h1>
        <p className="text-[var(--text-secondary)] mt-1 font-medium">Sesuaikan branding aplikasi POS, struk pencetakan, dan default pajak toko Anda.</p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        
        {/* Section 1: Branding Identitas Tenant */}
        <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-6 shadow-sm flex flex-col gap-6">
          <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <Store size={18} className="text-[var(--accent-primary)]" /> Branding & Tema Aplikasi
          </h2>

          {/* Nama Toko */}
          <div>
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">
              Nama Bisnis / Tenant *
            </label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none transition-all font-semibold text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
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