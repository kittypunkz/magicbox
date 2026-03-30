import { useState, useRef, useEffect } from 'react';
import { Folder, Search, X, Check } from 'lucide-react';
import type { Folder as FolderType } from '../types';

const c = {
  bg: 'bg-[#191919]',
  sidebar: 'bg-[#202020]',
  hover: 'hover:bg-[#2a2a2a]',
  text: 'text-[#e6e6e6]',
  gray: 'text-[#6b6b6b]',
  border: 'border-[#2f2f2f]',
  input: 'bg-[#2a2a2a]',
};

interface MoveToFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: FolderType[];
  currentFolderId: number;
  onMove: (folderId: number) => void;
}

export function MoveToFolderModal({ isOpen, onClose, folders, currentFolderId, onMove }: MoveToFolderModalProps) {
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = folders.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`${c.sidebar} border ${c.border} rounded-xl w-full max-w-sm max-h-[60vh] overflow-hidden`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${c.border}`}>
          <h2 className={`text-lg font-semibold ${c.text}`}>Move to folder</h2>
          <button onClick={onClose} className={`${c.gray} hover:${c.text} transition-colors`}>
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${c.gray}`} />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search folders..."
              className={`w-full pl-10 pr-4 py-2 ${c.input} border ${c.border} rounded-lg ${c.text} text-sm outline-none focus:border-blue-500`}
            />
          </div>
        </div>

        {/* Folder List */}
        <div className="overflow-y-auto max-h-[40vh] pb-2">
          {filtered.map((folder) => (
            <button
              key={folder.id}
              onClick={() => {
                onMove(folder.id);
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left ${c.hover} transition-colors ${
                folder.id === currentFolderId ? 'bg-blue-500/10' : ''
              }`}
            >
              <Folder size={18} className={folder.id === currentFolderId ? 'text-blue-400' : c.gray} />
              <span className={`flex-1 text-sm ${folder.id === currentFolderId ? 'text-blue-400' : c.text}`}>
                {folder.name}
              </span>
              {folder.id === currentFolderId && (
                <Check size={16} className="text-blue-400" />
              )}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className={`text-center py-6 text-sm ${c.gray}`}>No folders found</p>
          )}
        </div>
      </div>
    </div>
  );
}
