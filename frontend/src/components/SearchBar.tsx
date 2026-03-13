import { useState } from 'react';
import { Search, X, FileText, Folder, Loader2 } from 'lucide-react';
import { useSearch } from '../hooks/useSearch';

// Dark mode colors
const c = {
  bg: 'bg-[#191919]',
  sidebar: 'bg-[#202020]',
  hover: 'hover:bg-[#2a2a2a]',
  text: 'text-[#e6e6e6]',
  gray: 'text-[#6b6b6b]',
  border: 'border-[#2f2f2f]',
  input: 'bg-[#2a2a2a]',
};

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
    <div 
      data-area-id="searchbar"
      className="searchbar relative w-full max-w-md"
    >
      <div className="searchbar-input-wrapper relative">
        <Search size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${c.gray}`} />
        <input
          data-area-id="searchbar-input"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search notes and folders..."
          className={`searchbar-input w-full pl-10 pr-10 py-2 ${c.sidebar} border ${c.border} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${c.text}`}
        />
        {query && (
          <button
            data-area-id="searchbar-clear"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className={`searchbar-clear-btn absolute right-3 top-1/2 -translate-y-1/2 ${c.gray} hover:text-gray-400`}
          >
            <X size={16} />
          </button>
        )}
        {loading && query && (
          <Loader2 size={16} className={`searchbar-loading absolute right-3 top-1/2 -translate-y-1/2 ${c.gray} animate-spin`} />
        )}
      </div>

      {/* Search Results */}
      {isOpen && query && !loading && (
        <div 
          data-area-id="searchbar-results"
          className={`searchbar-results absolute top-full left-0 right-0 mt-2 ${c.input} border ${c.border} rounded-xl shadow-lg z-50 overflow-hidden max-h-96 overflow-y-auto`}
        >
          {!hasResults ? (
            <div className={`searchbar-results-empty px-4 py-8 text-center ${c.gray}`}>
              <Search size={32} className="mx-auto mb-2 opacity-50" />
              <p>No results found for "{query}"</p>
            </div>
          ) : (
            <>
              {/* Folder Results */}
              {result.folders.length > 0 && (
                <div data-area-id="searchbar-results-folders" className="searchbar-results-folders">
                  <div className={`px-3 py-2 text-xs font-semibold ${c.gray} uppercase tracking-wider bg-[#202020]`}>
                    Folders ({result.folders.length})
                  </div>
                  {result.folders.map((folder) => (
                    <button
                      key={folder.id}
                      data-area-id={`searchbar-result-folder-${folder.id}`}
                      onClick={() => handleFolderClick(folder.id)}
                      className="searchbar-result-item w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#2a2a2a] transition-colors text-left"
                    >
                      <Folder size={16} className="text-blue-500" />
                      <span className={`text-sm font-medium ${c.text}`}>{folder.name}</span>
                    </button>
                  ))}
                </div>
              )}
              
              {/* Note Results */}
              {result.notes.length > 0 && (
                <div data-area-id="searchbar-results-notes" className="searchbar-results-notes">
                  <div className={`px-3 py-2 text-xs font-semibold ${c.gray} uppercase tracking-wider bg-[#202020] border-t ${c.border}`}>
                    Notes ({result.notes.length})
                  </div>
                  {result.notes.map((note) => (
                    <button
                      key={note.id}
                      data-area-id={`searchbar-result-note-${note.id}`}
                      onClick={() => handleNoteClick(note.id)}
                      className="searchbar-result-item w-full flex items-start gap-3 px-4 py-2.5 hover:bg-[#2a2a2a] transition-colors text-left"
                    >
                      <FileText size={16} className={`${c.gray} mt-0.5 shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${c.text} truncate`}>{note.title}</p>
                        <p className={`text-xs ${c.gray} truncate`}>
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

      {/* Backdrop */}
      {isOpen && (
        <div
          className="searchbar-backdrop fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
