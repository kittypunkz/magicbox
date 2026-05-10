import { useMemo, useState } from 'react';
import { Bookmark, ExternalLink, Loader2, AlertCircle, Copy, Plus, Search, ArrowUpDown } from 'lucide-react';
import { useNotes } from '../hooks/useNotes';
import { formatDate, formatRelativeTime } from '../lib/dates';
import type { Note } from '../types';

const c = {
  bg: 'bg-[#0a0a0a]',
  text: 'text-[#e6e6e6]',
  gray: 'text-[#888888]',
  border: 'border-[#2a2a2a]',
};

type SortMode = 'newest' | 'oldest';

interface BookmarksPageProps {
  onSelectNote: (note: Note) => void;
  onCreateNote: () => void;
}

function hostnameFor(url: string | null): string {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function BookmarksPage({ onSelectNote, onCreateNote }: BookmarksPageProps) {
  const { notes, loading, error } = useNotes();
  const [query, setQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const bookmarks = useMemo(
    () => notes.filter(note => note.bookmark_url),
    [notes]
  );

  const domains = useMemo(() => {
    const unique = new Set(bookmarks.map(note => hostnameFor(note.bookmark_url)).filter(Boolean));
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [bookmarks]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filteredBookmarks = bookmarks.filter(note => {
      const hostname = hostnameFor(note.bookmark_url);
      const matchesQuery = normalizedQuery.length === 0 || [
        note.title,
        note.bookmark_title,
        note.bookmark_url,
        note.content,
        hostname,
      ].some(value => value?.toLowerCase().includes(normalizedQuery));
      const matchesDomain = domainFilter === 'all' || hostname === domainFilter;
      return matchesQuery && matchesDomain;
    });

    return [...filteredBookmarks].sort((a, b) => {
      const aTime = new Date(a.updated_at).getTime();
      const bTime = new Date(b.updated_at).getTime();
      return sortMode === 'newest' ? bTime - aTime : aTime - bTime;
    });
  }, [bookmarks, domainFilter, query, sortMode]);

  const handleCopyUrl = async (note: Note) => {
    if (!note.bookmark_url) return;
    try {
      await navigator.clipboard.writeText(note.bookmark_url);
      setCopiedId(note.id);
      window.setTimeout(() => setCopiedId(current => (current === note.id ? null : current)), 1800);
    } catch {
      setCopiedId(null);
    }
  };

  return (
    <div className={`h-full overflow-y-auto ${c.bg}`}>
      <div className={`sticky top-0 bg-[#1a1a1a]/95 backdrop-blur border-b ${c.border} px-4 sm:px-8 py-4 z-10`}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#242424] rounded-xl flex items-center justify-center flex-shrink-0">
              <Bookmark size={20} className={c.gray} />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${c.text}`}>Bookmarks</h1>
              <p className={`text-xs ${c.gray}`}>{bookmarks.length} saved links</p>
            </div>
          </div>
          <button
            onClick={onCreateNote}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-3 py-1.5 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-emerald-300"
          >
            <Plus size={16} />
            Save Bookmark
          </button>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_140px]">
          <label className={`flex items-center gap-2 rounded-lg border ${c.border} bg-[#242424] px-3 py-2`}>
            <Search size={14} className={c.gray} />
            <input
              type="text"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search title, URL, content, or domain"
              className={`w-full bg-transparent outline-none placeholder-[#5a5a5a] text-sm ${c.text}`}
            />
          </label>

          <select
            value={domainFilter}
            onChange={event => setDomainFilter(event.target.value)}
            className={`px-3 py-2 bg-[#242424] border ${c.border} rounded-lg ${c.text} text-sm focus:outline-none focus:border-[#faff69]`}
          >
            <option value="all">All domains</option>
            {domains.map(domain => (
              <option key={domain} value={domain}>{domain}</option>
            ))}
          </select>

          <button
            onClick={() => setSortMode(current => current === 'newest' ? 'oldest' : 'newest')}
            className={`inline-flex items-center justify-center gap-2 px-3 py-2 bg-[#242424] border ${c.border} rounded-lg text-sm ${c.text} hover:border-[#3a3a3a] transition-colors`}
          >
            <ArrowUpDown size={14} className={c.gray} />
            {sortMode === 'newest' ? 'Newest' : 'Oldest'}
          </button>
        </div>
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
          <div className={`rounded-2xl border border-dashed ${c.border} px-6 py-16 text-center`}>
            <Bookmark size={40} className={`mx-auto mb-3 opacity-30 ${c.gray}`} />
            <p className={`text-sm ${c.text}`}>{query || domainFilter !== 'all' ? 'No matching bookmarks' : 'No bookmarks yet'}</p>
            <p className={`mt-2 text-xs ${c.gray}`}>
              {query || domainFilter !== 'all'
                ? 'Try a different search or domain filter.'
                : 'Save a link from Quick Capture to build your bookmark library.'}
            </p>
            <button
              onClick={onCreateNote}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-emerald-300"
            >
              <Plus size={16} />
              Save Bookmark
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(note => {
              const hostname = hostnameFor(note.bookmark_url);
              return (
                <div
                  key={note.id}
                  onClick={() => onSelectNote(note)}
                  className={`p-4 bg-[#1a1a1a] border ${c.border} rounded-xl cursor-pointer hover:border-[#3a3a3a] hover:bg-[#222] transition-colors group`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-300">
                          {hostname}
                        </span>
                        {note.folder_name ? (
                          <span className={`text-[11px] ${c.gray}`}>#{note.folder_name}</span>
                        ) : null}
                        <span className="text-[11px] text-[#5a5a5a]">
                          Updated {formatRelativeTime(note.updated_at)}
                        </span>
                      </div>

                      <h3 className={`mt-2 text-sm font-medium ${c.text} line-clamp-1`}>
                        {note.bookmark_title || note.title}
                      </h3>

                      <p className="text-xs mt-1 text-emerald-400 truncate">{note.bookmark_url}</p>

                      {note.content && (
                        <p className={`text-xs ${c.gray} mt-2 line-clamp-2`}>{note.content}</p>
                      )}

                      <div className={`mt-3 flex items-center gap-3 text-[11px] ${c.gray}`}>
                        <span>Saved {formatDate(note.created_at)}</span>
                        <span>•</span>
                        <span>{note.content?.trim() ? `${note.content.trim().length} chars` : 'No notes added'}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <a
                        href={note.bookmark_url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={event => event.stopPropagation()}
                        className={`inline-flex items-center gap-1.5 rounded-lg border ${c.border} px-2.5 py-1.5 text-xs ${c.gray} hover:text-[#faff69] hover:border-[#faff69]/40 transition-colors`}
                      >
                        <ExternalLink size={14} />
                        Open
                      </a>
                      <button
                        onClick={event => {
                          event.stopPropagation();
                          void handleCopyUrl(note);
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-lg border ${c.border} px-2.5 py-1.5 text-xs ${c.gray} hover:text-[#e6e6e6] hover:border-[#3a3a3a] transition-colors`}
                      >
                        <Copy size={14} />
                        {copiedId === note.id ? 'Copied' : 'Copy URL'}
                      </button>
                    </div>
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
