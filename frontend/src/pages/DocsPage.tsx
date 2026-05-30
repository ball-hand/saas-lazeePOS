import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Store, ChevronRight, Menu, X, ArrowLeft, BookOpen, Sparkles } from 'lucide-react';
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
        if (data) {
          // The axios interceptor already unwraps the { status, data } envelope.
          // So 'data' here is directly the cmsConfig object.
          setCmsConfig(data);
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
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--accent-primary)]" />
          <p className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-widest animate-pulse">Memuat Dokumen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] font-sans flex flex-col selection:bg-[var(--accent-primary-transparent)] selection:text-[var(--accent-primary)]">
      {/* Navbar with Glassmorphism */}
      <nav className="sticky top-0 w-full bg-[var(--bg-main)]/80 backdrop-blur-xl border-b border-[var(--border)] z-50 h-16 flex items-center px-6 transition-all duration-300">
        <div className="flex-1 flex items-center gap-4">
          <Link to="/" className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-all">
            <ArrowLeft size={16} />
          </Link>
          <div className="w-px h-6 bg-[var(--border)]" />
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[var(--accent-primary)] to-[var(--accent-hover)] flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
              <Store size={18} strokeWidth={2.5} />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-[var(--text-primary)] hidden sm:block group-hover:text-[var(--accent-primary)] transition-colors">
              LazeePOS
            </span>
          </Link>
          <span className="text-xs font-black text-[var(--accent-primary)] bg-[var(--accent-primary-transparent)] px-3 py-1 rounded-full uppercase tracking-widest">
            Docs
          </span>
        </div>

        <div className="md:hidden">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-[var(--text-primary)]">
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col md:flex-row relative w-full">
        {/* Sidebar Overlay (Mobile) */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`fixed md:sticky top-16 left-0 h-[calc(100vh-4rem)] w-72 bg-[var(--bg-main)] md:bg-transparent border-r border-[var(--border)] z-40 transform transition-transform duration-500 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
          <div className="p-6 h-full overflow-y-auto custom-scrollbar flex flex-col gap-8">
            <div>
              <div className="flex items-center gap-3 mb-6 px-2">
                <BookOpen size={20} className="text-[var(--text-secondary)]" />
                <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest">Daftar Isi Panduan</h3>
              </div>
              <div className="flex flex-col gap-2">
                {topics.map((topic: any, idx: number) => {
                  const isActive = activeTopicIndex === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setActiveTopicIndex(idx);
                        setIsMobileMenuOpen(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`relative w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between group overflow-hidden border ${isActive ? 'bg-[var(--accent-primary-transparent)] border-[var(--accent-primary)]/20 text-[var(--accent-primary)]' : 'border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)] hover:border-[var(--border)]'}`}
                    >
                      {/* Active Left Border */}
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--accent-primary)]" />
                      )}
                      
                      <span className="truncate z-10">{topic.title}</span>
                      <ChevronRight size={14} className={`z-10 transition-transform ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="mt-auto pt-6 border-t border-[var(--border)] px-2">
              <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-5 text-center shadow-sm">
                <Sparkles size={24} className="text-[var(--accent-primary)] mx-auto mb-3" />
                <h4 className="text-sm font-bold mb-2 text-[var(--text-primary)]">Butuh Bantuan?</h4>
                <p className="text-xs text-[var(--text-secondary)] mb-5">Tim support kami siap membantu Anda 24/7.</p>
                <a href="#" className="block w-full py-2.5 bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-bold rounded-xl hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors uppercase tracking-widest">
                  Hubungi Kami
                </a>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 w-full py-8 px-6 md:py-12 md:px-10 lg:px-16 xl:px-24 min-h-[calc(100vh-4rem)] relative bg-[var(--bg-main)]">
          
          <article className="w-full animate-fade-in relative z-10">
            <header className="mb-10 pb-6 border-b border-[var(--border)]">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-[var(--text-primary)] leading-[1.2] tracking-tight">
                {activeTopic.title}
              </h1>
            </header>
            
            <div className="prose max-w-none w-full text-sm md:text-base text-[var(--text-secondary)]" 
              dangerouslySetInnerHTML={{ __html: activeTopic.content }} 
            />
          </article>
          
          {/* Footer Navigation */}
          <div className="w-full mt-16 pt-8 border-t border-[var(--border)] flex flex-col sm:flex-row items-center gap-4 justify-between">
            <button
              onClick={() => {
                if (activeTopicIndex > 0) {
                  setActiveTopicIndex(activeTopicIndex - 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              disabled={activeTopicIndex === 0}
              className={`flex flex-col items-start p-5 rounded-2xl transition-all w-full sm:w-[48%] bg-[var(--bg-surface-elevated)] border border-[var(--border)] ${activeTopicIndex === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:border-[var(--accent-primary)] hover:-translate-y-1 shadow-sm hover:shadow-md'}`}
            >
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.15em] mb-3 flex items-center gap-1"><ArrowLeft size={12}/> Sebelumnya</span>
              <span className="text-sm md:text-base font-bold text-[var(--text-primary)] truncate w-full text-left">{activeTopicIndex > 0 ? topics[activeTopicIndex - 1].title : 'Awal'}</span>
            </button>
            
            <button
              onClick={() => {
                if (activeTopicIndex < topics.length - 1) {
                  setActiveTopicIndex(activeTopicIndex + 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              disabled={activeTopicIndex === topics.length - 1}
              className={`flex flex-col items-end p-5 rounded-2xl transition-all w-full sm:w-[48%] bg-[var(--bg-surface-elevated)] border border-[var(--border)] ${activeTopicIndex === topics.length - 1 ? 'opacity-40 cursor-not-allowed' : 'hover:border-[var(--accent-primary)] hover:-translate-y-1 shadow-sm hover:shadow-md'}`}
            >
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.15em] mb-3 flex items-center gap-1">Selanjutnya <ChevronRight size={12}/></span>
              <span className="text-sm md:text-base font-bold text-[var(--text-primary)] truncate w-full text-right">{activeTopicIndex < topics.length - 1 ? topics[activeTopicIndex + 1].title : 'Akhir'}</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
