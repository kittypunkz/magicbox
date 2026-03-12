import { useState } from 'react';
import { Search, X, FileText, Folder, Loader2 } from 'lucide-react';
import { useSearch } from '../hooks/useSearch';

interface SearchBarProps {
  onSelectNote: (id: number) => void;
  onSelectFolder: (id: number) => void;
}

export function SearchBar({ onSelectNote, onSelectFolder }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { result, loading } = useSearch(query, 1000);

  const handleNoteClick = (id: number) => {
    onSelectNote(id);
    setQuery('');
    setIsOpen(false);
  };

  const handleFolderClick = (id: number) => {
    onSelectFolder(id);
    setQuery('');
    setIsOpen(false);
  };

  const hasResults = result.notes.length > 0 || result.folders.length > 0;

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-notion-gray dark:text-notion-dark-gray" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search notes and folders..."
          className="w-full pl-10 pr-10 py-2 bg-notion-sidebar dark:bg-notion-dark-sidebar border border-notion-border dark:border-notion-dark-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-notion-text dark:text-notion-dark-text transition-theme"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-notion-gray dark:text-notion-dark-gray hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
        {loading && query && (
          <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-notion-gray dark:text-notion-dark-gray animate-spin" />
        )}
      </div>

      {isOpen && query && !loading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-notion-dark-input border border-notion-border dark:border-notion-dark-border rounded-xl shadow-lg z-50 overflow-hidden max-h-96 overflow-y-auto">
          {!hasResults ? (
            <div className="px-4 py-8 text-center text-notion-gray dark:text-notion-dark-gray">
              <Search size={32} className="mx-auto mb-2 opacity-50" />
              <p>No results found for "{query}"</p>
            </div>
          ) : (
            <>
              {result.folders.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-notion-gray dark:text-notion-dark-gray uppercase tracking-wider bg-gray-50 dark:bg-notion-dark-sidebar">
                    Folders ({result.folders.length})
                  </div>
                  {result.folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => handleFolderClick(folder.id)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-notion-hover dark:hover:bg-notion-dark-hover transition-colors text-left"
                    >
                      <Folder size={16} className="text-blue-500" />
                      <span className="text-sm font-medium text-notion-text dark:text-notion-dark-text">{folder.name}</span>
                    </button>
                  ))}
                </div>
              )}
              
              {result.notes.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-notion-gray dark:text-notion-dark-gray uppercase tracking-wider bg-gray-50 dark:bg-notion-dark-sidebar border-t border-notion-border dark:border-notion-dark-border">
                    Notes ({result.notes.length})
                  </div>
                  {result.notes.map((note) => (
                    <button
                      key={note.id}
                      onClick={() => handleNoteClick(note.id)}
                      className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-notion-hover dark:hover:bg-notion-dark-hover transition-colors text-left"
                    >
                      <FileText size={16} className="text-notion-gray dark:text-notion-dark-gray mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-notion-text dark:text-notion-dark-text truncate">{note.title}</p>
                        <p className="text-xs text-notion-gray dark:text-notion-dark-gray truncate">
                          in {note.folder_name}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
