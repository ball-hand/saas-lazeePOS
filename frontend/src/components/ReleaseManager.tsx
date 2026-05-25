import { useEffect, useState } from 'react';
import { Rocket, RefreshCw, X } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

interface Release {
  version: string;
  releaseNotes: string;
  isMandatory: boolean;
}

export function ReleaseManager() {
  const { user } = useAuth();
  const [release, setRelease] = useState<Release | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only tenant users need to see this pop-up (or you can show it to central too)
    // We'll show it to everyone for now.
    
    const checkRelease = async () => {
      try {
        const res = await api.get('/releases/latest');
        const latest = res.data.release;
        
        if (latest) {
          const storedVersion = localStorage.getItem('lazeepos_version');
          if (storedVersion !== latest.version) {
            setRelease(latest);
            setIsVisible(true);
          }
        }
      } catch (e) {
        // Silent fail
      }
    };

    // Check on mount
    checkRelease();
    
    // Check every 5 minutes
    const interval = setInterval(checkRelease, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    if (release?.isMandatory) return; // Cannot dismiss mandatory update
    localStorage.setItem('lazeepos_version', release!.version);
    setIsVisible(false);
  };

  const handleReload = () => {
    localStorage.setItem('lazeepos_version', release!.version);
    window.location.reload();
  };

  if (!isVisible || !release) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 animate-fade-in">
      <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header Art */}
        <div className={`p-6 text-center ${release.isMandatory ? 'bg-red-500/10' : 'bg-indigo-500/10'} relative`}>
          {!release.isMandatory && (
            <button onClick={handleDismiss} className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <X size={20}/>
            </button>
          )}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--bg-surface-elevated)] shadow-lg mb-4">
            <Rocket size={32} className={release.isMandatory ? 'text-red-500' : 'text-indigo-500'}/>
          </div>
          <h2 className="text-2xl font-extrabold text-[var(--text-primary)]">Versi Baru Tersedia!</h2>
          <p className="text-sm font-bold text-[var(--text-secondary)] mt-1">LazeePOS {release.version}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm font-bold text-[var(--text-primary)] mb-3">Yang baru di versi ini:</p>
          <div className="bg-[var(--bg-main)] p-4 rounded-xl text-sm text-[var(--text-secondary)] max-h-48 overflow-y-auto whitespace-pre-wrap custom-scrollbar border border-[var(--border)] mb-6">
            {release.releaseNotes}
          </div>

          {release.isMandatory ? (
            <div>
              <p className="text-xs text-red-500 font-bold text-center mb-3">
                Pembaruan ini bersifat Wajib (Mandatory). Anda harus memuat ulang aplikasi untuk melanjutkan pekerjaan.
              </p>
              <button onClick={handleReload} className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                <RefreshCw size={18}/> Muat Ulang Aplikasi Sekarang
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={handleDismiss} className="flex-1 py-3 text-[var(--text-secondary)] font-bold rounded-xl border border-[var(--border)] hover:bg-[var(--bg-main)] transition-colors">
                Nanti Saja
              </button>
              <button onClick={handleReload} className="flex-1 py-3 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                <RefreshCw size={18}/> Update
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
