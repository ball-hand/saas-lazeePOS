import { useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Image as ImageIcon, Unlink } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[var(--accent-primary)] underline cursor-pointer',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Ketik sesuatu di sini...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'p-3 min-h-[100px] outline-none text-sm leading-relaxed prose max-w-none focus:outline-none',
      },
      handlePaste: (view, event) => {
        const items = Array.from(event.clipboardData?.items || []) as DataTransferItem[];
        for (const item of items) {
          if (item.type.indexOf('image') === 0) {
            const file = item.getAsFile();
            if (file) {
              const reader = new FileReader();
              reader.onload = (e) => {
                const result = e.target?.result as string;
                if (result) {
                  const node = view.state.schema.nodes.image.create({ src: result });
                  const transaction = view.state.tr.replaceSelectionWith(node);
                  view.dispatch(transaction);
                }
              };
              reader.readAsDataURL(file);
              event.preventDefault();
              return true;
            }
          }
        }
        return false;
      },
    },
  });

  // Keep it synced if value changes externally (e.g. form reset)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Masukkan URL / Tautan:', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('Masukkan URL Gambar (atau Anda bisa menekan Ctrl+V untuk paste gambar):');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--bg-main)] focus-within:border-[var(--accent-primary)] transition-colors">
      <div className="flex flex-wrap gap-1 p-2 border-b border-[var(--border)] bg-[var(--bg-surface-elevated)]">
        <button 
          type="button" 
          onClick={() => editor.chain().focus().toggleBold().run()} 
          className={`p-1.5 rounded transition-colors ${editor.isActive('bold') ? 'bg-[var(--accent-primary-transparent)] text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-main)] hover:text-[var(--text-primary)]'}`}
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button 
          type="button" 
          onClick={() => editor.chain().focus().toggleItalic().run()} 
          className={`p-1.5 rounded transition-colors ${editor.isActive('italic') ? 'bg-[var(--accent-primary-transparent)] text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-main)] hover:text-[var(--text-primary)]'}`}
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <div className="w-px h-6 bg-[var(--border)] mx-1 self-center" />
        <button 
          type="button" 
          onClick={() => editor.chain().focus().toggleBulletList().run()} 
          className={`p-1.5 rounded transition-colors ${editor.isActive('bulletList') ? 'bg-[var(--accent-primary-transparent)] text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-main)] hover:text-[var(--text-primary)]'}`}
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button 
          type="button" 
          onClick={() => editor.chain().focus().toggleOrderedList().run()} 
          className={`p-1.5 rounded transition-colors ${editor.isActive('orderedList') ? 'bg-[var(--accent-primary-transparent)] text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-main)] hover:text-[var(--text-primary)]'}`}
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </button>
        <div className="w-px h-6 bg-[var(--border)] mx-1 self-center" />
        <button 
          type="button" 
          onClick={setLink} 
          className={`p-1.5 rounded transition-colors ${editor.isActive('link') ? 'bg-[var(--accent-primary-transparent)] text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-main)] hover:text-[var(--text-primary)]'}`}
          title="Insert Link"
        >
          <LinkIcon size={16} />
        </button>
        {editor.isActive('link') && (
          <button 
            type="button" 
            onClick={() => editor.chain().focus().unsetLink().run()} 
            className="p-1.5 rounded text-red-500 hover:bg-red-500/10 transition-colors"
            title="Remove Link"
          >
            <Unlink size={16} />
          </button>
        )}
        <button 
          type="button" 
          onClick={addImage} 
          className="p-1.5 rounded text-[var(--text-secondary)] hover:bg-[var(--bg-main)] hover:text-[var(--text-primary)] transition-colors"
          title="Insert Image (or Ctrl+V)"
        >
          <ImageIcon size={16} />
        </button>
      </div>
      
      <div className="relative">
        <EditorContent editor={editor} />
      </div>

      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--text-secondary);
          pointer-events: none;
          height: 0;
          opacity: 0.5;
        }
        .ProseMirror {
          min-height: 120px;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .ProseMirror ul {
          list-style-type: disc !important;
          padding-left: 1.5rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
        }
        .ProseMirror ol {
          list-style-type: decimal !important;
          padding-left: 1.5rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
        }
        .ProseMirror li p {
          margin: 0 !important;
        }
        .ProseMirror a {
          color: var(--accent-primary);
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
