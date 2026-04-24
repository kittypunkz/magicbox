import { useState, useEffect } from 'react';
import { Loader2, RefreshCw, Calendar, AlertCircle, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { briefAPI } from '../api/client';

const c = {
  bg: 'bg-[#191919]',
  text: 'text-[#e6e6e6]',
  gray: 'text-[#6b6b6b]',
  border: 'border-[#2f2f2f]',
};

interface Brief {
  id: number;
  date: string;
  content: string;
  created_at: string;
}

interface HistoryItem {
  id: number;
  date: string;
  created_at: string;
  preview: string;
}

export function BriefPage() {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await briefAPI.getToday();
      setBrief(data.brief);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load brief');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await briefAPI.getAll();
      setHistory(data.briefs);
      setShowHistory(true);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <div className={`h-full overflow-y-auto ${c.bg}`}>
      {/* Header */}
      <div className={`sticky top-0 bg-[#202020]/95 backdrop-blur border-b ${c.border} px-4 sm:px-8 py-4 z-10`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-xl font-bold ${c.text}`}>Daily Brief</h1>
            <p className={`text-xs ${c.gray}`}>{today}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadHistory}
              className={`flex items-center gap-1.5 px-3 py-1.5 border ${c.border} rounded-lg text-xs ${c.gray} hover:text-[#e6e6e6] transition-colors`}
            >
              <Calendar size={14} />
              History
            </button>
            <button
              onClick={() => load()}
              disabled={loading}
              className={`flex items-center gap-1.5 px-3 py-1.5 border ${c.border} rounded-lg text-xs ${c.gray} hover:text-[#e6e6e6] disabled:opacity-50 transition-colors`}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 py-4 max-w-3xl mx-auto">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 size={28} className={`animate-spin ${c.gray}`} />
            <p className={`text-sm ${c.gray}`}>Generating your brief...</p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-400 font-medium">Could not generate brief</p>
              <p className="text-xs text-red-400/80 mt-1">{error}</p>
              {error.includes('API key') && (
                <p className="text-xs text-red-400/60 mt-2">
                  Configure your OpenRouter API key in Settings.
                </p>
              )}
            </div>
          </div>
        )}

        {brief && !loading && (
          <div className="prose prose-invert prose-sm max-w-none
            prose-headings:text-[#e6e6e6] prose-headings:font-semibold
            prose-p:text-[#c9c9c9] prose-p:leading-relaxed
            prose-a:text-blue-400
            prose-code:text-[#e6e6e6] prose-code:bg-[#2a2a2a] prose-code:px-1 prose-code:rounded prose-code:text-xs
            prose-pre:bg-[#1a1a1a] prose-pre:border prose-pre:border-[#2f2f2f] prose-pre:rounded-lg
            prose-blockquote:border-l-blue-500 prose-blockquote:text-[#6b6b6b]
            prose-strong:text-[#e6e6e6]
            prose-ul:text-[#c9c9c9] prose-ol:text-[#c9c9c9]
            prose-hr:border-[#2f2f2f]
            prose-li:marker:text-[#6b6b6b]
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{brief.content}</ReactMarkdown>
          </div>
        )}

        {/* History drawer */}
        {showHistory && history.length > 0 && (
          <div className={`mt-8 border-t ${c.border} pt-6`}>
            <h2 className={`text-sm font-semibold ${c.text} mb-3`}>Past Briefs</h2>
            <div className="space-y-2">
              {history.map(item => (
                <div key={item.id} className={`flex items-center justify-between p-3 border ${c.border} rounded-xl bg-[#202020] hover:bg-[#222] transition-colors cursor-pointer`}>
                  <div>
                    <p className={`text-sm font-medium ${c.text}`}>{item.date}</p>
                    <p className={`text-xs ${c.gray} mt-0.5 line-clamp-1`}>{item.preview}</p>
                  </div>
                  <ChevronRight size={16} className={c.gray} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
