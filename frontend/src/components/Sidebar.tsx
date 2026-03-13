import { useState } from 'react';
import { Folder, Plus, Trash2, Edit2, Check, X, Inbox, Github } from 'lucide-react';
import { RecentNotes } from './RecentNotes';
import type { Folder as FolderType, Note } from '../types';

// Dark mode colors
const c = {
  sidebar: 'bg-[#202020]',
  hover: 'hover:bg-[#2a2a2a]',
  text: 'text-[#e6e6e6]',
  gray: 'text-[#6b6b6b]',
  border: 'border-[#2f2f2f]',
  input: 'bg-[#2a2a2a]',
};

interface SidebarProps {
  folders: FolderType[];
  loading: boolean;
  selectedFolderId: number | null;
  onSelectFolder: (id: number | null) => void;
  onShowAllNotes: () => void;
  onSelectNote?: (note: Note) => void;
  onCreateFolder: (name: string) => Promise<FolderType>;
  onUpdateFolder: (id: number, name: string) => Promise<void>;
  onDeleteFolder: (id: number) => Promise<void>;
}

export function Sidebar({ 
  folders, 
  loading, 
  selectedFolderId, 
  onSelectFolder, 
  onShowAllNotes, 
  onSelectNote,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder
}: SidebarProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleCreate = async () => {
    if (!newFolderName.trim()) return;
    await onCreateFolder(newFolderName.trim());
    setNewFolderName('');
    setIsCreating(false);
  };

  const handleUpdate = async (id: number) => {
    if (!editingName.trim()) return;
    await onUpdateFolder(id, editingName.trim());
    setEditingId(null);
    setEditingName('');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this folder? Notes will be deleted too.')) return;
    await onDeleteFolder(id);
    if (selectedFolderId === id) {
      onShowAllNotes();
    }
  };

  return (
    <aside 
      data-area-id="sidebar"
      className={`sidebar w-64 ${c.sidebar} h-screen flex flex-col border-r ${c.border}`}
    >
      {/* All Notes Button */}
      <div className="p-4">
        <button
          data-area-id="sidebar-all-notes"
          onClick={onShowAllNotes}
          className={`sidebar-all-notes-btn w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
            selectedFolderId === null ? 'bg-[#2a2a2a]' : c.hover
          }`}
        >
          <Inbox size={18} className={c.gray} />
          <span className={`font-medium ${c.text}`}>All Notes</span>
        </button>
      </div>

      {/* Folders Section */}
      <div 
        data-area-id="sidebar-folders-section"
        className="sidebar-folders-section flex-1 overflow-y-auto px-2"
      >
        <div 
          data-area-id="sidebar-folders-header"
          className="sidebar-folders-header flex items-center justify-between px-3 py-2"
        >
          <span className={`text-xs font-semibold ${c.gray} uppercase tracking-wider`}>
            Folders
          </span>
          <button
            data-area-id="sidebar-new-folder-btn"
            onClick={() => setIsCreating(true)}
            className={`sidebar-new-folder-btn p-1 ${c.hover} rounded transition-colors`}
            title="New folder"
          >
            <Plus size={16} className={c.gray} />
          </button>
        </div>

        {/* New Folder Input */}
        {isCreating && (
          <div className="px-2 py-1">
            <div 
              data-area-id="sidebar-new-folder-input"
              className={`sidebar-new-folder-input flex items-center gap-2 px-2 py-1.5 ${c.input} rounded-md border ${c.border}`}
            >
              <Folder size={16} className={c.gray} />
              <input
                autoFocus
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                  if (e.key === 'Escape') setIsCreating(false);
                }}
                placeholder="Folder name"
                className={`flex-1 text-sm bg-transparent outline-none ${c.text}`}
              />
              <button onClick={handleCreate} className="text-green-600 hover:text-green-700">
                <Check size={14} />
              </button>
              <button onClick={() => setIsCreating(false)} className="text-[#6b6b6b] hover:text-red-500">
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Folder List */}
        {loading ? (
          <div className={`sidebar-folder-list-loading px-4 py-2 text-sm ${c.gray}`}>Loading...</div>
        ) : (
          <div className="sidebar-folder-list">
            {folders.map((folder) => (
              <div 
                key={folder.id} 
                data-area-id={`sidebar-folder-${folder.id}`}
                className="sidebar-folder-item px-2 py-0.5 group"
              >
                {editingId === folder.id ? (
                  <div className={`flex items-center gap-2 px-2 py-1.5 ${c.input} rounded-md border ${c.border}`}>
                    <Folder size={16} className={c.gray} />
                    <input
                      autoFocus
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdate(folder.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className={`flex-1 text-sm bg-transparent outline-none ${c.text}`}
                    />
                    <button onClick={() => handleUpdate(folder.id)} className="text-green-600">
                      <Check size={14} />
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-[#6b6b6b] hover:text-red-500">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => onSelectFolder(folder.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                      selectedFolderId === folder.id ? 'bg-[#2a2a2a]' : c.hover
                    }`}
                  >
                    <Folder size={16} className={selectedFolderId === folder.id ? 'text-blue-500' : c.gray} />
                    <span className={`flex-1 text-sm text-left truncate ${c.text}`}>{folder.name}</span>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        data-area-id={`sidebar-folder-edit-${folder.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(folder.id);
                          setEditingName(folder.name);
                        }}
                        className="sidebar-folder-edit-btn p-1 hover:bg-[#3a3a3a] rounded"
                      >
                        <Edit2 size={12} className={c.gray} />
                      </button>
                      {folder.id !== 1 && (
                        <button
                          data-area-id={`sidebar-folder-delete-${folder.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(folder.id);
                          }}
                          className="sidebar-folder-delete-btn p-1 hover:bg-[#3a3a3a] rounded"
                        >
                          <Trash2 size={12} className="text-red-400 hover:text-red-500" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Notes */}
      {onSelectNote && (
        <div data-area-id="sidebar-recent-section" className="sidebar-recent-section">
          <RecentNotes onSelectNote={onSelectNote} />
        </div>
      )}

      {/* Version Footer */}
      <footer 
        data-area-id="sidebar-footer"
        className={`sidebar-footer p-4 border-t ${c.border} ${c.sidebar}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${c.text}`}>MagicBox</span>
            <span className="px-1.5 py-0.5 text-[10px] bg-blue-900/30 text-blue-400 rounded-full">
              v1.1.0
            </span>
          </div>
          <a 
            href="https://github.com/kittypunkz/magicbox" 
            target="_blank" 
            rel="noopener noreferrer"
            className={`flex items-center gap-1 text-xs ${c.gray} hover:text-blue-500 transition-colors`}
          >
            <Github size={12} />
            <span>GitHub</span>
          </a>
        </div>
        <p className={`text-[10px] ${c.gray} mt-1 opacity-70`}>
          {folders.length} folder{folders.length !== 1 ? 's' : ''}
        </p>
      </footer>
    </aside>
  );
}
