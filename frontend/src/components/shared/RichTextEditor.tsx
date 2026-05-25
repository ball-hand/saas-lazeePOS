import React, { useRef, useEffect } from 'react';
import { Bold, Italic, List, ListOrdered } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Keep internal state synced only on mount or when externally cleared
  useEffect(() => {
    if (editorRef.current && value === '') {
      editorRef.current.innerHTML = '';
    }
  }, [value]);

  const exec = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--bg-main)] focus-within:border-[var(--accent-primary)] transition-colors">
      <div className="flex gap-1 p-2 border-b border-[var(--border)] bg-[var(--bg-surface-elevated)]">
        <button 
          type="button" 
          onClick={() => exec('bold')} 
          className="p-1.5 hover:bg-[var(--bg-main)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button 
          type="button" 
          onClick={() => exec('italic')} 
          className="p-1.5 hover:bg-[var(--bg-main)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <div className="w-px h-6 bg-[var(--border)] mx-1 self-center" />
        <button 
          type="button" 
          onClick={() => exec('insertUnorderedList')} 
          className="p-1.5 hover:bg-[var(--bg-main)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button 
          type="button" 
          onClick={() => exec('insertOrderedList')} 
          className="p-1.5 hover:bg-[var(--bg-main)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </button>
      </div>
      <div 
        ref={editorRef}
        contentEditable 
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        onBlur={(e) => onChange(e.currentTarget.innerHTML)}
        className="p-3 min-h-[100px] outline-none text-sm leading-relaxed prose prose-sm prose-invert max-w-none"
        data-placeholder={placeholder}
        dangerouslySetInnerHTML={{ __html: value }}
        style={{
          listStylePosition: 'inside'
        }}
      />
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: var(--text-secondary);
          opacity: 0.5;
          pointer-events: none;
          display: block;
        }
        [contenteditable] ul { list-style-type: disc; padding-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 0.5rem; }
        [contenteditable] ol { list-style-type: decimal; padding-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 0.5rem; }
      `}</style>
    </div>
  );
}
