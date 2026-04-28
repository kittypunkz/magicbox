import { useState } from 'react';
import { Bookmark, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { useNotes } from '../hooks/useNotes';
import type { Note } from '../types';

const c = {
  bg: 'bg-[#0a0a0a]',
  text: 'text-[#e6e6e6]',
  gray: 'text-[#888888]',
  border: 'border-[#2a2a2a]',
};

interface BookmarksPageProps {
  onSelectNote: (note: Note) => void;
}

export function BookmarksPage({ onSelectNote }: BookmarksPageProps) {
  const { notes, loading, error } = useNotes();
  const [filter, setFilter] = useState('');

  const bookmarks = notes.filter(n => n.bookmark_url);
  const filtered = filter
    ? bookmarks.filter(n =>
        n.title.toLowerCase().includes(filter.toLowerCase()) ||
        n.bookmark_url?.toLowerCase().includes(filter.toLowerCase()) ||
        n.content?.toLowerCase().includes(filter.toLowerCase())
      )
    : bookmarks;

  return (
    <div className={`h-full overflow-y-auto ${c.bg}`}>
      {/* Header */}
      <div className={`sticky top-0 bg-[#1a1a1a]/95 backdrop-blur border-b ${c.border} px-4 sm:px-8 py-4 z-10`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-[#242424] rounded-xl flex items-center justify-center flex-shrink-0">
            <Bookmark size={20} className={c.gray} />
          </div>
          <div>
            <h1 className={`text-xl font-bold ${c.text}`}>Bookmarks</h1>
            <p className={`text-xs ${c.gray}`}>{bookmarks.length} saved</p>
          </div>
        </div>
        <input
          type="text"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter bookmarks..."
          className={`w-full px-3 py-2 bg-[#242424] border ${c.border} rounded-lg ${c.text} placeholder-[#5a5a5a] text-sm focus:outline-none focus:border-[#faff69] transition-colors`}
        />
      </div>

      <div className="px-4 sm:px-8 py-4">
        {error && (
          <div className="flex items-start gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className={`animate-spin ${c.gray}`} />
          </div>
        ) : filtered.length === 0 ? (
          <div className={`text-center py-16 ${c.gray}`}>
            <Bookmark size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">{filter ? 'No matching bookmarks' : 'No bookmarks yet'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(note => {
              const hostname = note.bookmark_url
                ? (() => { try { return new URL(note.bookmark_url).hostname; } catch { return note.bookmark_url; } })()
                : '';
              return (
                <div
                  key={note.id}
                  onClick={() => onSelectNote(note)}
                  className={`p-4 bg-[#1a1a1a] border ${c.border} rounded-xl cursor-pointer hover:border-[#3a3a3a] hover:bg-[#222] transition-colors group`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className={`text-sm font-medium ${c.text} line-clamp-1`}>
                        {note.bookmark_title || note.title}
                      </h3>
                      <p className={`text-xs ${c.gray} mt-0.5 font-mono`}>{hostname}</p>
                      {note.content && (
                        <p className={`text-xs ${c.gray} mt-1.5 line-clamp-2`}>{note.content}</p>
                      )}
                    </div>
                    <a
                      href={note.bookmark_url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className={`flex-shrink-0 p-1.5 rounded-lg ${c.gray} hover:text-[#faff69] opacity-0 group-hover:opacity-100 transition-all`}
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
