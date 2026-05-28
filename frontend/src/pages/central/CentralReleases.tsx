import { useEffect, useState } from 'react';
import { Rocket, Plus, CheckCircle2, Megaphone, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { Modal } from '../../components/Modal';

interface Release {
  id: string;
  version: string;
  releaseNotes: string;
  isMandatory: boolean;
  publishedAt: string;
}

export function CentralReleases() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newVersion, setNewVersion] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isMandatory, setIsMandatory] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const fetchReleases = async () => {
    try {
      const res = await api.get('/central/releases');
      setReleases(res.data.releases);
    } catch {
      toast.error('Gagal memuat riwayat rilis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReleases(); }, []);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishing(true);
    try {
      await api.post('/central/releases', {
        version: newVersion,
        releaseNotes: newNotes,
        isMandatory
      });
      toast.success('Rilis berhasil dipublikasikan!');
      setIsCreateOpen(false);
      setNewVersion('');
      setNewNotes('');
      setIsMandatory(false);
      fetchReleases();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal merilis versi baru.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-[var(--text-primary)] flex items-center gap-3">
            <Rocket className="text-indigo-500" size={32} /> Pengumuman Rilis
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">Publikasikan fitur baru dan paksa update aplikasi di perangkat kasir.</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-bold rounded-xl transition-colors shadow-lg"
        >
          <Plus size={18} /> Rilis Versi Baru
        </button>
      </div>

      {/* Timeline List */}
      <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl flex-1 overflow-hidden flex flex-col shadow-sm p-5">
        <h2 className="font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2"><Megaphone size={20}/> Riwayat Publikasi</h2>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-6">
          {loading ? (
            <p className="text-center text-[var(--text-secondary)] py-10">Memuat data...</p>
          ) : releases.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-[var(--text-secondary)] opacity-60">
              <Rocket size={48} className="mb-4" />
              <p className="font-semibold text-lg">Belum ada versi yang dirilis.</p>
            </div>
          ) : (
            releases.map((rel, index) => (
              <div key={rel.id} className="relative pl-6 border-l-2 border-[var(--border)] pb-2">
                <div className="absolute w-4 h-4 bg-[var(--accent-primary)] rounded-full -left-[9px] top-1 border-4 border-[var(--bg-surface-elevated)]" />
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-extrabold text-xl text-[var(--text-primary)] font-mono">{rel.version}</span>
                  {index === 0 && <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold rounded uppercase">Latest</span>}
                  {rel.isMandatory && <span className="px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-bold rounded uppercase">Mandatory</span>}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider mb-3">
                  <Calendar size={12}/> {new Date(rel.publishedAt).toLocaleString('id-ID')}
                </div>
                <div className="bg-[var(--bg-main)] border border-[var(--border)] p-4 rounded-xl text-sm text-[var(--text-primary)] whitespace-pre-wrap">
                  {rel.releaseNotes}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Publish */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Rilis Versi Baru">
        <form onSubmit={handlePublish} className="space-y-5">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-amber-500">
            <Rocket className="shrink-0" size={24}/>
            <div className="text-sm">
              <p className="font-bold mb-1">Perhatian</p>
              <p>Mempublikasikan versi baru akan memicu jendela pop-up di layar semua kasir. Pastikan catatan rilis ditulis dengan jelas dan rapi.</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Versi Rilis (Wajib Unik)</label>
            <input
              type="text" required
              value={newVersion}
              onChange={(e) => setNewVersion(e.target.value)}
              placeholder="Contoh: v1.0.5 atau 2.0.0-beta"
              className="w-full p-2.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl focus:border-[var(--accent-primary)] font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Catatan Rilis (Release Notes)</label>
            <textarea
              required rows={6}
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="- Penambahan fitur Diskon Bertingkat&#10;- Perbaikan bug pada perhitungan pajak&#10;- Pembaruan UI struk"
              className="w-full p-2.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl focus:border-[var(--accent-primary)] resize-none"
            />
          </div>
          <div className="flex items-center gap-3 p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
            <input
              type="checkbox"
              id="mandatory"
              checked={isMandatory}
              onChange={(e) => setIsMandatory(e.target.checked)}
              className="w-5 h-5 accent-red-500 rounded"
            />
            <label htmlFor="mandatory" className="text-sm font-bold text-red-500 cursor-pointer flex-1">
              Jadikan ini Mandatory Update (Pembaruan Wajib)
              <span className="block text-[10px] text-red-500/70 font-normal mt-0.5">Kasir tidak akan bisa menutup pop-up dan dipaksa memuat ulang peramban. Gunakan jika ada perubahan skema database atau bug fatal.</span>
            </label>
          </div>
          
          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-sm font-bold text-[var(--text-secondary)]">Batal</button>
            <button type="submit" disabled={publishing} className="px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white rounded-xl text-sm font-bold shadow-md disabled:opacity-50">
              {publishing ? 'Memproses...' : 'Publikasikan Sekarang'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
