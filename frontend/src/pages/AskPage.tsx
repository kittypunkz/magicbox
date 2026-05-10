import React, { useState, useRef, useCallback } from 'react';
import { Send, Loader2, MessageSquare, FileText, CheckSquare, Bookmark } from 'lucide-react';
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

type ScopeType = 'today' | 'this_week' | 'notes' | 'tasks' | 'bookmarks' | 'all' | 'custom';

interface Source {
  id: number;
  type: 'note' | 'task' | 'bookmark';
  title: string;
  subtitle?: string;
  note_id?: number | null;
  url?: string | null;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  weak?: boolean;
}

interface AskScope {
  scope: ScopeType;
  from?: string;
  to?: string;
}

interface AskPageProps {
  onNoteClick?: (noteId: number) => void;
}

const SOURCE_REF_RE = /\[(Note|Task|Bookmark) (\d+)\]/g;

const SCOPE_OPTIONS: Array<{ key: ScopeType; label: string }> = [
  { key: 'today', label: 'Today' },
  { key: 'this_week', label: 'This Week' },
  { key: 'notes', label: 'Notes' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'bookmarks', label: 'Bookmarks' },
  { key: 'all', label: 'All' },
  { key: 'custom', label: 'Custom' },
];

function renderWithNoteButtons(
  text: string,
  sources: Source[],
  onNoteClick?: (id: number) => void,
): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  SOURCE_REF_RE.lastIndex = 0;
  while ((m = SOURCE_REF_RE.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const sourceType = m[1].toLowerCase() as Source['type'];
    const refId = Number(m[2]);
    const source = sources.find(s => s.id === refId && s.type === sourceType);
    const title = source?.title ?? `${m[1]} ${refId}`;
    parts.push(
      <button
        key={`${refId}-${m.index}`}
        onClick={() => {
          if (source?.note_id) onNoteClick?.(source.note_id);
        }}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs border border-[#2a2a2a] text-[#888888] hover:text-[#faff69] hover:border-[#faff69]/40 transition-colors align-middle mx-0.5"
      >
        {source?.type === 'task' ? <CheckSquare size={10} /> : source?.type === 'bookmark' ? <Bookmark size={10} /> : <FileText size={10} />}
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
      if (!SOURCE_REF_RE.test(node)) return node;
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
  const [scope, setScope] = useState<ScopeType>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [feedbackIds, setFeedbackIds] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  const activeScope: AskScope = scope === 'custom'
    ? { scope, from: customFrom || undefined, to: customTo || undefined }
    : { scope };

  const customScopeIncomplete = scope === 'custom' && (!customFrom || !customTo);

  const sendWrongSourceFeedback = useCallback(async (source: Source) => {
    const key = `${source.type}-${source.id}`;
    if (feedbackIds.includes(key)) return;
    setFeedbackIds(prev => [...prev, key]);

    try {
      await fetch(`${API_BASE}/chat/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          source_type: source.type,
          source_id: source.id,
          note_id: source.note_id,
          scope: activeScope.scope,
          message: 'Wrong source',
        }),
      });
    } catch {
      // Feedback must never break chat flow.
    }
  }, [activeScope.scope, feedbackIds]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = input.trim();
    if (!msg || loading || customScopeIncomplete) return;

    setInput('');
    setError(null);

    const history = messages.map(m => ({ role: m.role, content: m.content }));

    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    scrollToBottom();

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: msg, history, scope: activeScope }),
      });

      const data = await res.json() as {
        content?: string;
        sources?: Source[];
        error?: string;
        retrieval?: { weak?: boolean };
      };

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.content ?? '',
        sources: data.sources ?? [],
        weak: data.retrieval?.weak ?? false,
      }]);
      scrollToBottom();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [activeScope, customScopeIncomplete, input, loading, messages, scrollToBottom]);

  return (
    <div className={`h-full flex flex-col ${c.bg}`}>
      <div className={`flex-shrink-0 bg-[#1a1a1a] border-b ${c.border} px-4 sm:px-8 py-4 sm:py-6`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#242424] rounded-xl flex items-center justify-center flex-shrink-0">
            <MessageSquare size={24} className={c.gray} />
          </div>
          <div className="flex-1">
            <h1 className={`text-lg sm:text-2xl font-bold ${c.text}`}>Ask</h1>
            <p className={`text-xs sm:text-sm ${c.gray}`}>Chat with your notes, tasks, and bookmarks</p>
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

        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {SCOPE_OPTIONS.map(option => (
              <button
                key={option.key}
                onClick={() => setScope(option.key)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                  scope === option.key
                    ? 'bg-[#faff69] text-[#0a0a0a] border-[#faff69]'
                    : `border-[#2a2a2a] ${c.gray} hover:text-[#e6e6e6] hover:border-[#444]`
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {scope === 'custom' && (
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="date"
                value={customFrom}
                onChange={event => setCustomFrom(event.target.value)}
                className={`bg-[#242424] border ${c.border} rounded-lg px-3 py-2 text-sm ${c.text} focus:outline-none focus:border-[#444] [color-scheme:dark]`}
              />
              <span className={`text-xs ${c.gray}`}>to</span>
              <input
                type="date"
                value={customTo}
                onChange={event => setCustomTo(event.target.value)}
                className={`bg-[#242424] border ${c.border} rounded-lg px-3 py-2 text-sm ${c.text} focus:outline-none focus:border-[#444] [color-scheme:dark]`}
              />
              {customScopeIncomplete && (
                <span className="text-xs text-orange-400">Select both dates to use a custom scope.</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 space-y-4">
        {messages.length === 0 && (
          <div className={`text-center py-16 ${c.gray}`}>
            <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Ask a question with the scope above to narrow what the assistant should use.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={msg.role === 'user' ? 'max-w-[70%]' : 'w-full'}>
              {msg.role === 'user' ? (
                <div className="bg-[#faff69] text-[#0a0a0a] px-4 py-3 rounded-2xl rounded-tr-sm text-sm">
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
                    <div className={`mt-3 pt-3 border-t ${c.border} flex flex-wrap gap-2`}>
                      {msg.sources.map(s => {
                        const key = `${s.type}-${s.id}`;
                        const submitted = feedbackIds.includes(key);
                        return (
                          <div key={key} className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                if (s.note_id) onNoteClick?.(s.note_id);
                              }}
                              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs border ${c.border} ${c.gray} hover:text-[#faff69] hover:border-[#faff69]/40 transition-colors`}
                            >
                              {s.type === 'task' ? <CheckSquare size={10} /> : s.type === 'bookmark' ? <Bookmark size={10} /> : <FileText size={10} />}
                              <span className="uppercase text-[10px] tracking-wide opacity-70">{s.type}</span>
                              {s.title}
                            </button>
                            <button
                              onClick={() => { void sendWrongSourceFeedback(s); }}
                              disabled={submitted}
                              className="rounded-lg border border-red-500/20 px-2 py-1 text-[11px] text-red-300 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                            >
                              {submitted ? 'Reported' : 'Wrong source'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {msg.weak && (
                    <div className="mt-3 rounded-lg border border-orange-500/20 bg-orange-500/10 px-3 py-2 text-xs text-orange-300">
                      Retrieval was weak for this answer. Try broadening the scope or asking with more specific terms.
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

      <div className={`flex-shrink-0 border-t ${c.border} bg-[#1a1a1a]/50 px-4 sm:px-8 py-3`}>
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-3xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about your workspace..."
            disabled={loading}
            className={`flex-1 px-4 py-2.5 bg-[#242424] border ${c.border} rounded-xl ${c.text} placeholder-[#5a5a5a] text-sm focus:outline-none focus:border-[#faff69] transition-colors disabled:opacity-50`}
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || customScopeIncomplete}
            className="flex items-center justify-center w-10 h-10 bg-[#faff69] hover:bg-[#e6eb52] text-[#0a0a0a] disabled:opacity-50 rounded-xl transition-colors flex-shrink-0"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}
