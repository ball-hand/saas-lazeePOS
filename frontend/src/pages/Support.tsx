import { useEffect, useState } from 'react';
import { LifeBuoy, Plus, MessageSquare, Clock, CheckCircle2, AlertCircle, ChevronRight, X, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  updatedAt: string;
  _count?: { replies: number };
}

interface Reply {
  id: string;
  message: string;
  createdAt: string;
  isCentral: boolean;
  user?: { name: string; role: string };
}

interface TicketDetail extends Ticket {
  replies: Reply[];
}

export function Support() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIUM');

  const [activeTicket, setActiveTicket] = useState<TicketDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [replyMsg, setReplyMsg] = useState('');
  const [sending, setSending] = useState(false);

  const fetchTickets = async () => {
    try {
      const res = await api.get('/tickets');
      setTickets(res.data.tickets);
    } catch {
      toast.error('Gagal memuat tiket bantuan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const { userAgent } = navigator;
      await api.post('/tickets', {
        subject: newSubject,
        description: newDesc,
        priority: newPriority,
        userAgent
      });
      toast.success('Tiket berhasil dikirim');
      setIsCreateOpen(false);
      setNewSubject(''); setNewDesc(''); setNewPriority('MEDIUM');
      fetchTickets();
    } catch {
      toast.error('Gagal membuat tiket');
    } finally {
      setSending(false);
    }
  };

  const openDetail = async (id: string) => {
    try {
      const res = await api.get(`/tickets/${id}`);
      setActiveTicket(res.data.ticket);
      setIsDetailOpen(true);
    } catch {
      toast.error('Gagal memuat detail tiket');
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyMsg.trim()) return;
    setSending(true);
    try {
      await api.post(`/tickets/${activeTicket.id}/reply`, { message: replyMsg });
      setReplyMsg('');
      const res = await api.get(`/tickets/${activeTicket.id}`);
      setActiveTicket(res.data.ticket);
      fetchTickets();
    } catch {
      toast.error('Gagal mengirim balasan');
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN': return <span className="px-2 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-md text-xs font-bold">OPEN</span>;
      case 'IN_PROGRESS': return <span className="px-2 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-md text-xs font-bold">IN PROGRESS</span>;
      case 'RESOLVED': 
      case 'CLOSED': return <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-md text-xs font-bold">{status}</span>;
      default: return null;
    }
  };

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] flex items-center gap-3">
            <LifeBuoy className="text-indigo-500" size={32} /> Pusat Bantuan
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">Sampaikan kendala sistem atau laporkan bug ke tim Support.</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-bold rounded-xl transition-colors shadow-lg"
        >
          <Plus size={18} /> Buat Tiket
        </button>
      </div>

      {/* List */}
      <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl flex-1 overflow-hidden flex flex-col shadow-sm">
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {loading ? (
            <p className="text-center p-8 text-[var(--text-secondary)]">Memuat data...</p>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)] opacity-60">
              <MessageSquare size={64} className="mb-4" />
              <p className="font-semibold text-lg">Belum ada tiket bantuan</p>
              <p className="text-sm mt-1">Tekan tombol 'Buat Tiket' jika Anda memiliki kendala.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {tickets.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => openDetail(t.id)}
                  className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-main)]/30 hover:border-[var(--accent-primary)]/50 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-3 mb-1">
                      {getStatusBadge(t.status)}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        t.priority === 'CRITICAL' ? 'bg-red-500 text-white' : 'bg-gray-500/20 text-[var(--text-secondary)]'
                      }`}>
                        {t.priority}
                      </span>
                    </div>
                    <h3 className="font-bold text-[var(--text-primary)] truncate">{t.subject}</h3>
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1"><Clock size={12}/> Update: {new Date(t.updatedAt).toLocaleString('id-ID')}</span>
                      <span className="flex items-center gap-1"><MessageSquare size={12}/> {t._count?.replies} balasan</span>
                    </div>
                  </div>
                  <ChevronRight className="text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] transition-colors" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Create */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Buat Tiket Bantuan">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Prioritas</label>
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              className="w-full p-2.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl focus:border-[var(--accent-primary)]"
            >
              <option value="LOW">Low (Pertanyaan Umum)</option>
              <option value="MEDIUM">Medium (Kendala Minor)</option>
              <option value="HIGH">High (Fitur Penting Rusak)</option>
              <option value="CRITICAL">Critical (Sistem Mati/Crash)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Subjek Masalah</label>
            <input
              type="text" required
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="Contoh: Gagal cetak struk"
              className="w-full p-2.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl focus:border-[var(--accent-primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-[var(--text-primary)] mb-1">Deskripsi Detail</label>
            <textarea
              required rows={4}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Ceritakan dengan jelas langkah-langkah terjadinya error..."
              className="w-full p-2.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl focus:border-[var(--accent-primary)] resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-sm font-bold text-[var(--text-secondary)]">Batal</button>
            <button type="submit" disabled={sending} className="px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white rounded-xl text-sm font-bold shadow-md disabled:opacity-50">
              {sending ? 'Mengirim...' : 'Kirim Tiket'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detail & Chat */}
      {activeTicket && (
        <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Detail Tiket" size="lg">
          <div className="flex flex-col h-[60vh]">
            <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-main)]/50">
              <div className="flex items-center gap-2 mb-2">
                {getStatusBadge(activeTicket.status)}
                <span className="text-xs font-mono text-[var(--text-secondary)]">ID: {activeTicket.id.split('-')[0]}</span>
              </div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">{activeTicket.subject}</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {/* Original Post */}
              <div className="flex flex-col items-end">
                <div className="bg-[var(--accent-primary)] text-white rounded-2xl rounded-tr-none px-4 py-3 max-w-[85%]">
                  <p className="text-sm whitespace-pre-wrap">{activeTicket.description}</p>
                </div>
                <span className="text-[10px] text-[var(--text-secondary)] mt-1 mr-1">Anda • {new Date(activeTicket.createdAt).toLocaleString('id-ID')}</span>
              </div>

              {/* Replies */}
              {activeTicket.replies.map(reply => (
                <div key={reply.id} className={`flex flex-col ${reply.isCentral ? 'items-start' : 'items-end'}`}>
                  <div className={`rounded-2xl px-4 py-3 max-w-[85%] ${
                    reply.isCentral 
                      ? 'bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] rounded-tl-none' 
                      : 'bg-[var(--accent-primary)] text-white rounded-tr-none'
                  }`}>
                    {reply.isCentral && <p className="text-[10px] font-bold text-[var(--accent-primary)] mb-1 uppercase tracking-wider">Super Admin</p>}
                    <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                  </div>
                  <span className="text-[10px] text-[var(--text-secondary)] mt-1 mx-1">
                    {reply.isCentral ? 'Central Support' : 'Anda'} • {new Date(reply.createdAt).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>

            {/* Input Box */}
            <div className="p-4 border-t border-[var(--border)]">
              {activeTicket.status === 'CLOSED' ? (
                <div className="text-center p-3 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 text-sm font-bold">
                  Tiket ini telah ditutup.
                </div>
              ) : (
                <form onSubmit={handleReply} className="flex gap-2">
                  <input
                    type="text"
                    value={replyMsg}
                    onChange={(e) => setReplyMsg(e.target.value)}
                    placeholder="Tulis balasan..."
                    className="flex-1 p-2.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl focus:border-[var(--accent-primary)]"
                  />
                  <button type="submit" disabled={sending || !replyMsg.trim()} className="px-4 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white rounded-xl disabled:opacity-50 flex items-center justify-center">
                    <Send size={18}/>
                  </button>
                </form>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
