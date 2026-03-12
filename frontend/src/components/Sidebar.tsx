import { useState } from 'react';
import { Folder, Plus, Trash2, Edit2, Check, X, Inbox, Github } from 'lucide-react';
import { useFolders } from '../hooks/useFolders';

interface SidebarProps {
  selectedFolderId: number | null;
  onSelectFolder: (id: number | null) => void;
  onShowAllNotes: () => void;
}

export function Sidebar({ selectedFolderId, onSelectFolder, onShowAllNotes }: SidebarProps) {
  const { folders, loading, createFolder, updateFolder, deleteFolder } = useFolders();
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleCreate = async () => {
    if (!newFolderName.trim()) return;
    await createFolder(newFolderName.trim());
    setNewFolderName('');
    setIsCreating(false);
  };

  const handleUpdate = async (id: number) => {
    if (!editingName.trim()) return;
    await updateFolder(id, editingName.trim());
    setEditingId(null);
    setEditingName('');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this folder? Notes will be deleted too.')) return;
    await deleteFolder(id);
    if (selectedFolderId === id) {
      onShowAllNotes();
    }
  };

  return (
    <aside className="w-64 bg-notion-sidebar dark:bg-notion-dark-sidebar h-screen flex flex-col border-r border-notion-border dark:border-notion-dark-border transition-theme">
      <div className="p-4">
        <button
          onClick={onShowAllNotes}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
            selectedFolderId === null
              ? 'bg-notion-hover dark:bg-notion-dark-hover'
              : 'hover:bg-notion-hover dark:hover:bg-notion-dark-hover'
          }`}
        >
          <Inbox size={18} className="text-notion-gray dark:text-notion-dark-gray" />
          <span className="font-medium text-notion-text dark:text-notion-dark-text">All Notes</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-xs font-semibold text-notion-gray dark:text-notion-dark-gray uppercase tracking-wider">
            Folders
          </span>
          <button
            onClick={() => setIsCreating(true)}
            className="p-1 hover:bg-notion-hover dark:hover:bg-notion-dark-hover rounded transition-colors"
            title="New folder"
          >
            <Plus size={16} className="text-notion-gray dark:text-notion-dark-gray" />
          </button>
        </div>

        {isCreating && (
          <div className="px-2 py-1">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-white dark:bg-notion-dark-input rounded-md border border-notion-border dark:border-notion-dark-border">
              <Folder size={16} className="text-notion-gray dark:text-notion-dark-gray" />
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
                className="flex-1 text-sm bg-transparent outline-none text-notion-text dark:text-notion-dark-text"
              />
              <button onClick={handleCreate} className="text-green-600 hover:text-green-700">
                <Check size={14} />
              </button>
              <button onClick={() => setIsCreating(false)} className="text-notion-gray hover:text-red-500">
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="px-4 py-2 text-sm text-notion-gray dark:text-notion-dark-gray">Loading...</div>
        ) : (
          folders.map((folder) => (
            <div key={folder.id} className="px-2 py-0.5 group">
              {editingId === folder.id ? (
                <div className="flex items-center gap-2 px-2 py-1.5 bg-white dark:bg-notion-dark-input rounded-md border border-notion-border dark:border-notion-dark-border">
                  <Folder size={16} className="text-notion-gray dark:text-notion-dark-gray" />
                  <input
                    autoFocus
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdate(folder.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="flex-1 text-sm bg-transparent outline-none text-notion-text dark:text-notion-dark-text"
                  />
                  <button onClick={() => handleUpdate(folder.id)} className="text-green-600">
                    <Check size={14} />
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-notion-gray hover:text-red-500">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onSelectFolder(folder.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
                    selectedFolderId === folder.id
                      ? 'bg-notion-hover dark:bg-notion-dark-hover'
                      : 'hover:bg-notion-hover dark:hover:bg-notion-dark-hover'
                  }`}
                >
                  <Folder size={16} className={selectedFolderId === folder.id ? 'text-blue-500' : 'text-notion-gray dark:text-notion-dark-gray'} />
                  <span className="flex-1 text-sm text-left truncate text-notion-text dark:text-notion-dark-text">{folder.name}</span>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(folder.id);
                        setEditingName(folder.name);
                      }}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    >
                      <Edit2 size={12} className="text-notion-gray dark:text-notion-dark-gray" />
                    </button>
                    {folder.id !== 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(folder.id);
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                      >
                        <Trash2 size={12} className="text-red-400 hover:text-red-500" />
                      </button>
                    )}
                  </div>
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Version Footer */}
      <div className="p-4 border-t border-notion-border dark:border-notion-dark-border bg-notion-sidebar dark:bg-notion-dark-sidebar">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-notion-text dark:text-notion-dark-text">MagicBox</span>
            <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
              v1.0.0
            </span>
          </div>
          <a 
            href="https://github.com/kittypunkz/magicbox" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-notion-gray dark:text-notion-dark-gray hover:text-blue-500 transition-colors"
          >
            <Github size={12} />
            <span>GitHub</span>
          </a>
        </div>
        <p className="text-[10px] text-notion-gray dark:text-notion-dark-gray mt-1 opacity-70">
          {folders.length} folder{folders.length !== 1 ? 's' : ''}
        </p>
      </div>
    </aside>
  );
}
