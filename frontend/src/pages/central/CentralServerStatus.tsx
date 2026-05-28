import { useState, useEffect } from 'react';
import { Database, Server, Terminal, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { Breadcrumb } from '../../components/shared/Breadcrumb';

export function CentralServerStatus() {
  const [sysInfo, setSysInfo] = useState<any>(null);
  const [sysLogs, setSysLogs] = useState<any>(null);
  const [loadingSys, setLoadingSys] = useState(false);

  useEffect(() => {
    fetchSysInfo();
  }, []);

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

  return (
    <div className="relative bg-[var(--bg-surface-elevated)] rounded-2xl border border-[var(--border)] shadow-sm min-h-[80vh] flex flex-col overflow-hidden animate-fade-in">
      {/* Subtle Dot Pattern Background */}
      <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--text-primary) 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
      
      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--border)] p-6 bg-[var(--bg-surface-elevated)]">
        <div>
          <div className="flex items-center gap-3">
            <Server className="text-blue-500" size={24} />
            <Breadcrumb items={[{ label: 'Central Admin' }, { label: 'Status Server' }]} />
          </div>
          <p className="text-[var(--text-secondary)] mt-2 text-sm font-medium">Pemantauan infrastruktur dan kapasitas server.</p>
        </div>
        <button
          onClick={fetchSysInfo}
          disabled={loadingSys}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-colors font-semibold shadow-sm"
        >
          <Activity size={18} /> Segarkan Data
        </button>
      </div>

      <div className="relative z-10 p-6 flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        {loadingSys ? (
          <div className="p-5 text-center text-[var(--text-secondary)]">Memeriksa status server...</div>
        ) : sysInfo ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Node/OS Info */}
              <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase mb-6 flex items-center gap-2">
                  <Server size={18}/> Informasi OS
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-[var(--text-secondary)] mb-1">Sistem Operasi</p>
                    <p className="text-sm font-semibold font-mono text-[var(--text-primary)] truncate" title={sysInfo.os}>{sysInfo.os}</p>
                  </div>
                  <div className="flex gap-4 pt-4 border-t border-[var(--border)]">
                    <div className="flex-1">
                      <p className="text-xs text-[var(--text-secondary)] mb-1">Node Version</p>
                      <p className="text-sm font-bold text-[var(--text-primary)]">{sysInfo.nodeVersion}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-[var(--text-secondary)] mb-1">Uptime</p>
                      <p className="text-sm font-bold text-[var(--text-primary)] truncate" title={sysInfo.uptime}>{sysInfo.uptime.split(',')[0]}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resources */}
              <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase mb-6 flex items-center gap-2">
                  <Database size={18}/> Kapasitas Server
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-[var(--text-secondary)]">RAM (Node RSS)</span>
                      <span className="font-bold text-[var(--text-primary)]">{sysInfo.memory.rss}</span>
                    </div>
                    <div className="h-3 bg-[var(--bg-main)] rounded-full overflow-hidden border border-[var(--border)]">
                      <div className="h-full bg-purple-500 rounded-full w-2/3"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-[var(--text-secondary)]">Penyimpanan Utama ({sysInfo.disk.mount})</span>
                      <span className="font-bold text-[var(--text-primary)]">{sysInfo.disk.used} / {sysInfo.disk.size} ({sysInfo.disk.usePercent})</span>
                    </div>
                    <div className="h-3 bg-[var(--bg-main)] rounded-full overflow-hidden border border-[var(--border)]">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: sysInfo.disk.usePercent === 'N/A' ? '0%' : sysInfo.disk.usePercent }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Logs Terminal */}
            <div className="bg-[#0f111a] border border-[#1f2233] rounded-2xl p-5 shadow-lg flex-1 flex flex-col min-h-[400px]">
              <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                <Terminal size={18}/> Live Application Logs
              </h3>
              <div className="flex-1 overflow-y-auto font-mono text-sm text-gray-300 custom-scrollbar whitespace-pre-wrap bg-black/40 p-5 rounded-xl border border-white/5">
                {sysLogs?.lines?.length > 0 ? (
                  sysLogs.lines.map((line: string, i: number) => (
                    <div key={i} className={`mb-1.5 ${line.includes('error') || line.includes('Error') ? 'text-red-400' : line.includes('warn') ? 'text-amber-400' : ''}`}>
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
          <div className="p-5 text-center text-[var(--danger)]">Data server tidak tersedia.</div>
        )}
      </div>
    </div>
  );
}
