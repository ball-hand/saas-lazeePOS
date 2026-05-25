import React from 'react';
import { Store } from 'lucide-react';

export function Footer({ tenant }: { tenant: any }) {
  return (
    <footer className="pt-16 pb-8 border-t border-[var(--border)] mt-20 bg-[var(--bg-surface-elevated)]">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-[var(--text-secondary)]">
        <p>&copy; {new Date().getFullYear()} {tenant.name}. All rights reserved.</p>
        <a href="https://lazeepos.com" target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1 hover:text-[var(--text-primary)] transition-colors">
          Powered by <Store size={14} className="mx-0.5 text-[var(--accent-primary)]" /> LazeePOS
        </a>
      </div>
    </footer>
  );
}
