import { useState, useEffect, useCallback } from 'react';
import { Plus, Folder, FileText, X, MoreHorizontal, Pencil, Trash2, Home, Settings } from 'lucide-react';

import type { Folder as FolderType, Note } from '../types';
import { SkeletonFolderItem } from './Skeleton';

interface SidebarProps {
  folders: FolderType[];
  recentNotes: Note[];
  onFolderClick: (folderId: number) => void;
  onNoteClick: (note: Note) => void;
  onCreateNote: () => void;
  onCreateFolder: (name: string) => Promise<FolderType>;
  onFolderEdit: (folder: FolderType) => void;
  onFolderDelete: (folderId: number) => void;
  editingFolder: FolderType | null;
  onFolderUpdate: (id: number, name: string) => void;
  onCancelEdit: () => void;
  loading: boolean;
  currentView: 'home' | 'folder' | 'note' | 'settings';
  selectedFolderId: number | null;
  onCloseMobile?: () => void;
  isMobile?: boolean;
  onSettingsClick?: () => void;
}

const c = {
  bg: 'bg-[#202020]',
  text: 'text-[#e6e6e6]',
  gray: 'text-[#6b6b6b]',
  border: 'border-[#2f2f2f]',
  hover: 'hover:bg-[#2f2f2f]',
  primary: 'text-blue-500',
  active: 'bg-[#2f2f2f] text-blue-500',
};

