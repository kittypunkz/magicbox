import { useFolder } from '../hooks/useFolders';
import { Folder, FileText, Clock } from 'lucide-react';
import type { Note } from '../types';

interface FolderPageProps {
  folderId: number;
  onSelectNote: (note: Note) => void;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function FolderPage({ folderId, onSelectNote }: FolderPageProps) {
  const { folder, loading, error } = useFolder(folderId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error || !folder) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-notion-gray dark:text-notion-dark-gray">
        <Folder size={48} className="mb-4 opacity-30" />
        <p>Folder not found</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-notion-bg dark:bg-notion-dark-bg transition-theme">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-notion-dark-bg border-b border-notion-border dark:border-notion-dark-border px-8 py-6 z-10 transition-theme">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <Folder size={24} className="text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-notion-text dark:text-notion-dark-text">{folder.name}</h1>
            <p className="text-sm text-notion-gray dark:text-notion-dark-gray flex items-center gap-2">
              <FileText size={14} />
              {folder.notes?.length || 0} note{folder.notes?.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Notes List */}
      <div className="px-8 py-6">
        {!folder.notes || folder.notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-notion-gray dark:text-notion-dark-gray">
            <FileText size={48} className="mb-4 opacity-30" />
            <p className="text-lg font-medium">No notes in this folder</p>
            <p className="text-sm mt-1">Create a note from the home page</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {folder.notes.map((note) => (
              <button
                key={note.id}
                onClick={() => onSelectNote(note as Note)}
                className="group flex flex-col p-5 bg-white dark:bg-notion-dark-input border border-notion-border dark:border-notion-dark-border rounded-xl hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all text-left"
              >
                <h3 className="font-semibold text-notion-text dark:text-notion-dark-text truncate mb-2">
                  {note.title}
                </h3>
                <p className="text-sm text-notion-gray dark:text-notion-dark-gray line-clamp-3 flex-1">
                  Click to open this note
                </p>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-notion-border dark:border-notion-dark-border text-xs text-notion-gray dark:text-notion-dark-gray">
                  <Clock size={12} />
                  {formatDate(note.updated_at)}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
