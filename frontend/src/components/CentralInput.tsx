import { useState, useRef, useEffect } from 'react';
import { Hash, CornerDownLeft, X } from 'lucide-react';
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
  onCreateNote: (title: string, content: string, folderId: number) => void;
}

export function CentralInput({ folders, onCreateNote }: CentralInputProps) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<number>(1);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || filteredFolders.length === 0) {
      // Allow Enter to submit when no suggestions
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
      return;
    }

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
      
      case 'Enter':
        e.preventDefault();
        handleSubmit();
        break;
    }
  };

  const handleSubmit = () => {
    if (!input.trim()) return;

    // Extract folder hashtag
    const hashTag = input.match(/#(\w+)/);
    let targetFolderId = selectedFolderId;
    let cleanContent = input;
    
    if (hashTag) {
      const folderName = hashTag[1];
      const existingFolder = folders.find(
        (f) => f.name.toLowerCase() === folderName.toLowerCase()
      );
      if (existingFolder) {
        targetFolderId = existingFolder.id;
      }
      // Remove hashtag from content
      cleanContent = input.replace(/#\w+/g, '').trim();
    }

    // Auto-generate title from first line (first 50 chars)
    const firstLine = cleanContent.split('\n')[0].slice(0, 50);
    const title = firstLine || 'Untitled';

    onCreateNote(title, cleanContent, targetFolderId);
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
      <div className="central-input-wrapper relative">
        <textarea
          ref={inputRef}
          data-area-id="central-input-field"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="What's on your mind? Use #folder to organize"
          rows={3}
          className={`central-input-field w-full px-4 py-4 text-lg ${c.input} border ${c.border} rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${c.text} resize-none`}
        />
        
        {/* Clear button */}
        {input && (
          <button
            data-area-id="central-input-clear"
            onClick={() => setInput('')}
            className={`central-input-clear-btn absolute top-3 right-14 p-1 ${c.gray} hover:text-gray-400 transition-colors`}
          >
            <X size={18} />
          </button>
        )}
        
        {/* Submit button */}
        <button
          data-area-id="central-input-submit"
          onClick={handleSubmit}
          disabled={!input.trim()}
          className="central-input-submit-btn absolute bottom-3 right-3 p-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:bg-[#4b5563] disabled:cursor-not-allowed transition-colors"
        >
          <CornerDownLeft size={18} />
        </button>

        {/* Folder Suggestions */}
        {afterHash && showSuggestions && filteredFolders.length > 0 && (
          <div 
            data-area-id="central-input-suggestions"
            className={`central-input-suggestions absolute top-full left-0 right-0 mt-2 ${c.input} border ${c.border} rounded-xl shadow-lg z-50 overflow-hidden`}
          >
            <div className={`central-input-suggestions-header px-3 py-2 text-xs font-medium ${c.gray} bg-[#202020] border-b ${c.border}`}>
              Select folder (Tab to select, ↑↓ to navigate, Enter to create)
            </div>
            {filteredFolders.map((folder, index) => (
              <button
                key={folder.id}
                type="button"
                onClick={() => handleFolderSelect(folder)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`central-input-suggestion-item w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${
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
      </div>

      <div className={`central-input-hints flex items-center justify-center gap-4 mt-3 text-xs ${c.gray}`}>
        <span className="flex items-center gap-1">
          <Hash size={12} />
          Type # to add to folder
        </span>
        <span>•</span>
        <span>Enter to create note</span>
      </div>
    </div>
  );
}
