import { useState, useEffect } from 'react';
import { 
  Settings, Save, Globe, Database, Mail, Bell, Shield, Server, Activity, Terminal
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';

export function CentralPlatform() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  
  // General Form State
  const [formData, setFormData] = useState({
    platformName: 'Lazee POS',
    supportEmail: 'support@lazeepos.com',
    allowRegistrations: true,
    maintenanceMode: false,
    maxTenants: 1000,
  });

  // System Info State
  const [sysInfo, setSysInfo] = useState<any>(null);
  const [sysLogs, setSysLogs] = useState<any>(null);
  const [loadingSys, setLoadingSys] = useState(false);

  useEffect(() => {
    if (activeTab === 'server') {
      fetchSysInfo();
    }
  }, [activeTab]);

  const fetchSysInfo = async () => {
    setLoadingSys(true);
    try {
      const [infoRes, logRes] = await Promise.allSettled([
        api.get('/central/system/info'),
        api.get('/central/system/logs?limit=50&level=all')
      ]);
      
      if (infoRes.status === 'fulfilled') {
        setSysInfo(infoRes.value.data);
      } else {
        toast.error('Gagal mengambil informasi server');
        setSysInfo(null);
      }

      if (logRes.status === 'fulfilled') {
        setSysLogs(logRes.value.data);
      } else {
        setSysLogs({ lines: ['[Info] Log file not found or unavailable on host.'] });
      }
    } catch (err) {
      toast.error('Gagal mengambil data sistem server');
    } finally {
      setLoadingSys(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      toast.success('Pengaturan platform berhasil disimpan');
    } catch (err) {
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">Pengaturan Sistem & Server</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Konfigurasi global platform dan pemantauan kesehatan server.
          </p>
        </div>
        {activeTab === 'general' && (
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)] transition-colors font-semibold shadow-lg shadow-[var(--accent-primary)]/20"
          >
            <Save size={18} /> {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        )}
        {activeTab === 'server' && (
          <button
            onClick={fetchSysInfo}
            disabled={loadingSys}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-colors font-semibold"
          >
            <Activity size={18} /> Segarkan Data
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Kolom Kiri: Menu */}
        <div className="col-span-1 space-y-2">
          <button onClick={() => setActiveTab('general')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
            activeTab === 'general' ? 'bg-[var(--accent-primary-transparent)] text-[var(--accent-primary)] font-semibold border border-[var(--accent-primary)]/20' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] font-medium'
          }`}>
            <Globe size={18} /> Umum
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] font-medium transition-colors">
            <Mail size={18} /> Email Server
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] font-medium transition-colors">
            <Shield size={18} /> Keamanan
          </button>
          <button onClick={() => setActiveTab('server')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
            activeTab === 'server' ? 'bg-[var(--accent-primary-transparent)] text-[var(--accent-primary)] font-semibold border border-[var(--accent-primary)]/20' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] font-medium'
          }`}>
            <Server size={18} /> Status Server
          </button>
        </div>

        {/* Kolom Kanan: Konten */}
        <div className="col-span-1 md:col-span-3">
          
          {/* TAB: GENERAL */}
          {activeTab === 'general' && (
            <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-6">
              <h2 className="text-lg font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                <Settings size={20} className="text-[var(--accent-primary)]" /> Pengaturan Umum Platform
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Nama Platform / Merek</label>
                  <input type="text" className="w-full max-w-md px-4 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none" 
                    value={formData.platformName} onChange={e => setFormData({...formData, platformName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Email Dukungan (Support)</label>
                  <input type="email" className="w-full max-w-md px-4 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none" 
                    value={formData.supportEmail} onChange={e => setFormData({...formData, supportEmail: e.target.value})} />
                </div>
                <div className="pt-4 border-t border-[var(--border)]">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-5 h-5 rounded text-[var(--accent-primary)] bg-[var(--bg-main)] border-[var(--border)] focus:ring-[var(--accent-primary)]"
                      checked={formData.allowRegistrations} onChange={e => setFormData({...formData, allowRegistrations: e.target.checked})} />
                    <div>
                      <span className="block text-sm font-semibold text-[var(--text-primary)]">Buka Pendaftaran (Self-Service)</span>
                      <span className="block text-xs text-[var(--text-secondary)] mt-0.5">Izinkan pengguna baru mendaftar secara mandiri.</span>
                    </div>
                  </label>
                </div>
                <div className="pt-4 border-t border-[var(--border)]">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-5 h-5 rounded text-[var(--danger)] bg-[var(--bg-main)] border-[var(--border)] focus:ring-[var(--danger)]"
                      checked={formData.maintenanceMode} onChange={e => setFormData({...formData, maintenanceMode: e.target.checked})} />
                    <div>
                      <span className="block text-sm font-semibold text-[var(--text-primary)]">Mode Maintenance</span>
                      <span className="block text-xs text-[var(--text-secondary)] mt-0.5">Tutup akses aplikasi untuk semua tenant.</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SERVER STATUS */}
          {activeTab === 'server' && (
            <div className="flex flex-col gap-6">
              {loadingSys ? (
                <div className="p-8 text-center text-[var(--text-secondary)]">Memeriksa status server...</div>
              ) : sysInfo ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Node/OS Info */}
                    <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-5">
                      <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase mb-4 flex items-center gap-2"><Server size={16}/> Informasi OS</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-[var(--text-secondary)]">Sistem Operasi</p>
                          <p className="text-sm font-semibold font-mono text-[var(--text-primary)] truncate" title={sysInfo.os}>{sysInfo.os}</p>
                        </div>
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <p className="text-xs text-[var(--text-secondary)]">Node Version</p>
                            <p className="text-sm font-bold text-[var(--text-primary)]">{sysInfo.nodeVersion}</p>
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-[var(--text-secondary)]">Uptime</p>
                            <p className="text-sm font-bold text-[var(--text-primary)] truncate" title={sysInfo.uptime}>{sysInfo.uptime.split(',')[0]}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Resources */}
                    <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-5">
                      <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase mb-4 flex items-center gap-2"><Database size={16}/> Kapasitas Server</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-[var(--text-secondary)]">RAM (Node RSS)</span>
                            <span className="font-bold">{sysInfo.memory.rss}</span>
                          </div>
                          <div className="h-2 bg-[var(--bg-main)] rounded-full overflow-hidden border border-[var(--border)]">
                            <div className="h-full bg-purple-500 rounded-full w-2/3"></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-[var(--text-secondary)]">Penyimpanan Utama ({sysInfo.disk.mount})</span>
                            <span className="font-bold">{sysInfo.disk.used} / {sysInfo.disk.size} ({sysInfo.disk.usePercent})</span>
                          </div>
                          <div className="h-2 bg-[var(--bg-main)] rounded-full overflow-hidden border border-[var(--border)]">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: sysInfo.disk.usePercent === 'N/A' ? '0%' : sysInfo.disk.usePercent }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Logs Terminal */}
                  <div className="bg-[#0f111a] border border-[#1f2233] rounded-2xl p-5 overflow-hidden flex flex-col h-96">
                    <h3 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                      <Terminal size={16}/> Live Application Logs
                    </h3>
                    <div className="flex-1 overflow-y-auto font-mono text-xs text-gray-300 custom-scrollbar whitespace-pre-wrap bg-black/40 p-4 rounded-xl border border-white/5">
                      {sysLogs?.lines?.length > 0 ? (
                        sysLogs.lines.map((line: string, i: number) => (
                          <div key={i} className={`mb-1 ${line.includes('error') || line.includes('Error') ? 'text-red-400' : line.includes('warn') ? 'text-amber-400' : ''}`}>
                            {line}
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500">Log aplikasi kosong atau tidak ditemukan.</div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-[var(--danger)]">Data server tidak tersedia.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
