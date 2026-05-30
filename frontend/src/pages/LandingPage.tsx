import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Store, TrendingUp, Zap, ArrowRight, CheckCircle2, Star,
  Play, ChevronDown, DollarSign, RefreshCw, BarChart3,
  Smartphone, Printer, Layers, Sparkles, X, Package, ShoppingCart,
  Monitor, LayoutDashboard, ChefHat, Tag, Wallet, Receipt, Users, CreditCard, Ticket, Palette, Rocket
} from 'lucide-react';

const ICON_MAP: any = {
  Store, Monitor, LayoutDashboard, ChefHat, Package, Tag, Wallet, Printer, 
  Receipt, Smartphone, Users, CreditCard, Ticket, BarChart3, Palette, Rocket,
  TrendingUp, RefreshCw, DollarSign, Layers
};
import { TenantLandingPage } from './TenantLandingPage';
import api from '../api/client';

const fmt = (val: number) =>
  'Rp ' + val.toLocaleString('id-ID');

export function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [storeId, setStoreId] = useState('');
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [dynamicPlans, setDynamicPlans] = useState<any[]>([]);

  // Interactive Demo State
  const [cartCount, setCartCount] = useState(2);
  const [cartTotal, setCartTotal] = useState(52000);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // CMS Config State
  const [cmsConfig, setCmsConfig] = useState<any>({
    hero: { visible: true, headline: 'Platform Kasir Pintar untuk Semua Bisnis', subheadline: 'Tingkatkan efisiensi dan pantau bisnis Anda secara real-time dari mana saja. Bergabunglah dengan ribuan pemilik usaha yang sudah mempercayakan operasional harian mereka pada Lazee POS.' },
    announcement: { visible: false, content: '' },
    features: { visible: true },
    demo: { visible: true },
    pricing: { visible: true },
    faq: { visible: true }
  });

  useEffect(() => {
    const fetchCms = async () => {
      try {
        const { data } = await api.get('/public/platform/cms');
        if (data.data) {
          setCmsConfig((prev: any) => ({ ...prev, ...data.data }));
        }
      } catch (e) {
        console.error('Failed to fetch CMS config');
      }
    };
    fetchCms();
    const fetchPlans = async () => {
      try {
        const { data } = await api.get('/payment/plans');
        if (data.plans) setDynamicPlans(data.plans);
      } catch (e) {
        console.error('Failed to fetch plans');
      }
    };
    fetchPlans();

    const hostname = window.location.hostname;
    // Check if it's a tenant subdomain
    if (hostname !== 'localhost' && !hostname.startsWith('127.0') && !hostname.startsWith('192.168') && hostname !== 'lazeepos.local') {
      const parts = hostname.split('.');
      if (parts.length >= 3 || (parts.length === 2 && parts[1] === 'localhost')) {
        const sub = parts[0];
        if (sub !== 'www' && sub !== 'app' && sub !== 'central') {
          setSubdomain(sub);
        }
      }
    }
  }, []);

  if (subdomain) {
    return <TenantLandingPage subdomain={subdomain} />;
  }

  const handleTenantLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId.trim()) return;
    
    const input = storeId.trim().toLowerCase();
    const hostname = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : '';
    
    let targetUrl = '';
    if (hostname === 'localhost') {
      targetUrl = `${window.location.protocol}//${input}.localhost${port}/login`;
    } else if (hostname.endsWith('lazeepos.local')) {
      targetUrl = `${window.location.protocol}//${input}.lazeepos.local${port}/login`;
    } else {
      const parts = hostname.split('.');
      if (parts.length > 2) parts.shift();
      const parentDomain = parts.join('.');
      targetUrl = `${window.location.protocol}//${input}.${parentDomain}${port}/login`;
    }
    
    window.location.href = targetUrl;
  };

  let domainSuffix = '.localhost';
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost') {
       const parts = hostname.split('.');
       if (parts.length > 2) parts.shift();
       domainSuffix = '.' + parts.join('.');
    }
  }

  const pricingPlans = [
    {
      name: "UMKM Starter",
      monthlyPrice: 0,
      yearlyPrice: 0,
      period: "selamanya",
      subtitle: "Cocok untuk kedai atau toko kecil yang baru mulai melangkah.",
      features: [
        "1 Cabang Toko Utama",
        "1 Akun Kasir Aktif",
        "Subdomain (namatoko.lazeepos.com)",
        "Katalog Produk hingga 100 Item",
        "Laporan Penjualan Harian Standar",
        "Default Struk & Printer Thermal"
      ],
      buttonText: "Daftar Gratis",
      isPopular: false,
    },
    {
      name: "Agak Gede Dikit (Pro)",
      monthlyPrice: 149000,
      yearlyPrice: 1519800, // 15% discount from 149k * 12
      period: "bulan",
      subtitle: "Paling pas untuk bisnis yang mulai ramai dan butuh kontrol penuh.",
      features: [
        "Hingga 5 Cabang Toko",
        "Akun Staf & Kasir Tanpa Batas",
        "Kustomisasi Tema & Logo Struk",
        "Mesin Diskon Cerdas Kondisional",
        "Manajemen Stok & Gudang Terintegrasi",
        "Playground Hardware Printer & Scanner",
        "Integrasi QRIS & E-Wallet"
      ],
      buttonText: "Coba Gratis 14 Hari",
      isPopular: true,
    },
    {
      name: "Guedeee (Enterprise)",
      monthlyPrice: 490000,
      yearlyPrice: 4998000, // 15% discount
      period: "bulan",
      subtitle: "Solusi premium untuk franchise, retail besar, dan multi-chain.",
      features: [
        "Cabang Toko Tanpa Batas",
        "Gunakan Domain Sendiri (kasir.tokoku.com)",
        "Server Terdedikasi (Performa Prioritas)",
        "Ledger Arus Kas & Analisis Mendalam",
        "API Terbuka untuk Integrasi Pihak Ketiga",
        "Manajer Akun & Dukungan Prioritas 24/7"
      ],
      buttonText: "Hubungi Kami",
      isPopular: false,
    }
  ];

  const faqItems = [
    {
      q: "Bagaimana cara kerja sub-domain di Lazee POS?",
      a: "Setiap tenant yang mendaftar akan mendapatkan subdomain unik (misalnya `kopi-senja.lazeepos.com`). URL ini terisolasi sepenuhnya baik secara data maupun sesi otentikasi untuk menjaga kerahasiaan transaksi Anda."
    },
    {
      q: "Printer thermal dan scanner apa saja yang didukung?",
      a: "Lazee POS mendukung semua jenis printer thermal standar (58mm/80mm) yang terhubung melalui Network (IP Address) maupun browser printing default. Barcode scanner fisik (USB/Bluetooth) juga terintegrasi langsung melalui fitur kalibrasi input internal kami."
    },
    {
      q: "Apakah saya bisa mengubah warna dan desain aplikasi kasir?",
      a: "Tentu! Melalui menu Pengaturan Toko, Anda dapat merubah nama bisnis, mengganti warna aksen tema visual (Light/Dark Mode), serta menyetel tagline header dan pesan penutup pada struk belanja pelanggan."
    },
    {
      q: "Bagaimana sistem pembayaran langganan diproses?",
      a: "Kami menggunakan Midtrans Payment Gateway. Anda dapat membayar secara aman menggunakan QRIS (GoPay, OVO, DANA), Transfer Bank Virtual Account, atau Kartu Kredit. Akses premium akan langsung aktif secara real-time setelah pembayaran Anda lunas."
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] font-sans selection:bg-[var(--accent-primary)] selection:text-white relative overflow-hidden">
      
      {/* Decorative Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--accent-primary)]/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* =========================================
          NAVBAR KOTAK (FIXED)
      ========================================= */}
      <nav className="fixed top-0 w-full bg-[var(--bg-surface-elevated)]/85 backdrop-blur-lg border-b border-[var(--border)] z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[var(--accent-primary)]">
            <Store size={28} strokeWidth={2.5} />
            <span className="text-xl font-extrabold tracking-tight text-[var(--text-primary)]">Lazee POS</span>
          </div>
          <div className="hidden md:flex items-center gap-8 font-semibold text-sm text-[var(--text-secondary)]">
            <a href="#fitur" className="hover:text-[var(--text-primary)] transition-colors">Fitur</a>
            <a href="#demo" className="hover:text-[var(--text-primary)] transition-colors">Preview POS</a>
            <a href="#alur" className="hover:text-[var(--text-primary)] transition-colors">Cara Kerja</a>
            <a href="#harga" className="hover:text-[var(--text-primary)] transition-colors">Harga</a>
            <a href="#faq" className="hover:text-[var(--text-primary)] transition-colors">FAQ</a>
            <Link to="/docs" className="hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"><Sparkles size={14}/> Docs</Link>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowLoginModal(true)} 
              className="text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Masuk
            </button>
            <Link to="/register" className="px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5" style={{ background: 'var(--accent-gradient)' }}>
              Daftar Sekarang
            </Link>
          </div>
        </div>
      </nav>

      {/* =========================================
          ANNOUNCEMENT / RICH TEXT (CMS)
      ========================================= */}
      {cmsConfig?.announcement?.visible && cmsConfig?.announcement?.content && (
        <div className="w-full bg-[var(--bg-surface-elevated)] border-b border-[var(--border)] pt-24 pb-8">
          <div className="max-w-7xl mx-auto px-6">
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: cmsConfig.announcement.content }} />
          </div>
        </div>
      )}

      {/* =========================================
          HERO SECTION (HEADER UTAMA)
      ========================================= */}
      {cmsConfig?.hero?.visible !== false && (
      <section className="pt-32 pb-16 px-6 max-w-7xl mx-auto animate-fade-in relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headline and CTA */}
          <div className="lg:col-span-7 text-left flex flex-col items-start">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent-primary-transparent)] text-[var(--accent-primary)] text-xs font-bold uppercase tracking-wider border border-[var(--accent-primary)]/20 mb-6 shadow-sm">
              <Sparkles size={14} className="animate-pulse" /> Ekosistem POS Terlengkap
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6" dangerouslySetInnerHTML={{ __html: cmsConfig?.hero?.headline || 'Ekspansi Bisnis Anda dalam <span class="text-transparent bg-clip-text" style="background-image: var(--accent-gradient)">Satu Dasbor Cerdas.</span>' }} />
            <p className="text-base md:text-lg text-[var(--text-secondary)] font-medium max-w-xl mb-8 leading-relaxed">
              {cmsConfig?.hero?.subheadline || 'Sistem kasir cerdas multi-tenant dengan fitur pengelolaan kasir, inventaris gudang, diskon kondisional, hingga pembuatan Landing Page toko otomatis dalam satu platform.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-10">
              <Link to="/register" className="px-8 py-4 rounded-2xl text-base font-bold text-white flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1" style={{ background: 'var(--accent-gradient)' }}>
                Mulai Sekarang <ArrowRight size={20} />
              </Link>
              <a href="#demo" className="px-8 py-4 rounded-2xl text-base font-bold text-[var(--text-primary)] bg-[var(--bg-surface-elevated)] border border-[var(--border)] hover:bg-[var(--bg-main)] transition-all flex items-center justify-center shadow-sm gap-2">
                <Play size={16} fill="currentColor" /> Lihat Preview POS
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full bg-[var(--bg-surface-elevated)] border border-[var(--border)] p-5 rounded-[1.8rem] shadow-sm">
              {[
                { val: "10K+", label: "Tenants" },
                { val: "Rp 50M+", label: "Transaksi" },
                { val: "99.99%", label: "Uptime" },
                { val: "<100ms", label: "Page Load" },
              ].map((s, i) => (
                <div key={i} className="text-center md:text-left border-r last:border-0 border-[var(--border)] pr-2 last:pr-0">
                  <p className="text-lg md:text-xl font-black text-[var(--text-primary)] font-mono" style={{ color: 'var(--accent-primary)' }}>{s.val}</p>
                  <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Beautiful CSS Moving Illustration */}
          <div className="lg:col-span-5 flex justify-center items-center relative min-h-[350px] lg:min-h-[450px]">
            {/* Background Glow */}
            <div className="absolute w-72 h-72 rounded-full bg-[var(--accent-primary)]/10 blur-[60px] animate-pulse-soft" />

            {/* Isometric Terminal Base */}
            <div className="w-full max-w-[380px] bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-[2.5rem] p-6 shadow-2xl relative animate-float">
              
              {/* Tablet Header Bar */}
              <div className="h-6 border-b border-[var(--border)] mb-4 flex items-center justify-between text-[10px] text-[var(--text-secondary)] font-bold px-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>LAZEEPOS-01</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>WIFI</span>
                  <span className="w-2.5 h-1.5 bg-[var(--text-secondary)] rounded-[2px]" />
                </div>
              </div>

              {/* Graphic/Sales Chart Mock */}
              <div className="bg-[var(--bg-main)] rounded-2xl p-4 border border-[var(--border)] mb-4 relative overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Omzet Harian</span>
                  <span className="text-xs font-mono font-black text-emerald-500">+18.5%</span>
                </div>
                <div className="h-24 flex items-end gap-3 px-2 pt-2 border-b border-[var(--border)]/50">
                  {[40, 75, 55, 90, 65, 85].map((val, idx) => (
                    <div key={idx} className="flex-1 bg-[var(--accent-primary-transparent)] rounded-t-lg relative group h-full flex items-end">
                      <div 
                        className="w-full rounded-t-lg transition-all duration-500 origin-bottom" 
                        style={{ 
                          height: `${val}%`,
                          background: 'var(--accent-gradient)',
                          animation: 'grow-bar 3.5s ease-in-out infinite',
                          animationDelay: `${idx * 0.2}s`
                        }} 
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating Sales Alert Card */}
              <div className="absolute -top-6 -right-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 animate-float-reverse backdrop-blur-md">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  <DollarSign size={14} />
                </div>
                <div className="text-left">
                  <p className="text-[9px] font-bold opacity-80 uppercase leading-none">Checkout Sukses</p>
                  <p className="text-xs font-mono font-black mt-0.5">Rp 120.000</p>
                </div>
              </div>

              {/* Printed Receipt animation */}
              <div className="absolute -bottom-8 left-12 w-44 bg-white text-black p-3.5 rounded-xl shadow-2xl border border-gray-100 flex flex-col justify-between overflow-hidden animate-print">
                <div className="border-b border-dashed border-gray-300 pb-2 mb-2 text-center">
                  <p className="text-[8px] font-black tracking-widest font-mono">LAZEE CAFE</p>
                  <p className="text-[6px] font-mono opacity-60">demo.lazeepos.com</p>
                </div>
                <div className="space-y-1 text-[6px] font-mono">
                  <div className="flex justify-between">
                    <span>1x Kopi Susu Aren</span>
                    <span>Rp 20.000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>1x Croissant</span>
                    <span>Rp 24.000</span>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-gray-200 pt-1 font-black">
                    <span>Total</span>
                    <span>Rp 44.000</span>
                  </div>
                </div>
                <div className="text-center text-[5px] font-mono opacity-50 mt-2 border-t border-dashed border-gray-200 pt-1.5">
                  Terima Kasih atas Kunjungan Anda
                </div>
              </div>

              {/* Barcode Laser pulse */}
              <div className="absolute -left-6 bottom-16 bg-[var(--bg-surface-elevated)] border border-[var(--border)] p-3 rounded-2xl shadow-xl flex items-center justify-center animate-float-reverse backdrop-blur-md">
                <div className="relative w-10 h-10 border border-red-500/20 bg-red-500/5 rounded-lg flex items-center justify-center overflow-hidden">
                  <div className="absolute w-full h-[1px] bg-red-500 shadow-[0_0_8px_red] animate-scan" />
                  <Zap size={18} className="text-red-500 animate-pulse-soft" />
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>
      )}

      {/* =========================================
          MOCK DEMO PREVIEW COMPONENT
      ========================================= */}
      {cmsConfig?.demo?.visible !== false && (
      <section id="demo" className="py-16 max-w-6xl mx-auto px-6 relative">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent-primary)]">Live Terminal Preview</span>
          <h2 className="text-3xl font-extrabold mt-1">Rasakan Kemudahan Transaksi Digital</h2>
        </div>

        <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-[2.5rem] p-6 md:p-8 shadow-2xl relative">
          <div className="absolute top-4 left-6 flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-red-500/70" />
            <span className="w-3.5 h-3.5 rounded-full bg-yellow-500/70" />
            <span className="w-3.5 h-3.5 rounded-full bg-green-500/70" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6 mt-2">
            {/* Catalog mock */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center bg-[var(--bg-main)] p-4 rounded-2xl border border-[var(--border)]">
                <span className="font-bold text-sm">☕ Menu Kopi Pilihan</span>
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Klik Menu untuk Membeli</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: "Espresso Premium", price: 18000, cat: "Minuman" },
                  { name: "Caramel Macchiato", price: 28000, cat: "Minuman" },
                  { name: "Croissant Almond", price: 24000, cat: "Makanan" },
                  { name: "Kopi Susu Gula Aren", price: 20000, cat: "Minuman" }
                ].map((item, idx) => (
                  <div key={idx} 
                    onClick={() => {
                      setCartCount(prev => prev + 1);
                      setCartTotal(prev => prev + item.price);
                      setCheckoutSuccess(false);
                    }}
                    className="bg-[var(--bg-main)] border border-[var(--border)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary-transparent)] p-4 rounded-2xl transition-all cursor-pointer group flex flex-col justify-between h-28"
                  >
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] bg-[var(--border)] px-2 py-0.5 rounded-full">{item.cat}</span>
                      <p className="font-bold text-sm text-[var(--text-primary)] mt-2 group-hover:text-[var(--accent-primary)] transition-colors">{item.name}</p>
                    </div>
                    <p className="font-mono font-black text-xs text-[var(--text-secondary)] mt-1">{fmt(item.price)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Cart mock */}
            <div className="bg-[var(--bg-main)] border border-[var(--border)] rounded-2xl p-5 flex flex-col justify-between h-[19.5rem] shadow-sm relative overflow-hidden">
              {checkoutSuccess && (
                <div className="absolute inset-0 bg-[var(--success)]/10 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4">
                  <div className="w-12 h-12 bg-[var(--success)] rounded-full text-white flex items-center justify-center mb-3">
                    <CheckCircle2 size={24} />
                  </div>
                  <span className="font-bold text-[var(--success)]">Pembayaran Berhasil!</span>
                </div>
              )}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-[var(--border)] pb-2.5">
                  <span className="font-black text-sm flex items-center gap-2"><ShoppingCart size={16} /> Keranjang ({cartCount})</span>
                  <button 
                    onClick={() => { setCartCount(0); setCartTotal(0); setCheckoutSuccess(false); }}
                    className="px-2 py-0.5 text-[10px] font-bold text-[var(--danger)] bg-[var(--danger)]/10 rounded cursor-pointer hover:bg-[var(--danger)] hover:text-white transition-colors"
                  >
                    Kosongkan
                  </button>
                </div>
                <div className="space-y-2 text-xs font-semibold h-24 overflow-y-auto custom-scrollbar">
                  {cartCount === 0 ? (
                    <div className="text-[var(--text-secondary)] text-center mt-6">Keranjang Kosong</div>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span>Pilihan Anda ({cartCount}x)</span>
                        <span>{fmt(cartTotal)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-[var(--border)]">
                <div className="flex justify-between text-xs text-[var(--text-secondary)] font-semibold">
                  <span>Subtotal</span>
                  <span>{fmt(cartTotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-black text-[var(--text-primary)] pt-1">
                  <span>Total Bayar</span>
                  <span className="text-base font-mono font-black" style={{ color: 'var(--accent-primary)' }}>{fmt(cartTotal)}</span>
                </div>
                <button 
                  onClick={() => {
                    if (cartCount > 0) {
                      setCheckoutSuccess(true);
                      setTimeout(() => {
                        setCartCount(0);
                        setCartTotal(0);
                        setCheckoutSuccess(false);
                      }, 2500);
                    }
                  }}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs text-white transition-all ${cartCount > 0 ? 'hover:scale-[1.02] cursor-pointer' : 'opacity-50 cursor-not-allowed'}`} 
                  style={{ background: 'var(--accent-gradient)' }}
                >
                  Selesaikan Transaksi
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* =========================================
          FITUR LENGKAP UTAMA
      ========================================= */}
      {cmsConfig?.features?.visible !== false && (
      <section id="fitur" className="py-24 bg-[var(--bg-main)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-[var(--accent-primary)]/10 blur-[80px] -z-10 rounded-full" />
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent-primary)] bg-[var(--accent-primary-transparent)] px-4 py-1.5 rounded-full border border-[var(--accent-primary)]/20 shadow-sm">Fitur Unggulan</span>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mt-6 mb-4 leading-tight">Satu Platform Cerdas untuk <br />Seluruh Kebutuhan Toko</h2>
            <p className="text-[var(--text-secondary)] font-medium max-w-2xl mx-auto text-base md:text-lg">
              Nikmati fitur manajemen retail enterprise yang dirancang khusus untuk kemudahan dan fleksibilitas operasional bisnis kasir harian Anda.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(cmsConfig?.features?.items || [
              { icon: 'Store', title: 'Multi-Tenant SaaS', desc: 'Isolasi subdomain, branding per toko, landing page publik otomatis' },
              { icon: 'Monitor', title: 'Terminal POS', desc: 'Checkout cepat, scan barcode, split payment, hold order' },
              { icon: 'LayoutDashboard', title: 'Manajemen Meja', desc: 'Layout meja drag-and-drop, status real-time, QR Code pelanggan' },
              { icon: 'ChefHat', title: 'Antrean Dapur', desc: 'Kitchen Display System, status pesanan, notifikasi real-time' },
              { icon: 'Package', title: 'Produk & Gudang', desc: 'Katalog SKU, stok otomatis terpotong, audit inventaris' },
              { icon: 'Tag', title: 'Diskon Cerdas', desc: 'BOGO, diskon persen, minimal belanja, kupon kondisional' },
              { icon: 'Wallet', title: 'Buku Kas Ledger', desc: 'Arus kas masuk/keluar, setoran kasir, rekonsiliasi harian' },
              { icon: 'Printer', title: 'Printer & Hardware', desc: 'Thermal printer (58mm/80mm), scanner barcode, kalibrasi periferal' },
              { icon: 'Receipt', title: 'Struk Kustom', desc: 'Desain struk, logo, pesan penutup, QR Code di struk' },
              { icon: 'Smartphone', title: 'Menu Pelanggan', desc: 'Scan QR → lihat menu digital, pesan langsung dari meja' },
              { icon: 'Users', title: 'Manajemen Staf', desc: 'Role-based access (Owner, Admin, Kasir), audit log aksi' },
              { icon: 'CreditCard', title: 'Billing & Langganan', desc: 'Midtrans payment gateway, QRIS, VA Bank, upgrade paket' },
              { icon: 'Ticket', title: 'Support Ticketing', desc: 'Sistem tiket komplain, chat real-time dengan Central Admin' },
              { icon: 'BarChart3', title: 'Dashboard Analytics', desc: 'Grafik penjualan, statistik harian, revenue tracking' },
              { icon: 'Palette', title: 'Kustomisasi Tema', desc: 'Light/Dark mode, warna aksen, logo branding' },
              { icon: 'Rocket', title: 'Release Management', desc: 'Push update ke semua tenant, mandatory update' }
            ]).map((f: any, i: number) => {
              const IconComponent = ICON_MAP[f.icon] || Store;
              return (
              <div key={i} className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-3xl p-6 hover:border-[var(--accent-primary)]/50 transition-all duration-300 group hover:-translate-y-1 shadow-md hover:shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-primary)]/5 blur-[50px] rounded-full group-hover:bg-[var(--accent-primary)]/10 transition-colors" />
                <div className="w-12 h-12 rounded-2xl bg-[var(--accent-primary-transparent)] text-[var(--accent-primary)] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-inner border border-[var(--accent-primary)]/20">
                  <IconComponent size={24} />
                </div>
                <h3 className="text-lg font-bold mb-2 text-[var(--text-primary)]">{f.title}</h3>
                <p className="text-[var(--text-secondary)] text-xs font-semibold leading-relaxed">{f.desc}</p>
              </div>
            )})}
          </div>
        </div>
      </section>
      )}

      {/* =========================================
          ALUR LANGKAH OPERASIONAL (CARA KERJA)
      ========================================= */}
      <section id="alur" className="py-24 max-w-7xl mx-auto px-6 border-t border-[var(--border)]">
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent-primary)] bg-[var(--accent-primary-transparent)] px-4 py-1.5 rounded-full border border-[var(--accent-primary)]/20 shadow-sm">Panduan Operasional</span>
          <h2 className="text-3xl font-extrabold mt-6">Mulai Transaksi Pertama Anda dalam 3 Menit</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {(cmsConfig?.howItWorks?.steps || [
            { step: "01", title: "Registrasi Tenant", desc: "Daftarkan brand Anda dan pilih subdomain unik toko Anda secara gratis." },
            { step: "02", title: "Branding Toko", desc: "Atur warna tema, Landing Page publik, dan pajak PPN bawaan." },
            { step: "03", title: "Input Katalog", desc: "Tambahkan produk, SKU barang, harga pokok modal, dan jumlah stok awal." },
            { step: "04", title: "Siap Checkout", desc: "Buka Terminal POS, scan produk, dan cetak struk pertama pelanggan Anda!" }
          ]).map((s: any, i: number) => (
            <div key={i} className="bg-[var(--bg-main)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border)] hover:border-[var(--accent-primary)]/50 p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl relative flex flex-col justify-between min-h-[14rem] transition-all group overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-[var(--accent-primary)]/5 rounded-full group-hover:scale-150 transition-transform" />
              <span className="text-5xl font-mono font-black opacity-[0.08] absolute top-6 right-6 text-[var(--accent-primary)] group-hover:opacity-20 transition-opacity">{s.step}</span>
              <div className="mt-auto relative z-10">
                <h3 className="font-extrabold text-lg mb-3 text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">{s.title}</h3>
                <p className="text-[var(--text-secondary)] text-sm font-semibold leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================
          PRICING (PAKET HARGA DENGAN TOGGLE CYCLE)
      ========================================= */}
      {cmsConfig?.pricing?.visible !== false && (
      <section id="harga" className="py-24 bg-[var(--bg-surface-elevated)] border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent-primary)]">Paket Berlangganan</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-2 mb-4">Investasi Transparan, Tanpa Biaya Tersembunyi</h2>
            
            {/* Billing Cycle Switch */}
            <div className="inline-flex items-center gap-2 bg-[var(--bg-main)] border border-[var(--border)] p-1 rounded-xl mt-4">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  billingCycle === 'monthly' ? 'text-white shadow' : 'text-[var(--text-secondary)]'
                }`}
                style={billingCycle === 'monthly' ? { background: 'var(--accent-gradient)' } : {}}
              >
                Bulanan
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  billingCycle === 'yearly' ? 'text-white shadow' : 'text-[var(--text-secondary)]'
                }`}
                style={billingCycle === 'yearly' ? { background: 'var(--accent-gradient)' } : {}}
              >
                Tahunan
                <span className="bg-[var(--success)]/20 text-[var(--success)] text-[9px] font-black px-1.5 py-0.5 rounded-full border border-[var(--success)]/30">
                  Hemat 15%
                </span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-center max-w-6xl mx-auto">
            {(dynamicPlans.length > 0 ? dynamicPlans : pricingPlans).map((plan, idx) => {
              const displayPrice = billingCycle === 'yearly' ? (plan.yearlyPrice || plan.monthlyPrice * 12 * 0.85) : plan.monthlyPrice;
              const isFree = plan.monthlyPrice === 0;
              
              let planFeatures = [
                `Maks. ${plan.maxUsers || 3} Pengguna`,
                `Maks. ${plan.maxProducts || 100} Produk`,
                `Maks. ${plan.maxBranches || 1} Cabang`
              ];
              if (Array.isArray(plan.features)) {
                planFeatures = plan.features;
              } else if (typeof plan.features === 'string' && plan.features.trim() !== '') {
                try {
                  const parsed = JSON.parse(plan.features);
                  if (Array.isArray(parsed)) planFeatures = parsed;
                } catch (e) {
                  // Ignore JSON parse error, use fallback
                }
              }

              return (
                <div 
                  key={idx} 
                  className={`relative p-8 rounded-[2.2rem] border transition-all duration-300 flex flex-col h-full
                    ${idx === 1 
                      ? 'bg-[var(--bg-main)] border-[var(--accent-primary)] shadow-xl md:-translate-y-4' 
                      : 'bg-[var(--bg-main)] border-[var(--border)] hover:border-[var(--text-secondary)]'
                    }
                  `}
                >
                  {idx === 1 && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-[10px] font-black text-white flex items-center gap-1 shadow-lg tracking-wider uppercase" style={{ background: 'var(--accent-gradient)' }}>
                      <Star size={12} fill="currentColor" /> Paling Populer
                    </div>
                  )}

                  <h3 className="text-xl font-extrabold text-[var(--text-primary)] mb-2">{plan.name}</h3>
                  <p className="text-xs font-semibold text-[var(--text-secondary)] mb-6 min-h-[35px]">{plan.description || plan.subtitle}</p>
                  
                  <div className="mb-8 flex items-baseline gap-1">
                    <span className="text-3xl font-black tracking-tight text-[var(--text-primary)] font-mono">
                      {isFree ? "Gratis" : fmt(displayPrice)}
                    </span>
                    {!isFree && (
                      <span className="text-xs font-bold text-[var(--text-secondary)]">
                        {billingCycle === 'yearly' ? '/ tahun' : '/ bulan'}
                      </span>
                    )}
                  </div>

                  <ul className="flex-1 flex flex-col gap-4 mb-8">
                    {planFeatures.map((feat: string, fIdx: number) => (
                      <li key={fIdx} className="flex items-start gap-2.5 text-xs font-bold text-[var(--text-secondary)]">
                        <CheckCircle2 size={16} className="text-[var(--accent-primary)] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <Link to="/register"
                    className={`w-full py-3.5 rounded-xl font-bold transition-all text-xs flex justify-center items-center ${
                      idx === 1
                        ? 'text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                        : 'text-[var(--text-primary)] bg-[var(--bg-surface-elevated)] border border-[var(--border)] hover:bg-[var(--bg-main)]'
                    }`}
                    style={idx === 1 ? { background: 'var(--accent-gradient)' } : {}}
                  >
                    Daftar Sekarang
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      )}

      {/* =========================================
          FAQ SECTION (AKORDION INTERAKTIF)
      ========================================= */}
      {cmsConfig?.faq?.visible !== false && (
      <section id="faq" className="py-24 max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--accent-primary)]">Tanya Jawab</span>
          <h2 className="text-3xl font-extrabold mt-2">Pertanyaan yang Sering Diajukan</h2>
        </div>

        <div className="flex flex-col gap-4">
          {(cmsConfig?.faq?.items || faqItems).map((faq: any, i: number) => {
            const isOpen = activeFaq === i;
            return (
              <div
                key={i}
                className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : i)}
                  className="w-full px-6 py-5 text-left flex justify-between items-center font-bold text-sm md:text-base text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={`text-[var(--text-secondary)] transition-transform duration-300 ${isOpen ? 'rotate-180 text-[var(--accent-primary)]' : ''}`}
                  />
                </button>
                <div
                  className={`transition-all duration-300 ease-in-out px-6 overflow-hidden ${
                    isOpen ? 'pb-5 max-h-40 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="text-xs md:text-sm font-semibold leading-relaxed text-[var(--text-secondary)] border-t border-[var(--border)] pt-4">
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      )}

      {/* =========================================
          FOOTER
      ========================================= */}
      <footer className="py-16 bg-[var(--bg-surface-elevated)] border-t border-[var(--border)] text-center relative overflow-hidden">
        {/* Floating Particles in Footer */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute bottom-4 left-[15%] w-3 h-3 rounded-full bg-[var(--accent-primary)] blur-[1px] animate-particle-1" />
          <div className="absolute bottom-8 left-[45%] w-2 h-2 rounded-full bg-indigo-500 blur-[1px] animate-particle-2" />
          <div className="absolute bottom-6 left-[80%] w-4 h-4 rounded-full bg-purple-500 blur-[2px] animate-particle-3" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-center gap-2 text-[var(--accent-primary)] mb-4">
            <Store size={26} strokeWidth={2.5} />
            <span className="text-lg font-extrabold tracking-tight text-[var(--text-primary)]">Lazee POS</span>
          </div>
          <p className="text-[var(--text-secondary)] font-medium text-xs max-w-md mx-auto mb-6 leading-relaxed">
            {cmsConfig?.footer?.tagline || 'Lazee POS membantu UMKM & Perusahaan Franchise mengelola penjualan cabang, melacak arus kas, dan mempermudah checkout secara real-time.'}
          </p>
          <p className="text-[var(--text-secondary)]/50 font-bold text-[10px] uppercase tracking-wider">
            {cmsConfig?.footer?.copyright || `© ${new Date().getFullYear()} PT Lazee Teknologi Global. Hak Cipta Dilindungi.`}
          </p>
        </div>
      </footer>

      {/* =========================================
          TENANT LOGIN MODAL
      ========================================= */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLoginModal(false)} />
          <div className="relative w-full max-w-md bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-[2rem] p-8 shadow-2xl animate-fade-in">
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute top-6 right-6 text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors"
            >
              <X size={24} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-primary-transparent)] text-[var(--accent-primary)] flex items-center justify-center mb-6">
              <Store size={24} />
            </div>

            <h3 className="text-2xl font-extrabold text-[var(--text-primary)] mb-2">Masuk ke Toko</h3>
            <p className="text-[var(--text-secondary)] text-sm font-medium mb-8 leading-relaxed">
              Masukkan ID atau nama toko Anda (Subdomain) untuk diarahkan secara aman ke dasbor kasir Anda.
            </p>

            <form onSubmit={handleTenantLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Subdomain Toko</label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    value={storeId}
                    onChange={(e) => setStoreId(e.target.value)}
                    placeholder="contoh: demo"
                    className="w-full bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-primary)] px-4 py-3.5 rounded-xl font-medium focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
                  />
                  <div className="absolute right-4 text-[var(--text-secondary)] font-bold text-xs pointer-events-none opacity-50 bg-[var(--bg-surface-elevated)] px-2 py-1 rounded-md border border-[var(--border)]">
                    {domainSuffix}
                  </div>
                </div>
              </div>
              <button 
                type="submit"
                className="w-full py-4 rounded-xl text-sm font-bold text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 mt-4"
                style={{ background: 'var(--accent-gradient)' }}
              >
                Lanjutkan <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}