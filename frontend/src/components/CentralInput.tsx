import { useState, useRef, useEffect } from 'react';
import { Hash, FileText, CornerDownLeft, X } from 'lucide-react';
import type { Folder } from '../types';

interface CentralInputProps {
  folders: Folder[];
  onCreateNote: (title: string, folderId: number) => void;
}

export function CentralInput({ folders, onCreateNote }: CentralInputProps) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<number>(1);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const hashtagMatch = input.slice(0, cursorPosition).match(/#([\w]*)$/);
  const searchTerm = hashtagMatch ? hashtagMatch[1].toLowerCase() : '';
  
  const filteredFolders = searchTerm
    ? folders.filter((f) => f.name.toLowerCase().includes(searchTerm))
    : folders;

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
    
    setTimeout(() => {
      inputRef.current?.focus();
      const newPos = before.length + folder.name.length + 2;
      inputRef.current?.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const cleanTitle = input.replace(/#\w+/g, '').trim() || 'Untitled';
    onCreateNote(cleanTitle, selectedFolderId);
    setInput('');
    setSelectedFolderId(1);
  };

  const beforeCursor = input.slice(0, cursorPosition);
  const afterHash = beforeCursor.match(/#([\w]*)$/);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <FileText size={20} className="absolute left-4 text-notion-gray dark:text-notion-dark-gray" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Type a note... Use #folder to organize"
            className="w-full pl-12 pr-12 py-4 text-lg bg-white dark:bg-notion-dark-input border border-notion-border dark:border-notion-dark-border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-notion-text dark:text-notion-dark-text"
          />
          {input && (
            <button
              type="button"
              onClick={() => setInput('')}
              className="absolute right-14 p-1 text-notion-gray dark:text-notion-dark-gray hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
          <button
            type="submit"
            disabled={!input.trim()}
            className="absolute right-4 p-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:bg-notion-gray disabled:cursor-not-allowed transition-colors"
          >
            <CornerDownLeft size={18} />
          </button>
        </div>

        {afterHash && showSuggestions && filteredFolders.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-notion-dark-input border border-notion-border dark:border-notion-dark-border rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="px-3 py-2 text-xs font-medium text-notion-gray dark:text-notion-dark-gray bg-gray-50 dark:bg-notion-dark-sidebar border-b border-notion-border dark:border-notion-dark-border">
              Select folder
            </div>
            {filteredFolders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                onClick={() => handleFolderSelect(folder)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-notion-hover dark:hover:bg-notion-dark-hover transition-colors ${
                  folder.id === selectedFolderId ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <Hash size={16} className="text-blue-500" />
                <span className="text-sm font-medium text-notion-text dark:text-notion-dark-text">{folder.name}</span>
                {folder.id === 1 && (
                  <span className="ml-auto text-xs text-notion-gray dark:text-notion-dark-gray">default</span>
                )}
              </button>
            ))}
          </div>
        )}
      </form>

      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-notion-gray dark:text-notion-dark-gray">
        <span className="flex items-center gap-1">
          <Hash size={12} />
          Type # to mention folder
        </span>
        <span>•</span>
        <span>Press Enter to create</span>
      </div>
    </div>
  );
}
