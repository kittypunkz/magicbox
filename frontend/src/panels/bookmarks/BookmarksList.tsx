import { useMemo, useState } from 'react';
import { AlertCircle, Bookmark, ExternalLink, Loader2, Search } from 'lucide-react';
import type { Note } from '../../types';

interface BookmarksListProps {
  notes: Note[];
  loading: boolean;
  error: string | null;
  selectedBookmarkId: number | null;
  onSelectBookmark: (id: number) => void;
}

export function BookmarksList({ notes, loading, error, selectedBookmarkId, onSelectBookmark }: BookmarksListProps) {
  const [query, setQuery] = useState('');
  const bookmarks = notes.filter(note => note.bookmark_url);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return bookmarks;
    return bookmarks.filter(note =>
      note.title.toLowerCase().includes(q) ||
      note.bookmark_title?.toLowerCase().includes(q) ||
      note.bookmark_url?.toLowerCase().includes(q)
    );
  }, [bookmarks, query]);

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b border-mb-border px-4 py-3">
        <h1 className="mb-3 text-base font-semibold text-mb-primary">Bookmarks</h1>
        <label className="flex items-center gap-2 rounded-lg border border-mb-border bg-mb-surface px-2.5 py-2 text-mb-muted">
          <Search size={14} />
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search bookmarks..."
            className="min-w-0 flex-1 bg-transparent text-sm text-mb-primary placeholder:text-mb-muted focus:outline-none"
          />
        </label>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {error && (
          <div className="mb-2 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}
        {loading ? (
          <div className="flex h-32 items-center justify-center text-mb-muted">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-3 py-10 text-center text-sm text-mb-muted">No bookmarks found</div>
        ) : (
          <div className="space-y-1">
            {filtered.map(note => {
              const host = getHost(note.bookmark_url);
              return (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => onSelectBookmark(note.id)}
                  className={`w-full border-l-2 px-3 py-2.5 text-left transition-colors ${
                    selectedBookmarkId === note.id
                      ? 'border-mb-accent bg-mb-active'
                      : 'border-transparent hover:bg-mb-hover'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Bookmark size={13} className="shrink-0 text-mb-muted" />
                    <span className="truncate text-sm text-mb-primary">{note.bookmark_title || note.title}</span>
                  </div>
                  <div className="mt-0.5 truncate pl-5 text-xs text-mb-muted">{host}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function getHost(url: string | null | undefined) {
  if (!url) return '';
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function OpenUrlButton({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg bg-mb-accent px-3 py-2 text-sm text-white transition-colors hover:bg-mb-accent-hover"
    >
      <ExternalLink size={14} />
      Open URL
    </a>
  );
}
