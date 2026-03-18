import { useState, useRef, useEffect } from 'react';
import { X, Hash, ChevronDown } from 'lucide-react';
import type { Note, Folder } from '../types';

interface CreateNoteModalProps {
  folders: Folder[];
  initialFolderId?: number;
  editingNote?: Note;
  onClose: () => void;
  onNoteCreated: (note: Note) => void;

}

const c = {
  overlay: 'bg-black/70 backdrop-blur-sm',
  bg: 'bg-[#202020]',
  text: 'text-[#e6e6e6]',
  gray: 'text-[#6b6b6b]',
  border: 'border-[#2f2f2f]',
  primary: 'text-blue-500',
  input: 'bg-[#2f2f2f] text-[#e6e6e6] placeholder-[#6b6b6b]',
  button: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700',
};

// Hashtag autocomplete logic
function getHashtagAtCursor(text: string, cursorPosition: number): { match: RegExpMatchArray; searchTerm: string } | null {
  const textBeforeCursor = text.slice(0, cursorPosition);
  const hashtagMatch = textBeforeCursor.match(/#([\w\s.-]*)$/);
  
  if (hashtagMatch) {
    return {
      match: hashtagMatch,
      searchTerm: hashtagMatch[1].toLowerCase().trim()
    };
  }
  return null;
}

export function CreateNoteModal({ 
  folders, 
  initialFolderId,
  editingNote, 
  onClose, 
  onNoteCreated
}: CreateNoteModalProps) {
  const [title, setTitle] = useState(editingNote?.title ?? '');
  const [content, setContent] = useState(editingNote?.content ?? '');
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(
    editingNote?.folder_id ?? initialFolderId ?? null
  );
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);
  
  // Hashtag autocomplete state
  const [hashtagSuggestions, setHashtagSuggestions] = useState<Folder[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [activeHashtag, setActiveHashtag] = useState<{ start: number; end: number; searchTerm: string } | null>(null);
  
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const isEditing = !!editingNote;

  // Focus title on mount
  useEffect(() => {
    setTimeout(() => titleRef.current?.focus(), 100);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowFolderDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle hashtag input
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const cursorPosition = e.target.selectionStart;
    setContent(newContent);
    
    const hashtag = getHashtagAtCursor(newContent, cursorPosition);
    if (hashtag) {
      const filtered = folders.filter(f => 
        f.name.toLowerCase().includes(hashtag.searchTerm)
      );
      setHashtagSuggestions(filtered);
      setActiveHashtag({
        start: cursorPosition - hashtag.match[0].length,
        end: cursorPosition,
        searchTerm: hashtag.match[0]
      });
      setSelectedSuggestionIndex(0);
    } else {
      setHashtagSuggestions([]);
      setActiveHashtag(null);
    }
  };

  // Select hashtag suggestion
  const selectHashtag = (folder: Folder) => {
    if (!activeHashtag || !contentRef.current) return;
    
    const before = content.slice(0, activeHashtag.start);
    const after = content.slice(activeHashtag.end);
    const newContent = `${before}#${folder.name} ${after}`;
    
    setContent(newContent);
    setSelectedFolderId(folder.id);
    setHashtagSuggestions([]);
    setActiveHashtag(null);
    
    // Restore cursor position after hashtag
    setTimeout(() => {
      const newPosition = activeHashtag.start + folder.name.length + 2;
      contentRef.current?.setSelectionRange(newPosition, newPosition);
      contentRef.current?.focus();
    }, 0);
  };

  // Handle keyboard navigation for hashtags
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (hashtagSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < hashtagSuggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : 0);
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        selectHashtag(hashtagSuggestions[selectedSuggestionIndex]);
      } else if (e.key === 'Escape') {
        setHashtagSuggestions([]);
        setActiveHashtag(null);
      }
    } else if (e.key === 'Enter' && e.metaKey) {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSubmit = () => {
    if (!title.trim() && !content.trim()) {
      onClose();
      return;
    }

    const noteData: Partial<Note> = {
      title: title.trim() || 'Untitled',
      content: content.trim(),
      folder_id: selectedFolderId ?? undefined,
      updated_at: new Date().toISOString(),
    };

    if (isEditing && editingNote) {
      onNoteCreated({ ...editingNote, ...noteData } as Note);
    } else {
      onNoteCreated({
        id: Date.now(),
        ...noteData,
        created_at: new Date().toISOString(),
      } as Note);
    }
    onClose();
  };

  // Get selected folder name
  const selectedFolderName = selectedFolderId 
    ? folders.find(f => f.id === selectedFolderId)?.name ?? 'Select Folder'
    : 'No Folder';

  // Scroll selected suggestion into view
  useEffect(() => {
    if (suggestionsRef.current && hashtagSuggestions.length > 0) {
      const selected = suggestionsRef.current.children[selectedSuggestionIndex] as HTMLElement;
      selected?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedSuggestionIndex, hashtagSuggestions.length]);

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center ${c.overlay}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        className={`
          ${c.bg} w-full sm:w-[600px] sm:rounded-xl
          rounded-t-xl sm:rounded-t-xl
          max-h-[90vh] sm:max-h-[80vh]
          flex flex-col
          shadow-2xl
        `}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-4 sm:px-6 py-4 border-b ${c.border}`}>
          <h2 className={`text-lg font-semibold ${c.text}`}>
            {isEditing ? 'Edit Note' : 'Create Note'}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 ${c.gray} hover:text-[#e6e6e6] active:scale-95 transition-all rounded-lg hover:bg-[#2f2f2f]`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Title Input */}
          <input
            ref={titleRef}
            type="text"
            placeholder="Note title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`
              w-full text-xl sm:text-2xl font-semibold 
              bg-transparent ${c.text} placeholder-[#4b4b4b]
              outline-none
            `}
          />

          {/* Folder Selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowFolderDropdown(!showFolderDropdown)}
              className={`
                w-full sm:w-auto flex items-center gap-2 px-3 py-2 
                ${c.input} rounded-lg text-sm
                active:scale-[0.98] transition-transform
              `}
            >
              <Hash size={16} className={c.primary} />
              <span className={selectedFolderId ? c.text : c.gray}>
                {selectedFolderName}
              </span>
              <ChevronDown size={14} className={`${c.gray} transition-transform ${showFolderDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showFolderDropdown && (
              <div className={`
                absolute left-0 top-full mt-1 w-full sm:w-64
                ${c.bg} border ${c.border} rounded-lg shadow-lg py-1 z-50
                max-h-48 overflow-y-auto
              `}>
                <button
                  onClick={() => {
                    setSelectedFolderId(null);
                    setShowFolderDropdown(false);
                  }}
                  className={`
                    w-full px-3 py-2.5 text-left text-sm ${c.gray} hover:bg-[#2f2f2f]
                    transition-colors
                    ${selectedFolderId === null ? 'bg-[#2f2f2f]' : ''}
                  `}
                >
                  No Folder
                </button>
                {folders.map(folder => (
                  <button
                    key={folder.id}
                    onClick={() => {
                      setSelectedFolderId(folder.id);
                      setShowFolderDropdown(false);
                    }}
                    className={`
                      w-full px-3 py-2.5 text-left text-sm ${c.text} hover:bg-[#2f2f2f]
                      transition-colors
                      ${selectedFolderId === folder.id ? 'bg-[#2f2f2f]' : ''}
                    `}
                  >
                    #{folder.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content Input with Hashtag Suggestions */}
          <div className="relative">
            <textarea
              ref={contentRef}
              placeholder="Start typing... Use # to tag a folder"
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              rows={8}
              className={`
                w-full ${c.input} rounded-lg px-4 py-3 
                text-sm sm:text-base leading-relaxed
                outline-none focus:ring-2 focus:ring-blue-500/20 resize-none
                min-h-[150px] sm:min-h-[200px]
              `}
            />

            {/* Hashtag Suggestions */}
            {hashtagSuggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className={`
                  absolute left-0 right-0 sm:right-auto sm:w-64
                  ${c.bg} border ${c.border} rounded-lg shadow-lg 
                  mt-1 max-h-40 overflow-y-auto z-50
                `}
              >
                {hashtagSuggestions.map((folder, index) => (
                  <button
                    key={folder.id}
                    onClick={() => selectHashtag(folder)}
                    className={`
                      w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm
                      ${index === selectedSuggestionIndex ? 'bg-blue-500/20 text-blue-400' : `${c.text} hover:bg-[#2f2f2f]`}
                      transition-colors
                    `}
                  >
                    <Hash size={14} />
                    {folder.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-3 px-4 sm:px-6 py-4 border-t ${c.border}`}>
          <button
            onClick={onClose}
            className={`
              px-4 py-2.5 rounded-lg text-sm font-medium
              ${c.gray} hover:text-[#e6e6e6] hover:bg-[#2f2f2f]
              active:scale-95 transition-all
            `}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={`
              px-6 py-2.5 rounded-lg text-sm font-medium text-white
              ${c.button}
              active:scale-95 transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            disabled={!title.trim() && !content.trim()}
          >
            {isEditing ? 'Save Changes' : 'Create Note'}
          </button>
        </div>
      </div>
    </div>
  );
}
