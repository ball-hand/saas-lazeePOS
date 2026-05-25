import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center pt-10 sm:pt-16 p-4 sm:p-6 no-print">
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-md transition-opacity"
        onClick={onClose}
      ></div>
      
      <div className="relative w-full max-w-lg bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)] bg-[var(--bg-main)]">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">{title}</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-5 overflow-y-auto custom-scrollbar bg-[var(--bg-surface-elevated)]">
          {children}
        </div>
      </div>
    </div>
  );
}
