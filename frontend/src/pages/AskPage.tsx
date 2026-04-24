import { useState, useRef, useCallback } from 'react';
import { Send, Loader2, MessageSquare, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const isDev = import.meta.env.DEV;
const API_BASE = import.meta.env.VITE_API_URL || (isDev ? 'http://localhost:8787' : '/api');

const c = {
  bg: 'bg-[#191919]',
  text: 'text-[#e6e6e6]',
  gray: 'text-[#6b6b6b]',
  border: 'border-[#2f2f2f]',
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
      <div className={`flex-shrink-0 bg-[#202020] border-b ${c.border} px-4 sm:px-8 py-4 sm:py-6`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#2a2a2a] rounded-xl flex items-center justify-center flex-shrink-0">
            <MessageSquare size={24} className={c.gray} />
          </div>
          <div className="flex-1">
            <h1 className={`text-lg sm:text-2xl font-bold ${c.text}`}>Ask</h1>
            <p className={`text-xs sm:text-sm ${c.gray}`}>Chat with your notes</p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className={`text-xs ${c.gray} hover:text-[#e6e6e6] px-3 py-1.5 border border-[#2f2f2f] rounded-lg transition-colors`}
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
                <div className="bg-blue-500 text-white px-4 py-3 rounded-2xl rounded-tr-sm text-sm">
                  {msg.content}
                </div>
              ) : (
                <div className={`bg-[#202020] border ${c.border} rounded-2xl rounded-tl-sm px-4 py-3`}>
                  <div className="prose prose-invert prose-sm max-w-none text-[#e6e6e6]
                    prose-p:text-[#c9c9c9] prose-headings:text-[#e6e6e6]
                    prose-code:text-[#e6e6e6] prose-code:bg-[#2a2a2a] prose-code:px-1 prose-code:rounded prose-code:text-xs
                    prose-pre:bg-[#1a1a1a] prose-pre:border prose-pre:border-[#2f2f2f] prose-pre:rounded-lg
                    prose-strong:text-[#e6e6e6] prose-ul:text-[#c9c9c9] prose-ol:text-[#c9c9c9]
                  ">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>

                  {msg.sources && msg.sources.length > 0 && (
                    <div className={`mt-3 pt-3 border-t ${c.border} flex flex-wrap gap-1.5`}>
                      {msg.sources.map(s => (
                        <button
                          key={s.id}
                          onClick={() => onNoteClick?.(s.id)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs border ${c.border} ${c.gray} hover:text-blue-400 hover:border-blue-500/40 transition-colors`}
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
            <div className={`bg-[#202020] border ${c.border} rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2`}>
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
      <div className={`flex-shrink-0 border-t ${c.border} bg-[#202020]/50 px-4 sm:px-8 py-3`}>
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-3xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about your notes..."
            disabled={loading}
            className={`flex-1 px-4 py-2.5 bg-[#2a2a2a] border ${c.border} rounded-xl ${c.text} placeholder-[#4b4b4b] text-sm focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50`}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex items-center justify-center w-10 h-10 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl transition-colors flex-shrink-0"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}
