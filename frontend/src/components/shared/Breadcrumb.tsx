import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center text-sm font-medium text-[var(--text-secondary)] whitespace-nowrap bg-[var(--bg-surface-elevated)] border border-[var(--border)] px-4 py-2 rounded-xl shadow-sm w-fit">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={index} className="flex items-center">
            {item.path && !isLast ? (
              <Link to={item.path} className="hover:text-[var(--accent-primary)] transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-[var(--text-primary)] font-bold' : ''}>
                {item.label}
              </span>
            )}
            
            {!isLast && (
              <ChevronRight size={14} className="mx-2 opacity-50" />
            )}
          </div>
        );
      })}
    </nav>
  );
}
