import React from 'react';
import { Store, Phone, Instagram, MapPin, Sparkles, MessageCircle, CheckCircle, Clock, Star, Shield, Heart, Truck, ThumbsUp, Coffee, Utensils } from 'lucide-react';
import { getMediaUrl } from '../../api/client';

const fmt = (val: number) => 'Rp ' + val.toLocaleString('id-ID');

const IconMap: Record<string, React.FC<any>> = {
  CheckCircle, Star, Shield, Heart, Truck, ThumbsUp, Coffee, Utensils
};

export function LookbookTemplate({ tenant, config }: { tenant: any, config: any }) {
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
  const catalogSec = getSection('catalog', 'Koleksi Kami');
  const contactSec = getSection('contact', 'Butik Kami');

  return (
    <div className="w-full bg-[var(--bg-main)]">
      {/* Minimalist Hero Section */}
      {heroSec.show && (
        <header className="pt-32 pb-20 px-6 max-w-6xl mx-auto relative overflow-hidden">
          <div className={`flex flex-col ${heroImage ? 'lg:flex-row' : ''} items-center gap-16`}>
            <div className={`flex-1 ${!heroImage ? 'text-center mx-auto max-w-3xl' : ''}`}>
              <h1 className="text-5xl md:text-8xl font-light tracking-widest mb-6 uppercase text-[var(--text-primary)]">
                {heroTitle}
              </h1>
              <div className={`w-24 h-0.5 bg-[var(--accent-primary)] mb-8 ${!heroImage ? 'mx-auto' : ''}`}></div>
              <p className="text-lg md:text-xl text-[var(--text-secondary)] font-light mb-12 leading-relaxed max-w-xl">
                {heroSubtitle}
              </p>

              {/* Contact Links */}
              <div className={`flex flex-wrap gap-4 ${!heroImage ? 'justify-center' : ''}`}>
                {waNumber && (
                  <a href={`https://wa.me/${waNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="pb-2 border-b border-[var(--text-primary)] text-[var(--text-primary)] font-bold text-sm hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] transition-all uppercase tracking-widest">
                    Chat WhatsApp
                  </a>
                )}
                {igHandle && (
                  <a href={`https://instagram.com/${igHandle.replace('@', '')}`} target="_blank" rel="noreferrer" className="pb-2 border-b border-[var(--text-primary)] text-[var(--text-primary)] font-bold text-sm hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] transition-all uppercase tracking-widest">
                    Instagram
                  </a>
                )}
              </div>
            </div>
            
            {heroImage && (
              <div className="flex-1 w-full relative">
                <div className="relative aspect-[3/4] w-full max-w-md mx-auto overflow-hidden shadow-2xl">
                  <img src={heroImage} alt="Lookbook Cover" className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105" />
                </div>
              </div>
            )}
          </div>
        </header>
      )}

      {/* Elegant Jargon */}
      {jargonSec.show && (config.jargon || config.introduction) && (
        <section className="py-32 px-6 bg-[var(--bg-surface-elevated)] border-y border-[var(--border)]">
          <div className="max-w-4xl mx-auto text-center">
            <Sparkles className="text-[var(--accent-primary)] mx-auto mb-8" size={32} />
            {config.jargon && (
              <h2 className="text-xl md:text-5xl font-light uppercase tracking-widest mb-8 leading-relaxed text-[var(--text-primary)]">
                {config.jargon}
              </h2>
            )}
            {config.introduction && (
              <p className="text-lg md:text-xl text-[var(--text-secondary)] font-light leading-loose max-w-2xl mx-auto">
                {config.introduction}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Announcement Section */}
      {announcementSec.show && (config.announcements?.length > 0 || config.announcement) && (
        <section className="py-12 px-6 max-w-5xl mx-auto border-b border-[var(--border)]">
          <div className="flex flex-col gap-5">
            {(config.announcements || (config.announcement ? [config.announcement] : [])).map((ann: any, idx: number) => (
              <div key={idx} className="bg-[var(--bg-main)] border border-[var(--border)] rounded-none overflow-hidden flex flex-col md:flex-row">
                {ann.bannerUrl && (
                  <div className="md:w-1/2 h-64 md:h-auto border-b md:border-b-0 md:border-r border-[var(--border)]">
                    <img src={getMediaUrl(ann.bannerUrl)} alt="Announcement" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
                  </div>
                )}
                <div className={`p-5 md:p-16 flex flex-col justify-center ${ann.bannerUrl ? 'md:w-1/2' : 'w-full text-center'}`}>
                  <div className="inline-flex px-3 py-1 bg-[var(--text-primary)] text-[var(--bg-main)] text-[10px] font-bold uppercase tracking-widest mb-6 w-max mx-auto md:mx-0">
                    {announcementSec.title}
                  </div>
                  <h2 className="text-xl md:text-4xl font-light uppercase tracking-widest mb-6">{ann.title}</h2>
                  <div 
                    className="text-[var(--text-secondary)] font-light leading-loose prose prose-sm prose-invert max-w-none prose-p:mb-4 prose-ul:my-4 prose-ol:my-4 uppercase tracking-wider"
                    dangerouslySetInnerHTML={{ __html: ann.description || '' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Features Minimalist */}
      {featuresSec.show && config.features && config.features.length > 0 && (
        <section className="py-24 px-6 max-w-6xl mx-auto border-b border-[var(--border)]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {config.features.map((feat: any, idx: number) => {
              const IconComponent = IconMap[feat.icon] || CheckCircle;
              return (
                <div key={idx} className="text-center group">
                  <div className="w-16 h-16 mx-auto border border-[var(--border)] rounded-full flex items-center justify-center text-[var(--accent-primary)] mb-8 group-hover:bg-[var(--accent-primary)] group-hover:text-white transition-all duration-500">
                    <IconComponent size={24} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-bold uppercase tracking-widest mb-4">{feat.title}</h3>
                  <p className="text-[var(--text-secondary)] font-light leading-relaxed">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Masonry Collection */}
      {catalogSec.show && (
        <section className="py-24 px-6 max-w-6xl mx-auto border-b border-[var(--border)]">
          <div className="text-center mb-20">
            <h2 className="text-xl md:text-4xl font-light uppercase tracking-[0.3em] mb-4 text-[var(--text-primary)]">{catalogSec.title}</h2>
            <div className="w-16 h-px bg-[var(--text-primary)] mx-auto"></div>
          </div>

          {tenant.products && tenant.products.length > 0 ? (
            <div className="columns-1 md:columns-2 lg:columns-3 gap-5 space-y-8">
              {tenant.products.map((p: any) => (
                <div key={p.id} className="break-inside-avoid relative group overflow-hidden bg-[var(--bg-surface-elevated)] rounded-none cursor-pointer">
                  <div className="aspect-[3/4] bg-[var(--bg-main)]">
                    {p.imageUrl ? (
                      <img src={getMediaUrl(p.imageUrl)} alt={p.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Store size={40} className="text-[var(--text-secondary)] opacity-30" /></div>
                    )}
                  </div>
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col items-center justify-center p-5 text-center backdrop-blur-sm">
                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-[0.3em] mb-4">{p.category || 'Koleksi'}</span>
                    <h3 className="font-light text-xl text-white mb-4 leading-tight uppercase tracking-wider">{p.name}</h3>
                    <div className="w-8 h-px bg-white/50 mb-4"></div>
                    <p className="font-mono font-light text-white tracking-widest">{fmt(p.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Sparkles size={48} className="mx-auto text-[var(--text-secondary)] opacity-30 mb-6" />
              <p className="text-[var(--text-secondary)] font-light uppercase tracking-widest">Belum ada koleksi.</p>
            </div>
          )}
        </section>
      )}

      {/* Testimonials Section */}
      {testimonialsSec.show && config.testimonials && config.testimonials.length > 0 && (
        <section className="py-24 px-6 max-w-6xl mx-auto border-t border-[var(--border)]">
          <div className="text-center mb-16">
            <h2 className="text-xl md:text-4xl font-light uppercase tracking-widest">{testimonialsSec.title}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {config.testimonials.map((t: any, idx: number) => (
              <div key={idx} className="bg-[var(--bg-main)] p-10 border border-[var(--border)] flex flex-col items-center text-center group hover:border-[var(--text-primary)] transition-colors duration-500">
                <div className="w-16 h-16 rounded-full overflow-hidden mb-8 border border-[var(--border)]">
                  {t.avatarUrl ? (
                    <img src={getMediaUrl(t.avatarUrl)} alt={t.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-light uppercase">
                      {t.name?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} className={i < (t.rating || 5) ? 'text-[var(--text-primary)] fill-[var(--text-primary)]' : 'text-[var(--border)]'} />
                  ))}
                </div>
                <p className="text-[var(--text-secondary)] font-light leading-loose text-sm max-w-xs mb-6 uppercase tracking-wider italic">
                  "{t.review}"
                </p>
                <div className="w-8 h-px bg-[var(--border)] mb-4"></div>
                <h3 className="text-xs font-bold uppercase tracking-widest">{t.name}</h3>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lookbook Maps Detail */}
      {contactSec.show && config.mapLocation && (
        <section className="py-24 px-6 max-w-5xl mx-auto border-b border-[var(--border)]">
          <div className="text-center mb-16">
            <h2 className="text-xl md:text-4xl font-light uppercase tracking-[0.3em] mb-4 text-[var(--text-primary)]">{contactSec.title}</h2>
            <div className="w-16 h-px bg-[var(--text-primary)] mx-auto"></div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-12 items-center">
            {/* Maps */}
            <div className="w-full md:w-1/2">
              {config.mapLocation.startsWith('<iframe') ? (
                <div className="w-full h-[500px] overflow-hidden grayscale hover:grayscale-0 transition-all duration-700" dangerouslySetInnerHTML={{ __html: config.mapLocation }} />
              ) : (
                <div className="w-full h-[500px] bg-[var(--bg-surface-elevated)] flex flex-col items-center justify-center border border-[var(--border)] text-center p-5 grayscale hover:grayscale-0 transition-all duration-700">
                  <MapPin size={48} className="text-[var(--text-primary)] mb-6 stroke-1" />
                  <a href={config.mapLocation} target="_blank" rel="noreferrer" className="pb-2 border-b border-[var(--text-primary)] text-[var(--text-primary)] font-bold text-sm uppercase tracking-widest hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] transition-all">
                    Buka Google Maps
                  </a>
                </div>
              )}
            </div>
            
            {/* Details */}
            <div className="w-full md:w-1/2 flex flex-col justify-center space-y-12">
              {address && (
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-4">Lokasi</h4>
                  <p className="text-xl font-light leading-relaxed">{address}</p>
                </div>
              )}
              
              {opHours && (
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-4">Buka Pada</h4>
                  <div className="flex items-center gap-4">
                    <Clock className="text-[var(--text-secondary)]" size={24} strokeWidth={1} />
                    <p className="text-xl font-light">{opHours}</p>
                  </div>
                </div>
              )}
              
              {waNumber && (
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-4">Hubungi Staf</h4>
                  <a href={`https://wa.me/${waNumber.replace(/[^0-9]/g, '')}?text=Halo%20${tenant.name},%20saya%20tertarik%20dengan%20koleksi%20Anda:`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-full border border-[var(--text-primary)] flex items-center justify-center group-hover:bg-[var(--text-primary)] group-hover:text-[var(--bg-main)] transition-all duration-300">
                      <Phone size={18} strokeWidth={1.5} />
                    </div>
                    <span className="text-lg font-light uppercase tracking-widest group-hover:text-[var(--accent-primary)] transition-colors">WhatsApp Kami</span>
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
