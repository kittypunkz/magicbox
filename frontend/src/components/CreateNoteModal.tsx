import { useState, useRef, useEffect } from 'react';
import { X, FileText, Hash } from 'lucide-react';

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
  onCreateNote: (title: string, content: string, folderName: string | null) => void;
  defaultFolderName?: string;
}

export function CreateNoteModal({ 
  isOpen, 
  onClose, 
  onCreateNote,
  defaultFolderName 
}: CreateNoteModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setContent('');
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

  // Extract hashtag from text
  const extractFolderName = (text: string): { folderName: string | null; cleanText: string } => {
    const hashMatch = text.match(/#([\w.-]+)/);
    if (hashMatch) {
      const folderName = hashMatch[1];
      // Remove the hashtag from text
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
          <div>
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
              placeholder="Note title... #work"
              className={`w-full px-4 py-2.5 ${c.input} border ${c.border} rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${c.text}`}
            />
          </div>

          {/* Content Input */}
          <div>
            <label className={`block text-sm font-medium ${c.gray} mb-2`}>
              <span className="flex items-center gap-2">
                Content
                <span className={`text-xs ${c.gray} font-normal`}>
                  (or use #foldername here)
                </span>
              </span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind? #ideas"
              rows={4}
              className={`w-full px-4 py-2.5 ${c.input} border ${c.border} rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${c.text} resize-none`}
            />
          </div>

          {/* Folder Hint */}
          <div className={`flex items-center gap-2 text-xs ${c.gray} bg-[#2a2a2a] px-3 py-2 rounded-lg`}>
            <Hash size={12} className="text-blue-500" />
            <span>
              Type <code className="text-blue-400">#foldername</code> in title or content to organize. 
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
