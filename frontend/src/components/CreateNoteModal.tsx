import { useState, useRef, useEffect } from 'react';
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
  onCreateNote: (title: string, content: string, folderId: number) => void;
  initialFolderId?: number | null;
}

export function CreateNoteModal({ 
  isOpen, 
  onClose, 
  folders, 
  onCreateNote,
  initialFolderId 
}: CreateNoteModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<number>(initialFolderId || 1);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setContent('');
      setSelectedFolderId(initialFolderId || 1);
      // Focus title input after modal opens
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [isOpen, initialFolderId]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;
    
    const noteTitle = title.trim() || 'Untitled';
    onCreateNote(noteTitle, content.trim(), selectedFolderId);
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
              Title
            </label>
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title..."
              className={`w-full px-4 py-2.5 ${c.input} border ${c.border} rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${c.text}`}
            />
          </div>

          {/* Content Input */}
          <div>
            <label className={`block text-sm font-medium ${c.gray} mb-2`}>
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={4}
              className={`w-full px-4 py-2.5 ${c.input} border ${c.border} rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${c.text} resize-none`}
            />
          </div>

          {/* Folder Selection */}
          <div>
            <label className={`block text-sm font-medium ${c.gray} mb-2`}>
              <span className="flex items-center gap-2">
                <Hash size={14} />
                Folder
              </span>
            </label>
            <div className={`max-h-40 overflow-y-auto rounded-lg border ${c.border}`}>
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => setSelectedFolderId(folder.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    selectedFolderId === folder.id 
                      ? 'bg-blue-900/30 border-l-2 border-blue-500' 
                      : c.hover
                  }`}
                >
                  <div className={`w-4 h-4 rounded border ${selectedFolderId === folder.id ? 'bg-blue-500 border-blue-500' : `border-[#6b6b6b]`} flex items-center justify-center`}>
                    {selectedFolderId === folder.id && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm ${selectedFolderId === folder.id ? c.text : c.gray}`}>
                    {folder.name}
                  </span>
                  {folder.id === 1 && (
                    <span className={`ml-auto text-xs ${c.gray}`}>default</span>
                  )}
                </button>
              ))}
            </div>
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
