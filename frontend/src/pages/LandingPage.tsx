import { Link } from 'react-router-dom';
import { Store, TrendingUp, ShieldCheck, Zap, ArrowRight, CheckCircle2, Star } from 'lucide-react';

export function LandingPage() {
  const pricingPlans = [
    {
      name: "UMKM Starter",
      price: "Gratis",
      period: "selamanya",
      subtitle: "Cocok untuk kedai atau toko kecil yang baru mulai melangkah.",
      features: [
        "1 Cabang Toko",
        "1 Akun Kasir",
        "Subdomain (namatoko.lazeepos.com)",
        "Katalog Produk hingga 100 Item",
        "Laporan Penjualan Harian Standar"
      ],
      buttonText: "Daftar Gratis",
      isPopular: false,
    },
    {
      name: "Agak Gede Dikit",
      price: "Rp 149.000",
      period: "/ bulan",
      subtitle: "Paling pas untuk bisnis yang mulai ramai dan butuh kontrol lebih.",
      features: [
        "Hingga 5 Cabang Toko",
        "Akun Kasir Tanpa Batas (Unlimited)",
        "Kustomisasi Tema & Logo Struk",
        "Manajemen Stok & Multi-Gudang",
        "Integrasi Pembayaran QRIS & E-Wallet"
      ],
      buttonText: "Coba Gratis 14 Hari",
      isPopular: true,
    },
    {
      name: "Guedeee (Enterprise)",
      price: "Hubungi Kami",
      period: "",
      subtitle: "Solusi premium untuk franchise, retail besar, dan multi-chain.",
      features: [
        "Cabang Toko Tanpa Batas",
        "Gunakan Domain Sendiri (kasir.tokoku.com)",
        "Server Terdedikasi (Performa Prioritas)",
        "API Terbuka untuk Integrasi Sistem Lain",
        "Manajer Akun & Dukungan Prioritas 24/7"
      ],
      buttonText: "Jadwalkan Demo",
      isPopular: false,
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] font-sans selection:bg-[var(--accent-primary)] selection:text-white">
      
      {/* =========================================
          NAVBAR KOTAK (FIXED)
      ========================================= */}
      <nav className="fixed top-0 w-full bg-[var(--bg-surface-elevated)]/80 backdrop-blur-md border-b border-[var(--border)] z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[var(--accent-primary)]">
            <Store size={28} strokeWidth={2.5} />
            <span className="text-xl font-extrabold tracking-tight text-[var(--text-primary)]">Lazee POS</span>
          </div>
          <div className="hidden md:flex items-center gap-8 font-semibold text-sm text-[var(--text-secondary)]">
            <a href="#fitur" className="hover:text-[var(--accent-primary)] transition-colors">Fitur Utama</a>
            <a href="#harga" className="hover:text-[var(--accent-primary)] transition-colors">Paket & Harga</a>
            <a href="#kisah" className="hover:text-[var(--accent-primary)] transition-colors">Kisah Sukses</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-bold text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors">
              Masuk
            </Link>
            <Link to="/register" className="px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5" style={{ background: 'var(--accent-gradient)' }}>
              Coba Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* =========================================
          HERO SECTION (HEADER UTAMA)
      ========================================= */}
      <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto text-center flex flex-col items-center animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--accent-primary-transparent)] text-[var(--accent-primary)] text-xs font-bold uppercase tracking-wider border border-[var(--accent-primary)]/20 mb-6 shadow-sm">
          <Zap size={14} /> POS Generasi Baru Berbasis Cloud
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight mb-6">
          Kelola Ribuan Cabang dalam <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'var(--accent-gradient)' }}>Satu Dasbor Pintar.</span>
        </h1>
        <p className="text-lg md:text-xl text-[var(--text-secondary)] font-medium max-w-2xl mb-10">
          Sistem kasir cerdas dengan arsitektur multitenant. Dirancang khusus untuk mempermudah operasional bisnis UMKM hingga Franchise besar Anda.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <a href="#harga" className="px-8 py-4 rounded-2xl text-base font-bold text-white flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1" style={{ background: 'var(--accent-gradient)' }}>
            Lihat Paket Harga <ArrowRight size={20} />
          </a>
          <button className="px-8 py-4 rounded-2xl text-base font-bold text-[var(--text-primary)] bg-[var(--bg-surface-elevated)] border border-[var(--border)] hover:bg-[var(--bg-main)] transition-all flex items-center justify-center shadow-sm">
            Jadwalkan Demo
          </button>
        </div>
      </section>

      {/* =========================================
          FITUR UNGGULAN
      ========================================= */}
      <section id="fitur" className="py-20 bg-[var(--bg-surface-elevated)] border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight mb-4">Infrastruktur Enterprise, Semudah Main Sosmed</h2>
            <p className="text-[var(--text-secondary)] font-medium max-w-2xl mx-auto">Tinggalkan sistem kasir lama yang kaku. Lazee POS menyesuaikan dengan warna dan identitas toko Anda.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Store size={28} />, title: 'Setiap Toko Punya Subdomain', desc: 'Dapatkan akses kasir eksklusif melalui namatoko.lazeepos.com. Data antar toko 100% terisolasi dan aman.' },
              { icon: <TrendingUp size={28} />, title: 'Laporan Finansial Real-Time', desc: 'Pantau arus kas, performa kasir, dan pergerakan stok gudang secara langsung dari HP atau Laptop.' },
              { icon: <ShieldCheck size={28} />, title: 'Tema Kasir Bisa Dikustom', desc: 'Ubah warna tombol, logo, dan identitas visual aplikasi sesuai dengan branding merek bisnis Anda sendiri.' }
            ].map((feature, idx) => (
              <div key={idx} className="p-8 rounded-3xl bg-[var(--bg-main)] border border-[var(--border)] hover:border-[var(--accent-primary)]/50 transition-all duration-300 group hover:shadow-lg">
                <div className="w-14 h-14 rounded-2xl bg-[var(--accent-primary-transparent)] text-[var(--accent-primary)] flex items-center justify-center mb-6 transition-transform group-hover:scale-110">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed font-medium text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================
          PRICING (PAKET HARGA)
      ========================================= */}
      <section id="harga" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Investasi Tepat untuk Usaha Anda</h2>
          <p className="text-[var(--text-secondary)] font-medium max-w-2xl mx-auto">Pilih paket yang sesuai dengan ukuran bisnismu sekarang. Upgrade kapan saja saat bisnismu makin besar.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-center">
          {pricingPlans.map((plan, idx) => (
            <div 
              key={idx} 
              className={`relative p-8 rounded-[2rem] border transition-all duration-300 flex flex-col h-full
                ${plan.isPopular 
                  ? 'bg-[var(--bg-surface-elevated)] border-[var(--accent-primary)] shadow-2xl shadow-[var(--accent-primary)]/10 md:-translate-y-4' 
                  : 'bg-[var(--bg-main)] border-[var(--border)] hover:border-[var(--text-secondary)]'
                }
              `}
            >
              {/* Badge Paling Laris */}
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold text-white flex items-center gap-1.5 shadow-lg" style={{ background: 'var(--accent-gradient)' }}>
                  <Star size={14} fill="currentColor" /> Paling Laris
                </div>
              )}

              <h3 className="text-xl font-extrabold text-[var(--text-primary)] mb-2">{plan.name}</h3>
              <p className="text-sm font-medium text-[var(--text-secondary)] mb-6 min-h-[40px]">{plan.subtitle}</p>
              
              <div className="mb-8 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">{plan.price}</span>
                {plan.period && <span className="text-sm font-bold text-[var(--text-secondary)]">{plan.period}</span>}
              </div>

              <ul className="flex-1 flex flex-col gap-4 mb-8">
                {plan.features.map((feat, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-3 text-sm font-medium text-[var(--text-primary)]">
                    <CheckCircle2 size={20} className="text-[var(--accent-primary)] shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <button 
                className={`w-full py-4 rounded-xl font-bold transition-all ${
                  plan.isPopular
                    ? 'text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                    : 'text-[var(--text-primary)] bg-[var(--bg-surface-elevated)] border border-[var(--border)] hover:bg-[var(--bg-main)]'
                }`}
                style={plan.isPopular ? { background: 'var(--accent-gradient)' } : {}}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================
          FOOTER
      ========================================= */}
      <footer className="py-12 bg-[var(--bg-surface-elevated)] border-t border-[var(--border)] text-center">
        <div className="flex items-center justify-center gap-2 text-[var(--accent-primary)] mb-4">
          <Store size={24} strokeWidth={2.5} />
          <span className="text-lg font-extrabold tracking-tight text-[var(--text-primary)]">Lazee POS</span>
        </div>
        <p className="text-[var(--text-secondary)] font-medium text-sm">
          © {new Date().getFullYear()} PT Lazee Teknologi Global. Hak Cipta Dilindungi.
        </p>
      </footer>

    </div>
  );
}