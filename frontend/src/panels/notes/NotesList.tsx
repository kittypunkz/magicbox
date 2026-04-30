import { useMemo, useState } from 'react';
import { AlertCircle, Loader2, Plus, Search } from 'lucide-react';
import type { Folder, Note } from '../../types';

interface NotesListProps {
  notes: Note[];
  folders: Folder[];
  loading: boolean;
  error: string | null;
  selectedNoteId: number | null;
  selectedFolderId: number | null;
  onSelectNote: (id: number) => void;
  onSelectFolder: (id: number | null) => void;
  onCreateNote: () => void;
}

export function NotesList({
  notes,
  folders,
  loading,
  error,
  selectedNoteId,
  selectedFolderId,
  onSelectNote,
  onSelectFolder,
  onCreateNote,
}: NotesListProps) {
  const [query, setQuery] = useState('');

  const visibleFolders = folders.filter(folder => notes.some(note => note.folder_id === folder.id));
  const filtered = useMemo(() => {
    return notes.filter(note => {
      const matchesFolder = selectedFolderId ? note.folder_id === selectedFolderId : true;
      const q = query.trim().toLowerCase();
      const matchesQuery = !q || note.title.toLowerCase().includes(q) || note.content?.toLowerCase().includes(q);
      return matchesFolder && matchesQuery;
    });
  }, [notes, query, selectedFolderId]);

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b border-mb-border px-4 py-3">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-base font-semibold text-mb-primary">Notes</h1>
          <button
            type="button"
            onClick={onCreateNote}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-mb-muted transition-colors hover:bg-mb-hover hover:text-mb-primary"
            aria-label="Create note"
            title="Create note"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="mb-3 flex gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => onSelectFolder(null)}
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs transition-colors ${
              !selectedFolderId ? 'bg-mb-accent text-white' : 'bg-mb-surface text-mb-muted hover:text-mb-primary'
            }`}
          >
            All
          </button>
          {visibleFolders.map(folder => (
            <button
              key={folder.id}
              type="button"
              onClick={() => onSelectFolder(folder.id)}
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs transition-colors ${
                selectedFolderId === folder.id ? 'bg-mb-accent text-white' : 'bg-mb-surface text-mb-muted hover:text-mb-primary'
              }`}
            >
              {folder.name}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 rounded-lg border border-mb-border bg-mb-surface px-2.5 py-2 text-mb-muted">
          <Search size={14} />
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search notes..."
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
          <div className="px-3 py-10 text-center text-sm text-mb-muted">No notes found</div>
        ) : (
          <div className="space-y-1">
            {filtered.map(note => (
              <button
                key={note.id}
                type="button"
                onClick={() => onSelectNote(note.id)}
                className={`w-full border-l-2 px-3 py-2.5 text-left transition-colors ${
                  selectedNoteId === note.id
                    ? 'border-mb-accent bg-mb-active'
                    : 'border-transparent hover:bg-mb-hover'
                }`}
              >
                <div className="truncate text-sm text-mb-primary">{note.title || 'Untitled'}</div>
                <div className="mt-0.5 truncate text-xs text-mb-muted">
                  {note.folder_name || folders.find(f => f.id === note.folder_id)?.name || 'Inbox'}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
