import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Save, Store, Palette, Moon, Sun } from 'lucide-react';
import toast from 'react-hot-toast';

export function Settings() {
  const { themeMode, primaryColor, storeName, updateTheme } = useTheme();
  const [name, setName] = useState(storeName);
  const [color, setColor] = useState(primaryColor);
  const [mode, setMode] = useState(themeMode);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateTheme({ name, primaryColor: color, themeMode: mode });
    toast.success('Pengaturan identitas tenant berhasil disimpan!');
  };

  return (
    <div className="animate-fade-in flex flex-col gap-8 pb-10 max-w-3xl">
      <div>
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Pengaturan Toko</h1>
        <p className="text-[var(--text-secondary)] mt-1 font-medium">Sesuaikan branding aplikasi POS ini sesuai dengan identitas bisnis unik Anda.</p>
      </div>

      <form onSubmit={handleSave} className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-6 shadow-sm flex flex-col gap-6">
        
        {/* Nama Toko */}
        <div>
          <label className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 mb-2">
            <Store size={18} className="text-[var(--accent-primary)]" /> Nama Bisnis / Tenant
          </label>
          <input 
            type="text" 
            required
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none transition-all font-semibold"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Pilihan Warna Tema */}
        <div>
          <label className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 mb-2">
            <Palette size={18} className="text-[var(--accent-primary)]" /> Warna Utama Aplikasi (Aksen)
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
              <p className="text-xs text-[var(--text-secondary)] font-medium">Warna ini akan menjadi aksen tombol, border aktif, dan gradien navigasi.</p>
            </div>
          </div>
        </div>

        {/* Mode Tampilan */}
        <div>
          <label className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 mb-3">
            Mode Tema Visual
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setMode('light')}
              className={`p-4 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all ${
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
              className={`p-4 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all ${
                mode === 'dark'
                  ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-sm'
                  : 'bg-[var(--bg-main)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]'
              }`}
            >
              <Moon size={18} /> Dark Mode
            </button>
          </div>
        </div>

        {/* Tombol Simpan */}
        <div className="mt-4 pt-5 border-t border-[var(--border)] flex justify-end">
          <button 
            type="submit" 
            className="px-5 py-3 rounded-xl font-bold text-white flex items-center gap-2 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
            style={{ background: 'var(--accent-gradient)' }}
          >
            <Save size={18} /> Simpan Perubahan Branding
          </button>
        </div>

      </form>
    </div>
  );
}