import { Bookmark, FileText } from 'lucide-react';
import type { Note } from '../../types';
import { getHost, OpenUrlButton } from './BookmarksList';

interface BookmarkDetailProps {
  bookmark: Note | null;
  onViewNote: (id: number) => void;
}

export function BookmarkDetail({ bookmark, onViewNote }: BookmarkDetailProps) {
  if (!bookmark) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-mb-base text-center text-mb-muted">
        <div>
          <Bookmark size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Select a bookmark</p>
        </div>
      </div>
    );
  }

  const url = bookmark.bookmark_url || '';
  const host = getHost(url);

  return (
    <div className="h-full w-full overflow-y-auto bg-mb-base">
      <header className="border-b border-mb-border px-6 py-4">
        <h1 className="text-base font-semibold text-mb-primary">Bookmark Preview</h1>
      </header>
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="rounded-lg border border-mb-border bg-mb-surface p-5">
          <div className="mb-5 flex items-center gap-3">
            <img
              src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`}
              alt=""
              className="h-8 w-8 rounded"
            />
            <div className="min-w-0">
              <div className="truncate text-sm text-mb-muted">{host}</div>
              <h2 className="truncate text-lg font-semibold text-mb-primary">{bookmark.bookmark_title || bookmark.title}</h2>
            </div>
          </div>
          {bookmark.content && (
            <p className="mb-5 whitespace-pre-wrap text-sm leading-6 text-mb-primary/80">{bookmark.content}</p>
          )}
          <p className="mb-5 break-all font-mono text-xs text-mb-muted">{url}</p>
          <div className="flex flex-wrap gap-2 border-t border-mb-border pt-4">
            {url && <OpenUrlButton url={url} />}
            <button
              type="button"
              onClick={() => onViewNote(bookmark.id)}
              className="inline-flex items-center gap-2 rounded-lg border border-mb-border px-3 py-2 text-sm text-mb-primary transition-colors hover:bg-mb-hover"
            >
              <FileText size={14} />
              View Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
