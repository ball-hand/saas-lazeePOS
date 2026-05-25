import { useState, useEffect } from 'react';
import { Store, Package, Phone, Instagram, MapPin, Loader2 } from 'lucide-react';
import api, { getMediaUrl } from '../api/client';

const fmt = (val: number) => 'Rp ' + val.toLocaleString('id-ID');

export function TenantLandingPage({ subdomain }: { subdomain: string }) {
  const [tenant, setTenant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const { data } = await api.get(`/public/tenant/${subdomain}`);
        if (data && data.id) {
          setTenant(data);
          // Apply tenant's primary color to CSS variables for this page
          if (data.primaryColor) {
            document.documentElement.style.setProperty('--accent-primary', data.primaryColor);
            
            // Generate a transparent version for backgrounds
            const hex = data.primaryColor;
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            document.documentElement.style.setProperty('--accent-primary-transparent', `rgba(${r}, ${g}, ${b}, 0.1)`);
          }
        } else {
          setError('Toko tidak ditemukan.');
        }
      } catch (err) {
        setError('Toko tidak ditemukan atau sedang tidak aktif.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTenant();
  }, [subdomain]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
        <Loader2 size={40} className="animate-spin text-[var(--text-secondary)]" />
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-main)] text-[var(--text-primary)]">
        <Store size={64} className="text-[var(--text-secondary)] opacity-50 mb-4" />
        <h1 className="text-3xl font-extrabold mb-2">Oops!</h1>
        <p className="text-[var(--text-secondary)] font-medium">{error}</p>
        <a href="/" className="mt-8 px-6 py-2.5 rounded-xl font-bold border border-[var(--border)] hover:bg-[var(--bg-surface-elevated)] transition-colors">
          Kembali ke LazeePOS
        </a>
      </div>
    );
  }

  const config = tenant.landingPageConfig || {};
  const heroTitle = config.heroTitle || `Selamat Datang di ${tenant.name}`;
  const heroSubtitle = config.heroSubtitle || 'Temukan berbagai produk terbaik kami di sini.';
  const waNumber = config.whatsapp || '';
  const igHandle = config.instagram || '';
  const address = config.address || '';

  return (
    <div className={`min-h-screen ${tenant.themeMode === 'light' ? 'light-mode' : 'dark-mode'} bg-[var(--bg-main)] text-[var(--text-primary)] font-sans`}>
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-[var(--bg-main)]/80 backdrop-blur-md border-b border-[var(--border)] z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tenant.logoUrl ? (
              <img 
                src={getMediaUrl(tenant.logoUrl)} 
                alt={tenant.name} 
                className={`h-9 w-9 object-cover ${tenant.logoShape === 'circle' ? 'rounded-full' : 'rounded-lg'}`}
              />
            ) : (
              <div className={`h-9 w-9 bg-[var(--accent-primary)] flex items-center justify-center text-white ${tenant.logoShape === 'circle' ? 'rounded-full' : 'rounded-lg'}`}>
                <span className="font-bold text-lg">{tenant.name.charAt(0)}</span>
              </div>
            )}
            <span className="text-lg font-extrabold tracking-tight">{tenant.name}</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Login button removed */}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="pt-32 pb-20 px-6 max-w-5xl mx-auto text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[var(--accent-primary)]/10 blur-[100px] -z-10 rounded-full" />
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-3xl mx-auto leading-tight">
          {heroTitle}
        </h1>
        <p className="text-lg text-[var(--text-secondary)] font-medium max-w-xl mx-auto mb-10">
          {heroSubtitle}
        </p>

        {/* Contact Links */}
        <div className="flex flex-wrap justify-center gap-4">
          {waNumber && (
            <a 
              href={`https://wa.me/${waNumber.replace(/[^0-9]/g, '')}`}
              target="_blank" rel="noreferrer"
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border)] font-bold text-sm hover:border-green-500 hover:text-green-500 transition-all shadow-sm"
            >
              <Phone size={16} /> Hubungi WhatsApp
            </a>
          )}
          {igHandle && (
            <a 
              href={`https://instagram.com/${igHandle.replace('@', '')}`}
              target="_blank" rel="noreferrer"
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border)] font-bold text-sm hover:border-pink-500 hover:text-pink-500 transition-all shadow-sm"
            >
              <Instagram size={16} /> Instagram Kami
            </a>
          )}
        </div>
        {/* Jargon / Introduction */}
        {(config.jargon || config.introduction) && (
          <div className="mt-16 max-w-2xl mx-auto bg-[var(--bg-surface-elevated)] border border-[var(--border)] p-8 rounded-3xl shadow-sm">
            {config.jargon && <h3 className="text-xl font-bold mb-4 text-[var(--accent-primary)]">"{config.jargon}"</h3>}
            {config.introduction && <p className="text-[var(--text-secondary)] font-medium leading-relaxed">{config.introduction}</p>}
          </div>
        )}
      </header>

      {/* Announcement Section */}
      {config.announcement?.title && (
        <section className="py-12 px-6 max-w-5xl mx-auto border-t border-[var(--border)]">
          <div className="bg-[var(--accent-primary-transparent)] border border-[var(--accent-primary)]/20 rounded-[2rem] overflow-hidden flex flex-col md:flex-row">
            {config.announcement.bannerUrl && (
              <div className="md:w-1/2 h-64 md:h-auto">
                <img src={getMediaUrl(config.announcement.bannerUrl)} alt="Announcement" className="w-full h-full object-cover" />
              </div>
            )}
            <div className={`p-8 md:p-12 flex flex-col justify-center ${config.announcement.bannerUrl ? 'md:w-1/2' : 'w-full text-center'}`}>
              <div className="inline-flex px-3 py-1 bg-[var(--accent-primary)] text-white text-[10px] font-bold uppercase tracking-wider rounded-full mb-4 w-max">
                Pengumuman
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold mb-4">{config.announcement.title}</h2>
              <p className="text-[var(--text-secondary)] font-medium leading-relaxed">
                {config.announcement.description}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Catalog Section */}
      <section className="py-16 px-6 max-w-5xl mx-auto border-t border-[var(--border)]">
        <div className="flex items-center gap-2 mb-10">
          <Package className="text-[var(--accent-primary)]" />
          <h2 className="text-2xl font-extrabold">Katalog Produk</h2>
        </div>

        {tenant.products && tenant.products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {tenant.products.map((p: any) => (
              <div key={p.id} className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl overflow-hidden group hover:border-[var(--accent-primary)]/50 transition-all shadow-sm hover:shadow-md">
                <div className="aspect-square bg-[var(--bg-main)] flex items-center justify-center p-4 border-b border-[var(--border)]">
                  {p.imageUrl ? (
                    <img src={getMediaUrl(p.imageUrl)} alt={p.name} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <Store size={40} className="text-[var(--text-secondary)] opacity-30" />
                  )}
                </div>
                <div className="p-4">
                  {p.category && (
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block">
                      {p.category}
                    </span>
                  )}
                  <h3 className="font-bold text-sm mb-2 group-hover:text-[var(--accent-primary)] transition-colors line-clamp-2">
                    {p.name}
                  </h3>
                  <p className="font-mono font-black text-[var(--accent-primary)]">
                    {fmt(p.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-[var(--bg-surface-elevated)] rounded-3xl border border-[var(--border)] border-dashed">
            <Package size={48} className="mx-auto text-[var(--text-secondary)] opacity-50 mb-4" />
            <p className="text-[var(--text-secondary)] font-medium">Toko ini belum menambahkan produk ke katalog publik.</p>
          </div>
        )}
      </section>

      {/* Gallery Section */}
      {config.gallery && config.gallery.length > 0 && (
        <section className="py-16 px-6 max-w-5xl mx-auto border-t border-[var(--border)]">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold">Galeri Kami</h2>
            <p className="text-[var(--text-secondary)] font-medium mt-2">Intip suasana dan momen di toko kami.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {config.gallery.map((img: string, idx: number) => (
              <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-[var(--border)] group cursor-pointer">
                <img src={getMediaUrl(img)} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Location Map Section */}
      {config.mapLocation && (
        <section className="py-16 px-6 max-w-5xl mx-auto border-t border-[var(--border)] text-center">
          <div className="inline-flex w-12 h-12 rounded-full bg-[var(--accent-primary-transparent)] text-[var(--accent-primary)] items-center justify-center mb-6">
            <MapPin size={24} />
          </div>
          <h2 className="text-2xl font-extrabold mb-4">Lokasi Kami</h2>
          <p className="text-[var(--text-secondary)] font-medium max-w-2xl mx-auto mb-8">
            {address || 'Kunjungi toko kami secara langsung di alamat berikut.'}
          </p>
          {config.mapLocation.startsWith('http') || config.mapLocation.startsWith('<iframe') ? (
            <div className="rounded-3xl overflow-hidden border border-[var(--border)] shadow-sm max-w-3xl mx-auto bg-[var(--bg-surface-elevated)] p-2">
              {config.mapLocation.startsWith('<iframe') ? (
                <div className="w-full h-[400px] rounded-2xl overflow-hidden" dangerouslySetInnerHTML={{ __html: config.mapLocation }} />
              ) : (
                <iframe src={config.mapLocation} className="w-full h-[400px] rounded-2xl" loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
              )}
            </div>
          ) : (
            <div className="max-w-2xl mx-auto bg-[var(--bg-surface-elevated)] p-6 rounded-2xl border border-[var(--border)]">
              <p className="font-bold text-lg">{config.mapLocation}</p>
            </div>
          )}
        </section>
      )}

      {/* Footer */}
      <footer className="py-10 border-t border-[var(--border)] mt-20">
        <div className="max-w-5xl mx-auto px-6 text-center md:flex justify-between items-center text-xs font-bold text-[var(--text-secondary)]">
          <p>&copy; {new Date().getFullYear()} {tenant.name}. All rights reserved.</p>
          <a href="https://lazeepos.com" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1 mt-4 md:mt-0 hover:text-[var(--text-primary)] transition-colors">
            Powered by <Store size={14} className="mx-0.5" /> LazeePOS
          </a>
        </div>
      </footer>

    </div>
  );
}
