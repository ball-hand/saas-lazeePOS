import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Store, ChevronRight, Menu, X, ArrowLeft } from 'lucide-react';
import api from '../api/client';

export function DocsPage() {
  const [activeTopicIndex, setActiveTopicIndex] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [cmsConfig, setCmsConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await api.get('/public/platform/cms');
        if (data.data) {
          setCmsConfig(data.data);
        }
      } catch (err) {
        console.error('Failed to load CMS config', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const defaultTopics = [
    {
      id: 'getting-started',
      title: 'Mulai Cepat',
      content: `<h2>Selamat Datang di Panduan LazeePOS</h2>
        <p>LazeePOS dirancang untuk memudahkan operasional bisnis Anda, dari skala UMKM hingga Enterprise.</p>
        <p>Langkah pertama yang harus Anda lakukan:</p>
        <ol>
          <li>Daftar akun di halaman utama.</li>
          <li>Atur nama dan subdomain toko Anda.</li>
          <li>Tambahkan produk pertama Anda di menu Produk.</li>
          <li>Buka Terminal POS untuk mulai bertransaksi!</li>
        </ol>
      `
    },
    {
      id: 'pos',
      title: 'Terminal Kasir (POS)',
      content: `<h2>Menggunakan Terminal POS</h2>
        <p>Terminal POS adalah layar utama tempat kasir bekerja.</p>
        <ul>
          <li><strong>Pilih Produk:</strong> Klik produk atau gunakan scanner barcode.</li>
          <li><strong>Tahan Pesanan (Hold):</strong> Simpan pesanan sementara untuk pelanggan yang masih memilih.</li>
          <li><strong>Diskon:</strong> Terapkan kupon atau diskon manual.</li>
          <li><strong>Checkout:</strong> Selesaikan transaksi dengan metode bayar Tunai, QRIS, atau Kartu.</li>
        </ul>
      `
    },
    {
      id: 'inventory',
      title: 'Gudang & Stok',
      content: `<h2>Manajemen Inventaris</h2>
        <p>Kelola persediaan barang secara real-time. Setiap transaksi yang selesai di POS akan langsung memotong stok di Gudang.</p>
        <p>Fitur utama:</p>
        <ul>
          <li>Notifikasi Stok Menipis.</li>
          <li>Audit Stok Manual.</li>
          <li>Lacak riwayat masuk/keluar barang.</li>
        </ul>
      `
    }
  ];

  const topics = cmsConfig?.docs?.topics?.length > 0 ? cmsConfig.docs.topics : defaultTopics;
  const activeTopic = topics[activeTopicIndex] || topics[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--accent-primary)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] font-sans flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 w-full bg-[var(--bg-surface-elevated)] border-b border-[var(--border)] z-50 h-16 flex items-center px-6 shadow-sm">
        <div className="flex-1 flex items-center gap-4">
          <Link to="/" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="w-px h-6 bg-[var(--border)]" />
          <Link to="/" className="flex items-center gap-2 text-[var(--accent-primary)]">
            <Store size={24} strokeWidth={2.5} />
            <span className="text-lg font-extrabold tracking-tight text-[var(--text-primary)] hidden sm:block">LazeePOS</span>
          </Link>
          <span className="text-sm font-bold text-[var(--text-secondary)] bg-[var(--bg-main)] px-2.5 py-1 rounded-md border border-[var(--border)]">
            Docs
          </span>
        </div>

        <div className="md:hidden">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col md:flex-row relative">
        {/* Sidebar Overlay (Mobile) */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`fixed md:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-[var(--bg-surface-elevated)] border-r border-[var(--border)] z-40 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-5 h-full overflow-y-auto custom-scrollbar">
            <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4 px-3">Topik Panduan</h3>
            <div className="flex flex-col gap-1">
              {topics.map((topic: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveTopicIndex(idx);
                    setIsMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-between ${activeTopicIndex === idx ? 'bg-[var(--accent-primary-transparent)] text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-main)] hover:text-[var(--text-primary)]'}`}
                >
                  <span className="truncate">{topic.title}</span>
                  {activeTopicIndex === idx && <ChevronRight size={16} />}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 w-full max-w-4xl mx-auto p-6 md:p-12 min-h-[calc(100vh-4rem)] animate-fade-in">
          <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-3xl p-8 md:p-12 shadow-sm min-h-full">
            <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] mb-8 border-b border-[var(--border)] pb-6">
              {activeTopic.title}
            </h1>
            
            <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-[var(--text-secondary)]" 
              dangerouslySetInnerHTML={{ __html: activeTopic.content }} 
            />
          </div>
        </main>
      </div>
    </div>
  );
}
