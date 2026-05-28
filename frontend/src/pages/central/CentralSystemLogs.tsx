import { useEffect, useState } from 'react';
import { ServerCrash, ShieldAlert, Activity, Trash2, Clock, CheckCircle2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';

export function CentralSystemLogs() {
  const [activeTab, setActiveTab] = useState<'metrics'|'audit'|'error'|'purge'>('metrics');
  const [data, setData] = useState({
    auditLogs: [] as any[],
    errorLogs: [] as any[],
    apiMetrics: {} as Record<string, string>
  });
  const [loading, setLoading] = useState(true);
  const [purging, setPurging] = useState(false);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/central/system/logs');
      setData(res.data);
    } catch {
      toast.error('Gagal memuat log sistem.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const handlePurge = async () => {
    if (!window.confirm('PERINGATAN: Tindakan ini akan menghapus permanen data yang di-soft-delete (batal) lebih dari 30 hari. Lanjutkan?')) return;
    
    setPurging(true);
    try {
      const res = await api.post('/central/system/purge');
      toast.success(`Berhasil! ${res.data.result.transactionsPurged} transaksi & ${res.data.result.tenantsPurged} tenant kadaluwarsa dibersihkan.`);
      fetchLogs();
    } catch {
      toast.error('Gagal membersihkan database.');
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-extrabold text-[var(--text-primary)] flex items-center gap-3">
          <ServerCrash className="text-rose-500" size={32} /> Command Center
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">Sistem pelacakan intelijen, log error, dan pembersihan server.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 bg-[var(--bg-surface-elevated)] p-2 rounded-2xl border border-[var(--border)] overflow-x-auto custom-scrollbar">
        <button onClick={() => setActiveTab('metrics')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'metrics' ? 'bg-indigo-500 text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-main)]'}`}>
          <Activity size={18} /> API Version Metrics
        </button>
        <button onClick={() => setActiveTab('audit')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'audit' ? 'bg-amber-500 text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-main)]'}`}>
          <ShieldAlert size={18} /> Global Audit Log
        </button>
        <button onClick={() => setActiveTab('error')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'error' ? 'bg-rose-500 text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-main)]'}`}>
          <ServerCrash size={18} /> Error Tracker
        </button>
        <button onClick={() => setActiveTab('purge')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'purge' ? 'bg-gray-700 text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-main)]'}`}>
          <Trash2 size={18} /> Database Archiving
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl flex-1 overflow-hidden flex flex-col shadow-sm">
        {loading ? (
          <div className="p-5 text-center text-[var(--text-secondary)]">Menganalisis server...</div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
            
            {/* Tab: API Metrics */}
            {activeTab === 'metrics' && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Lalu Lintas API (Hari Ini)</h2>
                {Object.keys(data.apiMetrics).length === 0 ? (
                  <p className="text-[var(--text-secondary)]">Belum ada aktivitas API terekam hari ini di Redis.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(data.apiMetrics).map(([version, count]) => (
                      <div key={version} className="p-5 bg-[var(--bg-main)] border border-[var(--border)] rounded-2xl flex flex-col items-center">
                        <span className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">API Version</span>
                        <span className="text-xl font-extrabold text-indigo-500 font-mono">{version}</span>
                        <div className="mt-4 px-4 py-1 bg-indigo-500/10 text-indigo-500 rounded-full text-sm font-bold">
                          {count} Requests
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Audit Log */}
            {activeTab === 'audit' && (
              <div className="animate-fade-in">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="text-[var(--text-secondary)] border-b border-[var(--border)] uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Waktu</th>
                      <th className="pb-3 font-semibold">Aksi</th>
                      <th className="pb-3 font-semibold">Aktor (Admin ID)</th>
                      <th className="pb-3 font-semibold">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {data.auditLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-[var(--bg-main)] transition-colors">
                        <td className="py-2.5 text-[var(--text-secondary)] flex items-center gap-1"><Clock size={12}/> {new Date(log.createdAt).toLocaleString('id-ID')}</td>
                        <td className="py-2.5">
                          <span className="px-2 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold rounded text-[10px]">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2.5 text-[var(--text-primary)] font-mono text-xs">{log.actorId || 'SYSTEM'}</td>
                        <td className="py-2.5 text-[var(--text-secondary)] truncate max-w-xs" title={log.details}>{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab: Error Tracker */}
            {activeTab === 'error' && (
              <div className="animate-fade-in">
                <div className="flex flex-col gap-3">
                  {data.errorLogs.length === 0 ? (
                    <div className="text-center py-10 flex flex-col items-center text-[var(--text-secondary)]">
                      <CheckCircle2 size={48} className="text-emerald-500 mb-2"/>
                      <p className="font-bold">Sistem Stabil!</p>
                      <p className="text-sm">Tidak ada error internal 500 yang terekam.</p>
                    </div>
                  ) : (
                    data.errorLogs.map((err: any) => (
                      <div key={err.id} className="bg-[var(--bg-main)] border border-red-500/20 rounded-xl p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-red-500 break-all">{err.message}</h3>
                          <span className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1 shrink-0"><Clock size={12}/> {new Date(err.createdAt).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex gap-4 text-xs text-[var(--text-secondary)] mb-3 font-mono">
                          <span className="bg-[var(--bg-surface-elevated)] px-2 py-1 rounded">Method: {err.method}</span>
                          <span className="bg-[var(--bg-surface-elevated)] px-2 py-1 rounded break-all">Path: {err.path}</span>
                          {err.tenantId && <span className="bg-[var(--bg-surface-elevated)] px-2 py-1 rounded text-amber-500">Tenant: {err.tenantId}</span>}
                        </div>
                        <pre className="text-[10px] bg-black/80 text-green-400 p-3 rounded-lg overflow-x-auto custom-scrollbar">
                          {err.stack}
                        </pre>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tab: Purge */}
            {activeTab === 'purge' && (
              <div className="animate-fade-in flex flex-col items-center justify-center text-center py-10">
                <Trash2 size={64} className="text-rose-500 mb-4 opacity-80" />
                <h2 className="text-xl font-extrabold text-[var(--text-primary)] mb-2">Database Optimizer</h2>
                <p className="text-[var(--text-secondary)] max-w-md mb-8">
                  Pembersihan ini akan menghapus secara permanen semua transaksi yang di-*void* (batal) dan *tenant* berstatus *TRIAL* mati yang telah usang melebihi **30 hari**. Proses ini membebaskan ruang _database_ (Archiving).
                </p>
                <button 
                  onClick={handlePurge}
                  disabled={purging}
                  className="px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white font-extrabold rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {purging ? 'Membersihkan Server...' : 'Jalankan Pembersihan Sekarang (Purge)'}
                </button>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
