import { useState, useRef, useEffect, useMemo } from 'react';
import { X, FileText, Hash } from 'lucide-react';
import type { Folder } from '../types';

// Dark mode colors
const c = {
  overlay: 'bg-black/60',
  modal: 'bg-[#202020]',
  input: 'bg-[#2a2a2a]',
  text: 'text-[#e6e6e6]',
  gray: 'text-[#6b6b6b]',
  border: 'border-[#2f2f2f]',
  hover: 'hover:bg-[#3a3a3a]',
  primary: 'bg-blue-600 hover:bg-blue-700',
  secondary: 'bg-[#2a2a2a] hover:bg-[#3a3a3a]',
};

interface CreateNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: Folder[];
  onCreateNote: (title: string, content: string, folderName: string | null) => void;
  defaultFolderName?: string;
}

export function CreateNoteModal({ 
  isOpen, 
  onClose, 
  folders,
  onCreateNote,
  defaultFolderName 
}: CreateNoteModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [activeInput, setActiveInput] = useState<'title' | 'content'>('title');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const contentInputRef = useRef<HTMLTextAreaElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setContent('');
      setHighlightedIndex(0);
      setActiveInput('title');
      // Focus title input after modal opens
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Get hashtag at cursor position
  const getHashtagAtCursor = (text: string, pos: number): { match: RegExpMatchArray | null; searchTerm: string } => {
    const textBeforeCursor = text.slice(0, pos);
    const match = textBeforeCursor.match(/#([\w.-]*)$/);
    return { 
      match, 
      searchTerm: match ? match[1].toLowerCase() : '' 
    };
  };

  // Get current active text and cursor position
  const getActiveTextInfo = () => {
    if (activeInput === 'title') {
      return { text: title, cursor: titleInputRef.current?.selectionStart || 0 };
    }
    return { text: content, cursor: contentInputRef.current?.selectionStart || 0 };
  };

  const { text: activeText, cursor: activeCursor } = getActiveTextInfo();
  const { match: hashtagMatch, searchTerm } = getHashtagAtCursor(activeText, activeCursor);

  // Filter folders based on search term
  const filteredFolders = useMemo(() => {
    if (!hashtagMatch) return [];
    return folders.filter(f => 
      f.name.toLowerCase().includes(searchTerm)
    );
  }, [hashtagMatch, searchTerm, folders]);

  // Check if we should show suggestions
  const showSuggestions = hashtagMatch !== null;

  // Handle folder selection
  const handleFolderSelect = (folder: Folder) => {
    const inputRef = activeInput === 'title' ? titleInputRef : contentInputRef;
    const currentText = activeInput === 'title' ? title : content;
    const pos = inputRef.current?.selectionStart || 0;
    
    // Find the hashtag position
    const textBeforeCursor = currentText.slice(0, pos);
    const match = textBeforeCursor.match(/#([\w.-]*)$/);
    
    if (match) {
      const before = currentText.slice(0, match.index);
      const after = currentText.slice(pos);
      // Add space after folder name so user can continue typing
      const newText = `${before}#${folder.name} ${after}`;
      
      if (activeInput === 'title') {
        setTitle(newText);
      } else {
        setContent(newText);
      }
      
      // Focus back and set cursor position (after the space)
      setTimeout(() => {
        inputRef.current?.focus();
        const newPos = (match.index || 0) + folder.name.length + 2; // +2 for # and space
        inputRef.current?.setSelectionRange(newPos, newPos);
      }, 0);
    }
    
    // Reset to hide dropdown
    setHighlightedIndex(0);
  };

  // Handle keyboard navigation for suggestions
  const handleKeyDown = (e: React.KeyboardEvent, inputType: 'title' | 'content') => {
    setActiveInput(inputType);
    
    if (!showSuggestions || filteredFolders.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredFolders.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Tab':
        e.preventDefault();
        // Tab always selects the first matching folder or creates new if exact match
        if (filteredFolders.length > 0) {
          // If there's an exact match with search term, use that
          const exactMatch = filteredFolders.find(f => 
            f.name.toLowerCase() === searchTerm.toLowerCase()
          );
          handleFolderSelect(exactMatch || filteredFolders[0]);
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredFolders[highlightedIndex]) {
          handleFolderSelect(filteredFolders[highlightedIndex]);
        }
        break;
      case 'Escape':
        // Just clear the highlight, don't close modal
        setHighlightedIndex(0);
        break;
    }
  };

  // Extract hashtag from text
  const extractFolderName = (text: string): { folderName: string | null; cleanText: string } => {
    const hashMatch = text.match(/#([\w.-]+)/);
    if (hashMatch) {
      const folderName = hashMatch[1];
      const cleanText = text.replace(/#[\w.-]+/, '').trim();
      return { folderName, cleanText };
    }
    return { folderName: null, cleanText: text };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;
    
    // Try to extract folder from title first, then content
    const titleResult = extractFolderName(title);
    const contentResult = extractFolderName(content);
    
    // Use folder from title if found, otherwise from content, otherwise default
    const folderName = titleResult.folderName || contentResult.folderName || defaultFolderName || null;
    
    // Use cleaned text
    const cleanTitle = titleResult.cleanText || 'Untitled';
    const cleanContent = titleResult.folderName ? content : contentResult.cleanText;
    
    onCreateNote(cleanTitle, cleanContent, folderName);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      data-area-id="create-note-modal"
      className={`create-note-modal fixed inset-0 z-50 flex items-center justify-center ${c.overlay} backdrop-blur-sm`}
      onClick={handleBackdropClick}
    >
      <div 
        data-area-id="create-note-modal-content"
        className={`create-note-modal-content w-full max-w-lg ${c.modal} rounded-xl shadow-2xl border ${c.border} overflow-hidden`}
      >
        {/* Header */}
        <div 
          data-area-id="create-note-modal-header"
          className={`create-note-modal-header flex items-center justify-between px-6 py-4 border-b ${c.border}`}
        >
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-blue-500" />
            <h2 className={`text-lg font-semibold ${c.text}`}>Create New Note</h2>
          </div>
          <button
            data-area-id="create-note-modal-close"
            onClick={onClose}
            className={`p-2 rounded-lg ${c.hover} transition-colors`}
          >
            <X size={18} className={c.gray} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title Input */}
          <div className="relative">
            <label className={`block text-sm font-medium ${c.gray} mb-2`}>
              <span className="flex items-center gap-2">
                Title
                <span className={`text-xs ${c.gray} font-normal`}>
                  (use #foldername to organize)
                </span>
              </span>
            </label>
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'title')}
              onFocus={() => setActiveInput('title')}

              placeholder="Note title... #work"
              className={`w-full px-4 py-2.5 ${c.input} border ${c.border} rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${c.text}`}
            />
          </div>

          {/* Content Input */}
          <div className="relative">
            <label className={`block text-sm font-medium ${c.gray} mb-2`}>
              <span className="flex items-center gap-2">
                Content
                <span className={`text-xs ${c.gray} font-normal`}>
                  (or use #foldername here)
                </span>
              </span>
            </label>
            <textarea
              ref={contentInputRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'content')}
              onFocus={() => setActiveInput('content')}

              placeholder="What's on your mind? #ideas"
              rows={4}
              className={`w-full px-4 py-2.5 ${c.input} border ${c.border} rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${c.text} resize-none`}
            />
          </div>

          {/* Folder Suggestions Dropdown */}
          {showSuggestions && filteredFolders.length > 0 && (
            <div 
              data-area-id="create-note-folder-suggestions"
              className={`${c.input} border ${c.border} rounded-lg overflow-hidden`}
            >
              <div className={`px-3 py-2 text-xs font-medium ${c.gray} bg-[#202020] border-b ${c.border}`}>
                {searchTerm ? `Folders matching "${searchTerm}"` : 'Select folder (Enter or Tab to select, ↑↓ to navigate)'}
              </div>
              <div className="max-h-40 overflow-y-auto">
                {filteredFolders.map((folder, index) => (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => handleFolderSelect(folder)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      index === highlightedIndex ? 'bg-blue-900/20' : c.hover
                    }`}
                  >
                    <Hash size={16} className="text-blue-500" />
                    <span className={`text-sm ${c.text}`}>{folder.name}</span>
                    {folder.id === 1 && (
                      <span className={`ml-auto text-xs ${c.gray}`}>default</span>
                    )}
                    {index === highlightedIndex && (
                      <span className="ml-auto text-xs text-blue-400">Enter</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Create New Folder Option */}
          {showSuggestions && searchTerm && !filteredFolders.find(f => f.name.toLowerCase() === searchTerm.toLowerCase()) && (
            <div className={`flex items-center gap-2 text-xs ${c.gray} px-3 py-2 bg-blue-900/10 rounded-lg`}>
              <Hash size={12} className="text-blue-500" />
              <span>
                Will create new folder: <span className="text-blue-400 font-medium">#{searchTerm}</span>
              </span>
            </div>
          )}

          {/* Folder Hint */}
          <div className={`flex items-center gap-2 text-xs ${c.gray} bg-[#2a2a2a] px-3 py-2 rounded-lg`}>
            <Hash size={12} className="text-blue-500" />
            <span>
              Type <code className="text-blue-400">#foldername</code> to organize. 
              If folder doesn't exist, it will be created automatically.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2f2f2f]">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-sm font-medium ${c.gray} ${c.secondary} rounded-lg transition-colors`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() && !content.trim()}
              className={`px-4 py-2 text-sm font-medium text-white ${c.primary} rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Create Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
