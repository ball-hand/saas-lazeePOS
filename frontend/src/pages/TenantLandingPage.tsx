import { useState, useEffect } from 'react';
import { Loader2, Store } from 'lucide-react';
import api, { getMediaUrl } from '../api/client';
import { RestoTemplate } from '../components/landing/RestoTemplate';
import { RetailTemplate } from '../components/landing/RetailTemplate';
import { LookbookTemplate } from '../components/landing/LookbookTemplate';
import { Footer } from '../components/landing/shared/Footer';

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
          
          // Apply theme mode
          if (data.themeMode) {
            document.documentElement.setAttribute('data-theme', data.themeMode);
          }

          // Apply tenant's primary color to CSS variables for this page
          if (data.primaryColor) {
            document.documentElement.style.setProperty('--accent-primary', data.primaryColor);
            
            // Generate a transparent version for backgrounds and gradients
            const hexToRgb = (hex: string) => {
              const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
              return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '139, 92, 246';
            };
            const rgb = hexToRgb(data.primaryColor);
            document.documentElement.style.setProperty('--accent-primary-transparent', `rgba(${rgb}, 0.15)`);
            document.documentElement.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${data.primaryColor} 0%, ${data.primaryColor}dd 100%)`);
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
        <h1 className="text-xl font-extrabold mb-2">Oops!</h1>
        <p className="text-[var(--text-secondary)] font-medium">{error}</p>
        <a href="/" className="mt-8 px-6 py-2.5 rounded-xl font-bold border border-[var(--border)] hover:bg-[var(--bg-surface-elevated)] transition-colors">
          Kembali ke LazeePOS
        </a>
      </div>
    );
  }

  const config = tenant.landingPageConfig || {};
  const template = config.template || 'retail';

  // Helper to group products for resto template
  const groupedProducts = tenant.products?.reduce((acc: any, p: any) => {
    const cat = p.category || 'Menu Lainnya';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  return (
    <div className={`min-h-screen ${tenant.themeMode === 'light' ? 'light-mode' : 'dark-mode'} bg-[var(--bg-main)] text-[var(--text-primary)] font-sans`}>
      
      {/* Navbar Shared Across All Templates */}
      <nav className="fixed top-0 w-full bg-[var(--bg-main)]/80 backdrop-blur-md border-b border-[var(--border)] z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
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
        </div>
      </nav>

      {/* Template Router */}
      {template === 'resto' && <RestoTemplate tenant={tenant} config={config} groupedProducts={groupedProducts} />}
      {template === 'retail' && <RetailTemplate tenant={tenant} config={config} />}
      {template === 'lookbook' && <LookbookTemplate tenant={tenant} config={config} />}

      {/* Shared Footer */}
      <Footer tenant={tenant} />

    </div>
  );
}
