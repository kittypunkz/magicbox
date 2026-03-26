import { useState, useEffect, useRef } from 'react';
import { Search, X, FileText, Folder as FolderIcon } from 'lucide-react';
import { searchAPI } from '../api/client';
import type { Note, Folder } from '../types';

interface SearchBarProps {
  onNoteClick: (id: number) => void;
  onFolderClick: (id: number) => void;
}

export function SearchBar({ onNoteClick, onFolderClick }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ notes: Note[]; folders: Folder[] }>({ notes: [], folders: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults({ notes: [], folders: [] });
      setShowDropdown(false);
      return;
    }

    setShowDropdown(true);
    setIsSearching(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const result = await searchAPI.search(query);
        setResults({ notes: result.data || [], folders: result.folders || [] });
      } catch {
        setResults({ notes: [], folders: [] });
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer.current);
  }, [query]);

  const handleNoteClick = (id: number) => {
    onNoteClick(id);
    setQuery('');
    setShowDropdown(false);
  };

  const handleFolderClick = (id: number) => {
    onFolderClick(id);
    setQuery('');
    setShowDropdown(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b6b] z-10" />
      <input
        type="text"
        placeholder="Search notes..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.trim() && setShowDropdown(true)}
        className="w-full lg:w-64 bg-[#202020] text-[#e6e6e6] text-sm rounded-lg pl-10 pr-4 py-2.5 border border-[#2f2f2f] placeholder-[#6b6b6b] focus:outline-none focus:border-blue-500"
      />
      {query && (
        <button
          onClick={() => { setQuery(''); setShowDropdown(false); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b6b] hover:text-[#e6e6e6]"
        >
          <X size={14} />
        </button>
      )}

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#202020] border border-[#2f2f2f] rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
          {isSearching && <div className="px-4 py-3 text-sm text-[#6b6b6b]">Searching...</div>}

          {!isSearching && results.folders.length > 0 && (
            <div className="px-2 py-1">
              <div className="px-2 py-1 text-xs text-[#6b6b6b] uppercase">Folders</div>
              {results.folders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => handleFolderClick(folder.id)}
                  className="w-full text-left px-3 py-2 text-sm text-[#e6e6e6] hover:bg-[#2a2a2a] rounded flex items-center gap-2"
                >
                  <FolderIcon size={14} className="text-[#6b6b6b]" />
                  {folder.name}
                </button>
              ))}
            </div>
          )}

          {!isSearching && results.notes.length > 0 && (
            <div className="px-2 py-1">
              <div className="px-2 py-1 text-xs text-[#6b6b6b] uppercase">Notes</div>
              {results.notes.map(note => (
                <button
                  key={note.id}
                  onClick={() => handleNoteClick(note.id)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-[#2a2a2a] rounded"
                >
                  <div className="flex items-center gap-2">
                    {note.bookmark_url ? (
                      <span className="text-emerald-500 text-xs">🔗</span>
                    ) : (
                      <FileText size={14} className="text-[#6b6b6b]" />
                    )}
                    <span className="text-[#e6e6e6] truncate">{note.title}</span>
                  </div>
                  {note.folder_name && (
                    <span className="text-xs text-[#4b5563] ml-6">{note.folder_name}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {!isSearching && results.notes.length === 0 && results.folders.length === 0 && query.trim() && (
            <div className="px-4 py-3 text-sm text-[#6b6b6b]">No results found</div>
          )}
        </div>
      )}
    </div>
  );
}
