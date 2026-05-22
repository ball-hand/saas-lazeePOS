import type { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  iconColorClass?: string;
  iconBgClass?: string;
}

export function StatsCard({ 
  title, 
  value, 
  icon, 
  trend, 
  iconColorClass = 'text-[var(--accent-primary)]', 
  iconBgClass = 'bg-[var(--accent-primary-transparent)]' 
}: StatsCardProps) {
  return (
    <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md hover:border-[var(--accent-primary)]/50 transition-all duration-300 group">
      <div className="flex justify-between items-start">
        <h3 className="text-[var(--text-secondary)] font-medium text-sm">{title}</h3>
        <div className={`p-2.5 rounded-xl ${iconColorClass} ${iconBgClass} transition-transform group-hover:scale-110 duration-300`}>
          {icon}
        </div>
      </div>
      
      <div>
        <p className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">{value}</p>
        
        {trend && (
          <div className="flex items-center gap-2 mt-2 bg-[var(--bg-main)] inline-flex px-2 py-1 rounded-md border border-[var(--border)]">
            <span className={`text-xs font-bold ${trend.value >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
              {trend.value >= 0 ? '+' : ''}{trend.value}%
            </span>
            <span className="text-[11px] text-[var(--text-secondary)] font-medium">{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}