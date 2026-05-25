import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: React.ReactNode;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Pilih opsi...',
  className = '',
  icon,
  disabled = false
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedOption = options.find(opt => String(opt.value) === String(value));

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between text-left px-4 py-3 bg-[var(--bg-main)] border border-[var(--border)] rounded-xl outline-none transition-all ${
          isOpen ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/20' : 'hover:border-[var(--text-secondary)]/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {icon && <span className="text-[var(--text-secondary)]">{icon}</span>}
          <span className={`truncate text-sm font-medium ${!selectedOption && !value ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown 
          size={16} 
          className={`text-[var(--text-secondary)] transition-transform duration-300 ${isOpen ? 'rotate-180 text-[var(--accent-primary)]' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-fade-in backdrop-blur-xl">
          <ul className="max-h-60 overflow-y-auto custom-scrollbar p-1.5">
            {options.map((opt, idx) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <li
                  key={idx}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`px-3 py-2.5 rounded-lg cursor-pointer text-sm font-medium transition-colors flex items-center gap-2 ${
                    isSelected 
                      ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' 
                      : 'text-[var(--text-primary)] hover:bg-[var(--bg-main)]'
                  }`}
                >
                  {opt.label}
                </li>
              );
            })}
            
            {options.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-[var(--text-secondary)]">
                Tidak ada opsi tersedia
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
