import React, { useState, useRef, useCallback } from 'react';
import { Send, Loader2, MessageSquare, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

const isDev = import.meta.env.DEV;
const API_BASE = import.meta.env.VITE_API_URL || (isDev ? 'http://localhost:8787' : '/api');

const c = {
  bg: 'bg-[#0a0a0a]',
  text: 'text-[#e6e6e6]',
  gray: 'text-[#888888]',
  border: 'border-[#2a2a2a]',
};

interface Source {
  id: number;
  title: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
}

interface AskPageProps {
  onNoteClick?: (noteId: number) => void;
}

const NOTE_REF_RE = /\[Note (\d+)\]/g;

function renderWithNoteButtons(
  text: string,
  sources: Source[],
  onNoteClick?: (id: number) => void,
): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  NOTE_REF_RE.lastIndex = 0;
  while ((m = NOTE_REF_RE.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const id = Number(m[1]);
    const title = sources.find(s => s.id === id)?.title ?? `Note ${id}`;
    parts.push(
      <button
        key={`${id}-${m.index}`}
        onClick={() => onNoteClick?.(id)}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs border border-[#2a2a2a] text-[#888888] hover:text-[#6366f1] hover:border-[#6366f1]/40 transition-colors align-middle mx-0.5"
      >
        <FileText size={10} />
        {title}
      </button>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function makeComponents(sources: Source[], onNoteClick?: (id: number) => void): Components {
  const patchText = (node: React.ReactNode): React.ReactNode => {
    if (typeof node === 'string') {
      if (!NOTE_REF_RE.test(node)) return node;
      const parts = renderWithNoteButtons(node, sources, onNoteClick);
      return parts.length === 1 ? parts[0] : <>{parts}</>;
    }
    return node;
  };

  const wrapChildren = (children: React.ReactNode): React.ReactNode => {
    if (Array.isArray(children)) return children.map((c, i) => <span key={i}>{patchText(c)}</span>);
    return patchText(children);
  };

  return {
    p: ({ children }) => <p>{wrapChildren(children)}</p>,
    li: ({ children }) => <li>{wrapChildren(children)}</li>,
    strong: ({ children }) => <strong>{wrapChildren(children)}</strong>,
    em: ({ children }) => <em>{wrapChildren(children)}</em>,
  };
}

export function AskPage({ onNoteClick }: AskPageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = input.trim();
    if (!msg || loading) return;

    setInput('');
    setError(null);

    // Build history from current messages (exclude sources metadata)
    const history = messages.map(m => ({ role: m.role, content: m.content }));

    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    scrollToBottom();

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: msg, history }),
      });

      const data = await res.json() as { content?: string; sources?: Source[]; error?: string };

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.content ?? '',
        sources: data.sources ?? [],
      }]);
      scrollToBottom();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [input, loading, scrollToBottom]);

  return (
    <div className={`h-full flex flex-col ${c.bg}`}>
      {/* Header */}
      <div className={`flex-shrink-0 bg-[#1a1a1a] border-b ${c.border} px-4 sm:px-8 py-4 sm:py-6`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#242424] rounded-xl flex items-center justify-center flex-shrink-0">
            <MessageSquare size={24} className={c.gray} />
          </div>
          <div className="flex-1">
            <h1 className={`text-lg sm:text-2xl font-bold ${c.text}`}>Ask</h1>
            <p className={`text-xs sm:text-sm ${c.gray}`}>Chat with your notes</p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className={`text-xs ${c.gray} hover:text-[#e6e6e6] px-3 py-1.5 border border-[#2a2a2a] rounded-lg transition-colors`}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 space-y-4">
        {messages.length === 0 && (
          <div className={`text-center py-16 ${c.gray}`}>
            <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Ask a question about your notes</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={msg.role === 'user' ? 'max-w-[70%]' : 'w-full'}>
              {msg.role === 'user' ? (
                <div className="bg-[#6366f1] text-[#0a0a0a] px-4 py-3 rounded-2xl rounded-tr-sm text-sm">
                  {msg.content}
                </div>
              ) : (
                <div className={`bg-[#1a1a1a] border ${c.border} rounded-2xl rounded-tl-sm px-4 py-3`}>
                  <div className="prose prose-invert prose-sm max-w-none text-[#e6e6e6]
                    prose-p:text-[#c9c9c9] prose-headings:text-[#e6e6e6]
                    prose-code:text-[#e6e6e6] prose-code:bg-[#242424] prose-code:px-1 prose-code:rounded prose-code:text-xs
                    prose-pre:bg-[#1a1a1a] prose-pre:border prose-pre:border-[#2a2a2a] prose-pre:rounded-lg
                    prose-strong:text-[#e6e6e6] prose-ul:text-[#c9c9c9] prose-ol:text-[#c9c9c9]
                  ">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={makeComponents(msg.sources ?? [], onNoteClick)}>{msg.content}</ReactMarkdown>
                  </div>

                  {msg.sources && msg.sources.length > 0 && (
                    <div className={`mt-3 pt-3 border-t ${c.border} flex flex-wrap gap-1.5`}>
                      {msg.sources.map(s => (
                        <button
                          key={s.id}
                          onClick={() => onNoteClick?.(s.id)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs border ${c.border} ${c.gray} hover:text-[#6366f1] hover:border-[#6366f1]/40 transition-colors`}
                        >
                          <FileText size={10} />
                          {s.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className={`bg-[#1a1a1a] border ${c.border} rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2`}>
              <Loader2 size={14} className={`animate-spin ${c.gray}`} />
              <span className={`text-sm ${c.gray}`}>Thinking...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className={`flex-shrink-0 border-t ${c.border} bg-[#1a1a1a]/50 px-4 sm:px-8 py-3`}>
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-3xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about your notes..."
            disabled={loading}
            className={`flex-1 px-4 py-2.5 bg-[#242424] border ${c.border} rounded-xl ${c.text} placeholder-[#5a5a5a] text-sm focus:outline-none focus:border-[#6366f1] transition-colors disabled:opacity-50`}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex items-center justify-center w-10 h-10 bg-[#6366f1] hover:bg-[#4f46e5] text-[#0a0a0a] disabled:opacity-50 rounded-xl transition-colors flex-shrink-0"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}
