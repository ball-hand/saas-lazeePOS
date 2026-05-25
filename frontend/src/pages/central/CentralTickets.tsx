import { useEffect, useState } from 'react';
import { LifeBuoy, Search, MessageSquare, CheckCircle2, Clock, Send, User } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import { Modal } from '../../components/Modal';
import { Link } from 'react-router-dom';

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  userAgent: string | null;
  updatedAt: string;
  createdAt: string;
  tenant: { id: string; name: string; subdomain: string };
  user: { name: string; role: string; email?: string };
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

export function CentralTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page] = useState(1);

  const [activeTicket, setActiveTicket] = useState<TicketDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [replyMsg, setReplyMsg] = useState('');
  const [sending, setSending] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/central/tickets', {
        params: { search, status: statusFilter, page, limit: 15 }
      });
      setTickets(res.data.tickets);
    } catch {
      toast.error('Gagal memuat daftar tiket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(fetchTickets, 300);
    return () => clearTimeout(delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, page]);

  const openDetail = async (id: string) => {
    try {
      const res = await api.get(`/central/tickets/${id}`);
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
      await api.post(`/central/tickets/${activeTicket.id}/reply`, { message: replyMsg });
      setReplyMsg('');
      const res = await api.get(`/central/tickets/${activeTicket.id}`);
      setActiveTicket(res.data.ticket);
      fetchTickets();
    } catch {
      toast.error('Gagal mengirim balasan');
    } finally {
      setSending(false);
    }
  };

  const changeStatus = async (status: string) => {
    if (!activeTicket) return;
    try {
      await api.put(`/central/tickets/${activeTicket.id}/status`, { status });
      toast.success('Status tiket diubah');
      const res = await api.get(`/central/tickets/${activeTicket.id}`);
      setActiveTicket(res.data.ticket);
      fetchTickets();
    } catch {
      toast.error('Gagal mengubah status');
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
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)] flex items-center gap-3">
          <LifeBuoy className="text-indigo-500" size={32} /> Support Ticketing
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">Sistem manajemen resolusi komplain tenant.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
          <input
            type="text"
            placeholder="Cari subjek atau nama toko..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-xl focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-xl focus:border-[var(--accent-primary)]"
        >
          <option value="">Semua Status</option>
          <option value="OPEN">Open (Baru)</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {/* Table List */}
      <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl flex-1 flex flex-col min-h-0 overflow-hidden shadow-sm">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 bg-[var(--bg-surface-elevated)] z-10 shadow-sm">
              <tr className="text-[var(--text-secondary)] border-b border-[var(--border)] text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold w-1/3">Subjek & Update</th>
                <th className="p-4 font-semibold">Toko & Pelapor</th>
                <th className="p-4 font-semibold">Prioritas</th>
                <th className="p-4 font-semibold text-center">Status</th>
                <th className="p-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-[var(--text-secondary)]">Memuat tiket...</td></tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    <div className="flex flex-col items-center text-[var(--text-secondary)]">
                      <CheckCircle2 size={48} className="mb-4 text-emerald-500/50" />
                      <p className="font-bold text-lg text-[var(--text-primary)]">Inbox Kosong!</p>
                      <p>Tidak ada keluhan yang masuk.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                tickets.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[var(--bg-main)]/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-[var(--text-primary)] mb-1 truncate max-w-sm">{tx.subject}</div>
                      <div className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
                        <span className="flex items-center gap-1"><Clock size={12}/> {new Date(tx.updatedAt).toLocaleString('id-ID')}</span>
                        <span className="flex items-center gap-1"><MessageSquare size={12}/> {tx._count?.replies} msg</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-[var(--text-primary)]">{tx.tenant.name}</div>
                      <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1 mt-0.5">
                        <User size={10}/> {tx.user.name} ({tx.user.role})
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        tx.priority === 'CRITICAL' ? 'bg-red-500 text-white' : 
                        tx.priority === 'HIGH' ? 'bg-amber-500 text-white' : 'bg-gray-500/20 text-[var(--text-secondary)]'
                      }`}>
                        {tx.priority}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {getStatusBadge(tx.status)}
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => openDetail(tx.id)} className="px-4 py-1.5 bg-[var(--bg-main)] hover:bg-[var(--accent-primary)] hover:text-white border border-[var(--border)] rounded-lg text-sm font-bold transition-colors">
                        Buka
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Respond */}
      {activeTicket && (
        <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Resolusi Tiket" size="lg">
          <div className="flex flex-col h-[70vh]">
            {/* Context Header */}
            <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-main)]/50 grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {getStatusBadge(activeTicket.status)}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        activeTicket.priority === 'CRITICAL' ? 'bg-red-500 text-white' : 'bg-gray-500/20 text-[var(--text-secondary)]'
                      }`}>{activeTicket.priority}</span>
                </div>
                <h2 className="text-xl font-extrabold text-[var(--text-primary)]">{activeTicket.subject}</h2>
              </div>
              <div className="text-right text-sm">
                <p className="font-bold text-[var(--text-primary)]">Toko: <Link to={`/central/tenants/${activeTicket.tenant.id}`} className="text-blue-500 hover:underline">{activeTicket.tenant.name}</Link></p>
                <p className="text-[var(--text-secondary)]">Pelapor: {activeTicket.user.name} ({activeTicket.user.role})</p>
                {activeTicket.userAgent && (
                  <p className="text-[10px] text-[var(--text-secondary)] mt-2 font-mono truncate bg-[var(--bg-surface-elevated)] p-1 rounded" title={activeTicket.userAgent}>
                    Env: {activeTicket.userAgent}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[var(--bg-surface-elevated)]">
              {/* Original Post */}
              <div className="flex flex-col items-start">
                <div className="bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] rounded-2xl rounded-tl-none px-4 py-3 max-w-[85%]">
                  <p className="text-[10px] font-bold text-amber-500 mb-1 uppercase tracking-wider">Keluhan Awal</p>
                  <p className="text-sm whitespace-pre-wrap font-medium">{activeTicket.description}</p>
                </div>
                <span className="text-[10px] text-[var(--text-secondary)] mt-1 ml-1">{activeTicket.user.name} • {new Date(activeTicket.createdAt).toLocaleString('id-ID')}</span>
              </div>

              {/* Replies */}
              {activeTicket.replies.map(reply => (
                <div key={reply.id} className={`flex flex-col ${reply.isCentral ? 'items-end' : 'items-start'}`}>
                  <div className={`rounded-2xl px-4 py-3 max-w-[85%] ${
                    reply.isCentral 
                      ? 'bg-[var(--accent-primary)] text-white rounded-tr-none shadow-sm' 
                      : 'bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] rounded-tl-none shadow-sm'
                  }`}>
                    {!reply.isCentral && <p className="text-[10px] font-bold text-amber-500 mb-1 uppercase tracking-wider">{reply.user?.name || 'Pelapor'}</p>}
                    <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                  </div>
                  <span className="text-[10px] text-[var(--text-secondary)] mt-1 mx-1">
                    {reply.isCentral ? 'Anda (Central)' : (reply.user?.name || 'Pelapor')} • {new Date(reply.createdAt).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>

            {/* Admin Controls */}
            <div className="p-4 border-t border-[var(--border)] flex flex-col gap-3">
              {activeTicket.status !== 'CLOSED' && activeTicket.status !== 'RESOLVED' && (
                <form onSubmit={handleReply} className="flex gap-2">
                  <input
                    type="text"
                    value={replyMsg}
                    onChange={(e) => setReplyMsg(e.target.value)}
                    placeholder="Balas keluhan ini sebagai Super Admin..."
                    className="flex-1 p-2.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl focus:border-[var(--accent-primary)]"
                  />
                  <button type="submit" disabled={sending || !replyMsg.trim()} className="px-6 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                    Kirim <Send size={16}/>
                  </button>
                </form>
              )}
              
              <div className="flex items-center gap-2 justify-end pt-2 border-t border-[var(--border)]">
                <span className="text-xs text-[var(--text-secondary)] font-bold mr-2">Ubah Status:</span>
                {activeTicket.status !== 'OPEN' && (
                  <button onClick={() => changeStatus('OPEN')} className="px-3 py-1 text-xs font-bold rounded border border-blue-500 text-blue-500 hover:bg-blue-500/10">Re-Open</button>
                )}
                {activeTicket.status !== 'RESOLVED' && (
                  <button onClick={() => changeStatus('RESOLVED')} className="px-3 py-1 text-xs font-bold rounded border border-emerald-500 text-emerald-500 hover:bg-emerald-500/10">Tandai Resolved</button>
                )}
                {activeTicket.status !== 'CLOSED' && (
                  <button onClick={() => changeStatus('CLOSED')} className="px-3 py-1 text-xs font-bold rounded border border-gray-500 text-gray-500 hover:bg-gray-500/10">Tutup Tiket</button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
