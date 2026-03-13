import { useState, useRef, useEffect } from 'react';
import { Hash, FileText, CornerDownLeft, X } from 'lucide-react';
import type { Folder } from '../types';

// Dark mode colors
const c = {
  bg: 'bg-[#191919]',
  input: 'bg-[#2a2a2a]',
  text: 'text-[#e6e6e6]',
  gray: 'text-[#6b6b6b]',
  border: 'border-[#2f2f2f]',
  hover: 'hover:bg-[#3a3a3a]',
};

interface CentralInputProps {
  folders: Folder[];
  onCreateNote: (title: string, folderId: number) => void;
}

export function CentralInput({ folders, onCreateNote }: CentralInputProps) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<number>(1);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const hashtagMatch = input.slice(0, cursorPosition).match(/#([\w]*)$/);
  const searchTerm = hashtagMatch ? hashtagMatch[1].toLowerCase() : '';
  
  const filteredFolders = searchTerm
    ? folders.filter((f) => f.name.toLowerCase().includes(searchTerm))
    : folders;

  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchTerm]);

  useEffect(() => {
    const inputEl = inputRef.current;
    if (!inputEl) return;

    const handleSelectionChange = () => {
      setCursorPosition(inputEl.selectionStart || 0);
    };

    inputEl.addEventListener('keyup', handleSelectionChange);
    inputEl.addEventListener('click', handleSelectionChange);
    
    return () => {
      inputEl.removeEventListener('keyup', handleSelectionChange);
      inputEl.removeEventListener('click', handleSelectionChange);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const pos = e.target.selectionStart || 0;
    setInput(value);
    setCursorPosition(pos);
    setShowSuggestions(value.includes('#'));
  };

  const handleFolderSelect = (folder: Folder) => {
    if (!hashtagMatch) return;
    
    const before = input.slice(0, hashtagMatch.index);
    const after = input.slice(cursorPosition);
    const newInput = `${before}#${folder.name} ${after}`;
    setInput(newInput);
    setSelectedFolderId(folder.id);
    setShowSuggestions(false);
    setHighlightedIndex(0);
    
    setTimeout(() => {
      inputRef.current?.focus();
      const newPos = before.length + folder.name.length + 2;
      inputRef.current?.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredFolders.length === 0) return;

    switch (e.key) {
      case 'Tab':
        e.preventDefault();
        const selectedFolder = filteredFolders[highlightedIndex];
        if (selectedFolder) {
          handleFolderSelect(selectedFolder);
        }
        break;
      
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev < filteredFolders.length - 1 ? prev + 1 : prev
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      
      case 'Escape':
        setShowSuggestions(false);
        setHighlightedIndex(0);
        break;
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const cleanTitle = input.replace(/#\w+/g, '').trim() || 'Untitled';
    onCreateNote(cleanTitle, selectedFolderId);
    setInput('');
    setSelectedFolderId(1);
    setHighlightedIndex(0);
  };

  const beforeCursor = input.slice(0, cursorPosition);
  const afterHash = beforeCursor.match(/#([\w]*)$/);

  return (
    <div 
      data-area-id="central-input"
      className="central-input w-full max-w-2xl mx-auto"
    >
      <form onSubmit={handleSubmit} className="central-input-form relative">
        <div className="central-input-wrapper relative flex items-center">
          <FileText size={20} className={`absolute left-4 ${c.gray}`} />
          <input
            ref={inputRef}
            data-area-id="central-input-field"
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a note... Use #folder to organize"
            className={`central-input-field w-full pl-12 pr-12 py-4 text-lg ${c.input} border ${c.border} rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${c.text}`}
          />
          {input && (
            <button
              data-area-id="central-input-clear"
              type="button"
              onClick={() => setInput('')}
              className={`central-input-clear-btn absolute right-14 p-1 ${c.gray} hover:text-gray-400`}
            >
              <X size={18} />
            </button>
          )}
          <button
            data-area-id="central-input-submit"
            type="submit"
            disabled={!input.trim()}
            className="central-input-submit-btn absolute right-4 p-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:bg-[#4b5563] disabled:cursor-not-allowed transition-colors"
          >
            <CornerDownLeft size={18} />
          </button>
        </div>

        {/* Folder Suggestions */}
        {afterHash && showSuggestions && filteredFolders.length > 0 && (
          <div 
            data-area-id="central-input-suggestions"
            className={`central-input-suggestions absolute top-full left-0 right-0 mt-2 ${c.input} border ${c.border} rounded-xl shadow-lg z-50 overflow-hidden`}
          >
            <div className={`central-input-suggestions-header px-3 py-2 text-xs font-medium ${c.gray} bg-[#202020] border-b ${c.border}`}>
              Select folder (Tab to select, ↑↓ to navigate)
            </div>
            {filteredFolders.map((folder, index) => (
              <button
                key={folder.id}
                type="button"
                onClick={() => handleFolderSelect(folder)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`central-input-suggestion-item w-full flex items-center gap-3 px-4 py-2.5 transition-colors ${
                  index === highlightedIndex ? 'bg-blue-900/20' : c.hover
                }`}
              >
                <Hash size={16} className="text-blue-500" />
                <span className={`text-sm font-medium ${c.text}`}>{folder.name}</span>
                {folder.id === 1 && (
                  <span className={`ml-auto text-xs ${c.gray}`}>default</span>
                )}
                {index === highlightedIndex && (
                  <span className="ml-auto text-xs text-blue-400 font-medium">Tab</span>
                )}
              </button>
            ))}
          </div>
        )}
      </form>

      <div className={`central-input-hints flex items-center justify-center gap-4 mt-3 text-xs ${c.gray}`}>
        <span className="flex items-center gap-1">
          <Hash size={12} />
          Type # to mention folder
        </span>
        <span>•</span>
        <span>Press Tab to select</span>
        <span>•</span>
        <span>Enter to create</span>
      </div>
    </div>
  );
}
