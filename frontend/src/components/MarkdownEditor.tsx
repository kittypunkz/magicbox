import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Start writing in Markdown...',
  className = '',
  autoFocus = false,
}: MarkdownEditorProps) {
  const [editing, setEditing] = useState(autoFocus);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [editing]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setEditing(false);
    }
  }, []);

  if (editing) {
    return (
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => setEditing(false)}
        placeholder={placeholder}
        className={`w-full bg-transparent text-[#e6e6e6] placeholder-[#5a5a5a] resize-none outline-none font-mono text-sm leading-relaxed ${className}`}
        style={{ minHeight: '200px', height: 'auto' }}
        rows={Math.max(10, value.split('\n').length + 2)}
      />
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className={`cursor-text min-h-[200px] ${className}`}
      title="Click to edit"
    >
      {value ? (
        <div className="prose prose-invert prose-sm max-w-none text-[#e6e6e6]
          prose-headings:text-[#e6e6e6] prose-headings:font-semibold
          prose-p:text-[#c9c9c9] prose-p:leading-relaxed
          prose-a:text-[#faff69] prose-a:no-underline hover:prose-a:underline
          prose-code:text-[#e6e6e6] prose-code:bg-[#242424] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono
          prose-pre:bg-[#1a1a1a] prose-pre:border prose-pre:border-[#2a2a2a] prose-pre:rounded-lg
          prose-blockquote:border-l-[#faff69] prose-blockquote:text-[#888888]
          prose-strong:text-[#e6e6e6]
          prose-ul:text-[#c9c9c9] prose-ol:text-[#c9c9c9]
          prose-hr:border-[#2a2a2a]
          prose-table:text-[#c9c9c9]
        ">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
        </div>
      ) : (
        <p className="text-[#5a5a5a] text-sm italic">{placeholder}</p>
      )}
    </div>
  );
}
