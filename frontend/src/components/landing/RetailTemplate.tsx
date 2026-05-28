import React from 'react';
import { Store, Package, Phone, Instagram, MapPin, Sparkles, MessageCircle, CheckCircle, Clock, Star, Shield, Heart, Truck, ThumbsUp, Coffee, Utensils } from 'lucide-react';
import { getMediaUrl } from '../../api/client';

const fmt = (val: number) => 'Rp ' + val.toLocaleString('id-ID');

const IconMap: Record<string, React.FC<any>> = {
  CheckCircle, Star, Shield, Heart, Truck, ThumbsUp, Coffee, Utensils
};

export function RetailTemplate({ tenant, config }: { tenant: any, config: any }) {
  const getSection = (key: string, defaultTitle: string) => {
    const s = config.sectionSettings?.[key];
    return {
      show: s?.show !== false,
      title: s?.title || defaultTitle
    };
  };

  const heroTitle = config.heroTitle || `Selamat Datang di ${tenant.name}`;
  const heroSubtitle = config.heroSubtitle || 'Temukan berbagai produk terbaik kami di sini.';
  const waNumber = config.whatsapp || '';
  const igHandle = config.instagram || '';
  const address = config.address || '';
  const opHours = config.operationalHours || '';
  const heroImage = config.heroImage ? getMediaUrl(config.heroImage) : (config.gallery && config.gallery.length > 0 ? getMediaUrl(config.gallery[0]) : null);

  const heroSec = getSection('hero', '');
  const jargonSec = getSection('jargon', '');
  const announcementSec = getSection('announcement', 'Pengumuman');
  const featuresSec = getSection('features', 'Keunggulan Toko');
  const testimonialsSec = getSection('testimonials', 'Ulasan Pelanggan');
  const catalogSec = getSection('catalog', 'Katalog Produk');
  const gallerySec = getSection('gallery', 'Galeri Kami');
  const contactSec = getSection('contact', 'Kunjungi Kami');

  return (
    <div className="w-full">
      {/* Hero Section Redesign */}
      {heroSec.show && (
        <header className="pt-32 pb-20 px-6 max-w-6xl mx-auto relative overflow-hidden">
          <div className="absolute top-20 right-10 w-[500px] h-[500px] bg-[var(--accent-primary)]/10 blur-[120px] rounded-full -z-10 animate-pulse-soft" />
          <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-[var(--info)]/10 blur-[100px] rounded-full -z-10 animate-pulse-soft" style={{ animationDelay: '2s' }} />
          
          <div className={`flex flex-col ${heroImage ? 'lg:flex-row' : ''} items-center gap-16`}>
            <div className={`flex-1 ${!heroImage ? 'text-center mx-auto max-w-3xl' : ''}`}>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border)] mb-6 shadow-sm ${!heroImage ? 'mx-auto' : ''}`}>
                <Sparkles size={14} className="text-[var(--accent-primary)]" />
                <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Official Store of {tenant.name}</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
                {heroTitle}
              </h1>
              <p className="text-lg md:text-xl text-[var(--text-secondary)] font-medium mb-10 leading-relaxed max-w-xl">
                {heroSubtitle}
              </p>

              {/* Contact Links */}
              <div className={`flex flex-wrap gap-4 ${!heroImage ? 'justify-center' : ''}`}>
                {waNumber && (
                  <a href={`https://wa.me/${waNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-8 py-4 rounded-full text-white font-bold text-sm shadow-xl hover:scale-105 transition-all" style={{ background: 'var(--accent-gradient)' }}>
                    <MessageCircle size={18} /> Chat WhatsApp
                  </a>
                )}
                {igHandle && (
                  <a href={`https://instagram.com/${igHandle.replace('@', '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-8 py-4 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border)] font-bold text-sm hover:border-pink-500 hover:text-pink-500 transition-all shadow-sm">
                    <Instagram size={18} /> Instagram
                  </a>
                )}
              </div>
            </div>
            
            {heroImage && (
              <div className="flex-1 w-full relative group perspective-1000">
                <div className="absolute inset-0 bg-gradient-to-tr from-[var(--accent-primary)] to-[var(--bg-surface-elevated)] rounded-[3rem] transform rotate-3 scale-105 opacity-20 group-hover:rotate-6 transition-transform duration-700" />
                <div className="relative aspect-[4/5] md:aspect-square w-full max-w-md mx-auto rounded-[3rem] overflow-hidden border-8 border-[var(--bg-surface-elevated)] shadow-2xl z-10 transform group-hover:-translate-y-2 transition-transform duration-700">
                  <img src={heroImage} alt="Hero Showcase" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
          </div>
        </header>
      )}

      {/* Features Section */}
      {featuresSec.show && config.features && config.features.length > 0 && (
        <section className="py-16 px-6 max-w-6xl mx-auto border-t border-[var(--border)]">
          <div className="text-center mb-12">
            <h2 className="text-xl font-extrabold">{featuresSec.title}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {config.features.map((feat: any, idx: number) => {
              const IconComponent = IconMap[feat.icon] || CheckCircle;
              return (
                <div key={idx} className="bg-[var(--bg-surface-elevated)] p-5 rounded-[2rem] border border-[var(--border)] shadow-sm group hover:border-[var(--accent-primary)]/50 transition-all hover:shadow-md hover:-translate-y-1">
                  <div className="w-14 h-14 bg-[var(--accent-primary-transparent)] rounded-2xl flex items-center justify-center text-[var(--accent-primary)] mb-6 group-hover:scale-110 transition-transform duration-300">
                    <IconComponent size={28} />
                  </div>
                  <h3 className="text-xl font-extrabold mb-3">{feat.title}</h3>
                  <p className="text-[var(--text-secondary)] font-medium leading-relaxed">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* About Us (Jargon & Introduction) Redesign */}
      {jargonSec.show && (config.jargon || config.introduction) && (
        <section className="py-24 px-6 border-t border-[var(--border)] relative overflow-hidden">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[var(--accent-primary)]/5 font-serif text-[200px] leading-none z-0">"</div>
            {config.jargon && (
              <h2 className="text-xl md:text-5xl font-serif font-bold mb-8 leading-tight relative z-10">
                "{config.jargon}"
              </h2>
            )}
            {config.introduction && (
              <div className="w-16 h-1 bg-[var(--accent-primary)]/50 mx-auto mb-8 rounded-full relative z-10"></div>
            )}
            {config.introduction && (
              <p className="text-lg md:text-xl text-[var(--text-secondary)] font-medium leading-relaxed max-w-3xl mx-auto relative z-10">
                {config.introduction}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Announcement Section */}
      {announcementSec.show && (config.announcements?.length > 0 || config.announcement) && (
        <section className="py-12 px-6 max-w-5xl mx-auto border-t border-[var(--border)]">
          <div className="flex flex-col gap-5">
            {(config.announcements || (config.announcement ? [config.announcement] : [])).map((ann: any, idx: number) => (
              <div key={idx} className="bg-[var(--accent-primary-transparent)] border border-[var(--accent-primary)]/20 rounded-[2rem] overflow-hidden flex flex-col md:flex-row">
                {ann.bannerUrl && (
                  <div className="md:w-1/2 h-64 md:h-auto">
                    <img src={getMediaUrl(ann.bannerUrl)} alt="Announcement" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className={`p-5 md:p-12 flex flex-col justify-center ${ann.bannerUrl ? 'md:w-1/2' : 'w-full text-center'}`}>
                  <div className="inline-flex px-3 py-1 bg-[var(--accent-primary)] text-white text-[10px] font-bold uppercase tracking-wider rounded-full mb-4 w-max mx-auto md:mx-0">
                    {announcementSec.title}
                  </div>
                  <h2 className="text-xl md:text-xl font-extrabold mb-4">{ann.title}</h2>
                  <div 
                    className="text-[var(--text-secondary)] font-medium leading-relaxed prose prose-sm prose-invert max-w-none prose-p:mb-2 prose-ul:my-2 prose-ol:my-2"
                    dangerouslySetInnerHTML={{ __html: ann.description || '' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Catalog Section */}
      {catalogSec.show && (
        <section className="py-16 px-6 max-w-5xl mx-auto border-t border-[var(--border)]">
          <div className="flex items-center gap-2 mb-10">
            <Package className="text-[var(--accent-primary)]" />
            <h2 className="text-xl font-extrabold">{catalogSec.title}</h2>
          </div>
          {tenant.products && tenant.products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tenant.products.map((p: any) => (
                <div key={p.id} className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl overflow-hidden group hover:border-[var(--accent-primary)]/50 transition-all shadow-sm hover:shadow-md">
                  <div className="aspect-square bg-[var(--bg-main)] flex items-center justify-center p-4 border-b border-[var(--border)] relative overflow-hidden">
                    {p.imageUrl ? (
                      <img src={getMediaUrl(p.imageUrl)} alt={p.name} className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <Store size={40} className="text-[var(--text-secondary)] opacity-30" />
                    )}
                  </div>
                  <div className="p-4">
                    {p.category && <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block">{p.category}</span>}
                    <h3 className="font-bold text-sm mb-2 group-hover:text-[var(--accent-primary)] transition-colors line-clamp-2">{p.name}</h3>
                    <p className="font-mono font-black text-[var(--accent-primary)]">{fmt(p.price)}</p>
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
      )}

      {/* Testimonials Section */}
      {testimonialsSec.show && config.testimonials && config.testimonials.length > 0 && (
        <section className="py-16 px-6 max-w-6xl mx-auto border-t border-[var(--border)]">
          <div className="text-center mb-12">
            <h2 className="text-xl md:text-xl font-extrabold">{testimonialsSec.title}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {config.testimonials.map((t: any, idx: number) => (
              <div key={idx} className="bg-[var(--bg-main)] p-5 md:p-5 rounded-[2rem] border border-[var(--border)] shadow-sm hover:border-[var(--accent-primary)]/50 transition-colors flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full overflow-hidden mb-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)]">
                  {t.avatarUrl ? (
                    <img src={getMediaUrl(t.avatarUrl)} alt={t.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl text-[var(--text-secondary)] font-bold">
                      {t.name?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className={i < (t.rating || 5) ? 'text-[var(--accent-primary)] fill-[var(--accent-primary)]' : 'text-[var(--border)]'} />
                  ))}
                </div>
                <h3 className="text-base font-bold mb-2">{t.name}</h3>
                <p className="text-[var(--text-secondary)] font-medium text-sm leading-relaxed max-w-xs">"{t.review}"</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Gallery Section */}
      {gallerySec.show && config.gallery && config.gallery.length > 0 && (
        <section className="py-16 px-6 max-w-5xl mx-auto border-t border-[var(--border)]">
          <div className="text-center mb-10">
            <h2 className="text-xl font-extrabold">{gallerySec.title}</h2>
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

      {/* Split Location Map Section */}
      {contactSec.show && config.mapLocation && (
        <section className="py-20 px-6 max-w-6xl mx-auto border-t border-[var(--border)]">
          <div className="flex flex-col md:flex-row bg-[var(--bg-surface-elevated)] rounded-[2rem] border border-[var(--border)] overflow-hidden shadow-sm">
            {/* Left side: Maps */}
            <div className="md:w-1/2 p-2 bg-[var(--bg-main)]">
              {config.mapLocation.startsWith('<iframe') ? (
                <div className="w-full h-[400px] rounded-[1.5rem] overflow-hidden" dangerouslySetInnerHTML={{ __html: config.mapLocation }} />
              ) : (
                <div className="w-full h-[400px] rounded-[1.5rem] bg-[var(--bg-surface-elevated)] flex flex-col items-center justify-center border border-[var(--border)] text-center p-5">
                  <MapPin size={48} className="text-[var(--accent-primary)] mb-4" />
                  <h3 className="text-xl font-bold mb-2">Lihat Lokasi di Google Maps</h3>
                  <p className="text-[var(--text-secondary)] text-sm mb-6 max-w-xs">Klik tombol di bawah untuk membuka peta di tab baru.</p>
                  <a href={config.mapLocation} target="_blank" rel="noreferrer" className="px-6 py-2.5 rounded-full bg-[var(--accent-primary)] text-white font-bold text-sm hover:opacity-90 transition-opacity">
                    Buka Google Maps
                  </a>
                </div>
              )}
            </div>
            
            {/* Right side: Details */}
            <div className="md:w-1/2 p-10 md:p-12 flex flex-col justify-center">
              <div className="inline-flex w-12 h-12 rounded-full bg-[var(--accent-primary-transparent)] text-[var(--accent-primary)] items-center justify-center mb-6">
                <MapPin size={24} />
              </div>
              <h2 className="text-xl font-extrabold mb-6">{contactSec.title}</h2>
              
              {address && (
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Alamat Lengkap</h4>
                  <p className="text-lg font-medium leading-relaxed">{address}</p>
                </div>
              )}
              
              {opHours && (
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Jam Operasional</h4>
                  <div className="flex items-center gap-3">
                    <Clock className="text-[var(--info)]" size={20} />
                    <p className="text-lg font-medium">{opHours}</p>
                  </div>
                </div>
              )}
              
              {waNumber && (
                <div className="mt-4 pt-6 border-t border-[var(--border)]">
                  <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Punya Pertanyaan?</h4>
                  <a href={`https://wa.me/${waNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl border border-[var(--border)] font-bold text-sm hover:border-green-500 hover:text-green-500 transition-all">
                    <Phone size={16} /> Hubungi via WhatsApp
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