export function Sidebar({
  folders,
  recentNotes,
  onFolderClick,
  onNoteClick,
  onCreateNote,
  onCreateFolder,
  onFolderEdit,
  onFolderDelete,
  editingFolder,
  onFolderUpdate,
  onCancelEdit,
  loading,
  currentView,
  selectedFolderId,
  onCloseMobile,
  isMobile,
  onSettingsClick,
}: SidebarProps) {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingName, setEditingName] = useState('');
  const [folderDropdownOpen, setFolderDropdownOpen] = useState<number | null>(null);

  // Update editing name when editingFolder changes
  useEffect(() => {
    if (editingFolder) {
      setEditingName(editingFolder.name);
    }
  }, [editingFolder]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setFolderDropdownOpen(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) return;
    try {
      await onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreatingFolder(false);
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  }, [newFolderName, onCreateFolder]);

  const handleFolderUpdate = useCallback(() => {
    if (!editingName.trim() || !editingFolder) return;
    onFolderUpdate(editingFolder.id, editingName.trim());
    setEditingName('');
  }, [editingName, editingFolder, onFolderUpdate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isCreatingFolder) {
        handleCreateFolder();
      } else if (editingFolder) {
        handleFolderUpdate();
      }
    } else if (e.key === 'Escape') {
      if (isCreatingFolder) {
        setIsCreatingFolder(false);
        setNewFolderName('');
      } else if (editingFolder) {
        onCancelEdit();
        setEditingName('');
      }
    }
  }, [isCreatingFolder, editingFolder, handleCreateFolder, handleFolderUpdate, onCancelEdit]);

  const handleFolderClick = useCallback((folder: FolderType) => {
    onFolderClick(folder.id);
    if (isMobile && onCloseMobile) {
      onCloseMobile();
    }
  }, [onFolderClick, isMobile, onCloseMobile]);

  const handleHomeClick = useCallback(() => {
    // Navigate to home by calling onFolderClick with null or using window.location
    window.location.href = '/';
    if (isMobile && onCloseMobile) {
      onCloseMobile();
    }
  }, [isMobile, onCloseMobile]);

  const FolderDropdown = ({ folder }: { folder: FolderType }) => (
    <div 
      className="absolute right-0 top-full mt-1 w-36 bg-[#202020] border border-[#2f2f2f] rounded-lg shadow-lg py-1 z-50"
      onClick={e => e.stopPropagation()}
    >
      <button
        onClick={() => {
          onFolderEdit(folder);
          setFolderDropdownOpen(null);
        }}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#e6e6e6] hover:bg-[#2f2f2f]"
      >
        <Pencil size={14} />
        Rename
      </button>
      <button
        onClick={() => {
          onFolderDelete(folder.id);
          setFolderDropdownOpen(null);
        }}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-[#2f2f2f]"
      >
        <Trash2 size={14} />
        Delete
      </button>
    </div>
  );

  return (
    <div className={`h-full ${c.bg} border-r ${c.border} flex flex-col`}>
      {/* Mobile Header */}
      {isMobile && (
        <div className="flex items-center justify-between p-4 border-b border-[#2f2f2f]">
          <h2 className="text-lg font-semibold text-[#e6e6e6]">Menu</h2>
          <button 
            onClick={onCloseMobile}
            className="p-2 text-[#6b6b6b] hover:text-[#e6e6e6]"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* New Note Button */}
      <div className="p-3">
        <button
          onClick={onCreateNote}
          className={`
            w-full flex items-center justify-center gap-2 px-4 py-3 
            bg-blue-500 hover:bg-blue-600 active:bg-blue-700
            text-white rounded-lg font-medium text-sm
            transition-colors active:scale-[0.98] transform
            shadow-lg shadow-blue-500/20
          `}
        >
          <Plus size={18} />
          <span>New Note</span>
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2 space-y-4">
        {/* All Notes */}
        <div className="px-2">
          <button
            onClick={handleHomeClick}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
              transition-colors min-h-[44px]
              ${currentView === 'home' && !selectedFolderId ? c.active : `${c.text} ${c.hover}`}
            `}
          >
            <Home size={18} />
            <span className="flex-1 text-left">All Notes</span>
          </button>
        </div>

        {/* Folders Section */}
        <div>
          <div className="flex items-center justify-between px-4 mb-2">
            <h3 className={`text-xs font-semibold uppercase tracking-wider ${c.gray}`}>
              Folders
            </h3>
            <button
              onClick={() => setIsCreatingFolder(true)}
              className={`p-1.5 rounded ${c.gray} hover:text-[#e6e6e6] hover:bg-[#2f2f2f] active:scale-95 transition-all`}
              title="New Folder"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="px-2 space-y-1">
            {loading ? (
              <><SkeletonFolderItem /><SkeletonFolderItem /><SkeletonFolderItem /><SkeletonFolderItem /><SkeletonFolderItem /></>
            ) : (
              <>
                {/* Create Folder Input */}
                {isCreatingFolder && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#2f2f2f]">
                    <Folder size={16} className={c.gray} />
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onBlur={() => {
                        if (!newFolderName.trim()) {
                          setIsCreatingFolder(false);
                        }
                      }}
                      placeholder="Folder name"
                      className="flex-1 bg-transparent text-sm text-[#e6e6e6] placeholder-[#6b6b6b] outline-none"
                      autoFocus
                    />
                  </div>
                )}

                {/* Folder List */}
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="group relative"
                  >
                    {editingFolder?.id === folder.id ? (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#2f2f2f]">
                        <Folder size={16} className={c.primary} />
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={handleKeyDown}
                          onBlur={handleFolderUpdate}
                          className="flex-1 bg-transparent text-sm text-[#e6e6e6] outline-none"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => handleFolderClick(folder)}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                          transition-colors min-h-[44px]
                          ${selectedFolderId === folder.id ? c.active : `${c.text} ${c.hover}`}
                        `}
                      >
                        <Folder size={16} className={selectedFolderId === folder.id ? c.primary : c.gray} />
                        <span className="flex-1 text-left truncate">{folder.name}</span>
                        
                        {/* Dropdown Toggle */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFolderDropdownOpen(folderDropdownOpen === folder.id ? null : folder.id);
                          }}
                          className={`
                            p-1.5 rounded opacity-0 group-hover:opacity-100
                            ${selectedFolderId === folder.id ? 'opacity-100' : ''}
                            hover:bg-[#3f3f3f] transition-opacity
                          `}
                        >
                          <MoreHorizontal size={14} className={c.gray} />
                        </button>
                      </button>
                    )}
                    
                    {folderDropdownOpen === folder.id && <FolderDropdown folder={folder} />}
                  </div>
                ))}

                {folders.length === 0 && !isCreatingFolder && (
                  <div className={`px-3 py-4 text-center ${c.gray} text-sm`}>
                    No folders yet
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Recent Notes */}
        <div>
          <h3 className={`text-xs font-semibold uppercase tracking-wider ${c.gray} px-4 mb-2`}>
            Recent
          </h3>
          <div className="px-2 space-y-1">
            {loading ? (
              <><SkeletonFolderItem /><SkeletonFolderItem /><SkeletonFolderItem /></>
            ) : (
              recentNotes.slice(0, 5).map((note) => (
                <button
                  key={note.id}
                  onClick={() => onNoteClick(note)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                    ${c.text} ${c.hover} transition-colors min-h-[44px]
                  `}
                >
                  <FileText size={16} className={c.gray} />
                  <span className="flex-1 text-left truncate">
                    {note.title || 'Untitled'}
                  </span>
                </button>
              ))
            )}
            
            {recentNotes.length === 0 && !loading && (
              <div className={`px-3 py-4 text-center ${c.gray} text-sm`}>
                No recent notes
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={`p-4 border-t ${c.border} space-y-2`}>
        {/* Settings Button */}
        {onSettingsClick && (
          <button
            onClick={() => {
              onSettingsClick();
              if (isMobile && onCloseMobile) onCloseMobile();
            }}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
              transition-colors min-h-[44px]
              ${currentView === 'settings' ? c.active : `${c.gray} ${c.hover} hover:text-[#e6e6e6]`}
            `}
          >
            <Settings size={16} />
            <span className="flex-1 text-left">Settings</span>
          </button>
        )}
        <div className={`text-xs ${c.gray} text-center`}>
          {folders.length} folder{folders.length !== 1 ? 's' : ''} · {recentNotes.length} recent
        </div>
      </div>
    </div>
  );
}
