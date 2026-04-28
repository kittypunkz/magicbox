import { useState, useEffect, useCallback } from 'react';
import { Plus, Folder, FileText, X, MoreHorizontal, Pencil, Trash2, Home, Settings, CheckSquare, MessageSquare, Bookmark, Newspaper, ChevronRight } from 'lucide-react';
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
  currentView: 'home' | 'folder' | 'note' | 'settings' | 'tasks' | 'ask' | 'brief' | 'bookmarks';
  selectedFolderId: number | null;
  onCloseMobile?: () => void;
  isMobile?: boolean;
  onSettingsClick?: () => void;
  onTasksClick?: () => void;
  onAskClick?: () => void;
  onBriefClick?: () => void;
  onBookmarksClick?: () => void;
}

const bg = 'bg-[#1a1a1a]';
const text = 'text-[#e6e6e6]';
const gray = 'text-[#888888]';
const border = 'border-[#2a2a2a]';
const hover = 'hover:bg-[#242424]';
const active = 'bg-[#242424] text-[#faff69]';
const primary = 'text-[#faff69]';

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
  onTasksClick,
  onAskClick,
  onBriefClick,
  onBookmarksClick,
}: SidebarProps) {
  const [expanded, setExpanded] = useState(() => localStorage.getItem('sidebar-expanded') === 'true');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingName, setEditingName] = useState('');
  const [folderDropdownOpen, setFolderDropdownOpen] = useState<number | null>(null);

  useEffect(() => {
    if (editingFolder) setEditingName(editingFolder.name);
  }, [editingFolder]);

  useEffect(() => {
    const handleClick = () => setFolderDropdownOpen(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) return;
    try {
      await onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreatingFolder(false);
    } catch {}
  }, [newFolderName, onCreateFolder]);

  const handleFolderUpdate = useCallback(() => {
    if (!editingName.trim() || !editingFolder) return;
    onFolderUpdate(editingFolder.id, editingName.trim());
    setEditingName('');
  }, [editingName, editingFolder, onFolderUpdate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isCreatingFolder) handleCreateFolder();
      else if (editingFolder) handleFolderUpdate();
    } else if (e.key === 'Escape') {
      if (isCreatingFolder) { setIsCreatingFolder(false); setNewFolderName(''); }
      else if (editingFolder) { onCancelEdit(); setEditingName(''); }
    }
  }, [isCreatingFolder, editingFolder, handleCreateFolder, handleFolderUpdate, onCancelEdit]);

  const handleFolderClick = useCallback((folder: FolderType) => {
    onFolderClick(folder.id);
    if (isMobile && onCloseMobile) onCloseMobile();
  }, [onFolderClick, isMobile, onCloseMobile]);

  // Mobile: full-width drawer, Desktop: icon rail
  if (isMobile) {
    return (
      <div className={`h-full ${bg} border-r ${border} flex flex-col`}>
        <div className={`flex items-center justify-between p-4 border-b ${border}`}>
          <h2 className={`text-lg font-semibold ${text}`}>Menu</h2>
          <button onClick={onCloseMobile} className={`p-2 ${gray} hover:${text}`}>
            <X size={20} />
          </button>
        </div>
        <MobileContent
          folders={folders}
          recentNotes={recentNotes}
          currentView={currentView}
          selectedFolderId={selectedFolderId}
          loading={loading}
          isCreatingFolder={isCreatingFolder}
          newFolderName={newFolderName}
          editingFolder={editingFolder}
          editingName={editingName}
          folderDropdownOpen={folderDropdownOpen}
          onCreateNote={() => { onCreateNote(); onCloseMobile?.(); }}
          onHomeClick={() => { window.location.href = '/'; onCloseMobile?.(); }}
          onTasksClick={() => { onTasksClick?.(); onCloseMobile?.(); }}
          onAskClick={() => { onAskClick?.(); onCloseMobile?.(); }}
          onBriefClick={() => { onBriefClick?.(); onCloseMobile?.(); }}
          onBookmarksClick={() => { onBookmarksClick?.(); onCloseMobile?.(); }}
          onSettingsClick={() => { onSettingsClick?.(); onCloseMobile?.(); }}
          onFolderClick={handleFolderClick}
          onNoteClick={(n) => { onNoteClick(n); onCloseMobile?.(); }}
          onStartCreateFolder={() => setIsCreatingFolder(true)}
          onNewFolderNameChange={setNewFolderName}
          onKeyDown={handleKeyDown}
          onEditingNameChange={setEditingName}
          onFolderUpdateBlur={handleFolderUpdate}
          onFolderEdit={onFolderEdit}
          onFolderDelete={onFolderDelete}
          setFolderDropdownOpen={setFolderDropdownOpen}
        />
      </div>
    );
  }

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    localStorage.setItem('sidebar-expanded', String(next));
    if (!next) setFolderDropdownOpen(null);
  };

  // Desktop: icon rail
  return (
    <div className={`h-full ${bg} border-r ${border} flex flex-col transition-all duration-200 ${expanded ? 'w-[220px]' : 'w-[48px]'}`}>
      {/* Top nav icons */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* New Note */}
        <NavItem
          icon={<Plus size={18} />}
          label="New Note"
          expanded={expanded}
          onClick={onCreateNote}
          isActive={false}
        />

        {/* Brief */}
        <NavItem
          icon={<Newspaper size={18} />}
          label="Daily Brief"
          expanded={expanded}
          onClick={() => onBriefClick?.()}
          isActive={currentView === 'brief'}
        />

        {/* All Notes */}
        <NavItem
          icon={<Home size={18} />}
          label="Notes"
          expanded={expanded}
          onClick={() => { window.location.href = '/'; }}
          isActive={currentView === 'home' && !selectedFolderId}
        />

        {/* Bookmarks */}
        <NavItem
          icon={<Bookmark size={18} />}
          label="Bookmarks"
          expanded={expanded}
          onClick={() => onBookmarksClick?.()}
          isActive={currentView === 'bookmarks'}
        />

        {/* Tasks */}
        <NavItem
          icon={<CheckSquare size={18} />}
          label="Tasks"
          expanded={expanded}
          onClick={() => onTasksClick?.()}
          isActive={currentView === 'tasks'}
        />

        {/* Ask */}
        <NavItem
          icon={<MessageSquare size={18} />}
          label="Ask"
          expanded={expanded}
          onClick={() => onAskClick?.()}
          isActive={currentView === 'ask'}
        />

        {/* Expanded: folder tree */}
        {expanded && (
          <div className="mt-4">
            <div className="flex items-center justify-between px-3 mb-1">
              <span className={`text-xs font-semibold uppercase tracking-wider ${gray}`}>Folders</span>
              <button
                onClick={() => setIsCreatingFolder(true)}
                className={`p-1 rounded ${gray} hover:${text} hover:bg-[#242424] transition-colors`}
              >
                <Plus size={12} />
              </button>
            </div>
            <div className="px-1.5 space-y-0.5">
              {loading ? (
                <><SkeletonFolderItem /><SkeletonFolderItem /></>
              ) : (
                <>
                  {isCreatingFolder && (
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[#2a2a2a]">
                      <Folder size={14} className={gray} />
                      <input
                        type="text"
                        value={newFolderName}
                        onChange={e => setNewFolderName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={() => { if (!newFolderName.trim()) setIsCreatingFolder(false); }}
                        placeholder="Folder name"
                        className="flex-1 bg-transparent text-xs text-[#e6e6e6] placeholder-[#888888] outline-none"
                        autoFocus
                      />
                    </div>
                  )}
                  {folders.map(folder => (
                    <div key={folder.id} className="group relative">
                      {editingFolder?.id === folder.id ? (
                        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[#2a2a2a]">
                          <Folder size={14} className={primary} />
                          <input
                            type="text"
                            value={editingName}
                            onChange={e => setEditingName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={handleFolderUpdate}
                            className="flex-1 bg-transparent text-xs text-[#e6e6e6] outline-none"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => handleFolderClick(folder)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                            selectedFolderId === folder.id ? active : `${text} ${hover}`
                          }`}
                        >
                          <Folder size={14} className={selectedFolderId === folder.id ? primary : gray} />
                          <span className="flex-1 text-left truncate">{folder.name}</span>
                          <button
                            onClick={e => { e.stopPropagation(); setFolderDropdownOpen(folderDropdownOpen === folder.id ? null : folder.id); }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[#3a3a3a]"
                          >
                            <MoreHorizontal size={12} className={gray} />
                          </button>
                        </button>
                      )}
                      {folderDropdownOpen === folder.id && (
                        <FolderDropdown
                          folder={folder}
                          onEdit={() => { onFolderEdit(folder); setFolderDropdownOpen(null); }}
                          onDelete={() => { onFolderDelete(folder.id); setFolderDropdownOpen(null); }}
                        />
                      )}
                    </div>
                  ))}
                  {folders.length === 0 && !isCreatingFolder && (
                    <p className={`text-xs ${gray} px-2 py-2`}>No folders</p>
                  )}
                </>
              )}
            </div>

            {/* Recent Notes */}
            <div className="mt-4">
              <p className={`text-xs font-semibold uppercase tracking-wider ${gray} px-3 mb-1`}>Recent</p>
              <div className="px-1.5 space-y-0.5">
                {recentNotes.slice(0, 5).map(note => (
                  <button
                    key={note.id}
                    onClick={() => onNoteClick(note)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${text} ${hover} transition-colors`}
                  >
                    <FileText size={14} className={gray} />
                    <span className="flex-1 text-left truncate">{note.title || 'Untitled'}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings + collapse toggle at bottom */}
      <div className={`border-t ${border} py-1`}>
        <NavItem
          icon={<Settings size={18} />}
          label="Settings"
          expanded={expanded}
          onClick={() => onSettingsClick?.()}
          isActive={currentView === 'settings'}
        />
        <button
          onClick={toggle}
          title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          className={`w-full flex items-center px-3 py-2.5 transition-colors ${gray} hover:text-[#e6e6e6] hover:bg-[#242424]`}
        >
          <ChevronRight
            size={18}
            className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          />
          {expanded && <span className="ml-3 text-sm">Collapse</span>}
        </button>
      </div>
    </div>
  );
}

function NavItem({
  icon,
  label,
  expanded,
  onClick,
  isActive,
}: {
  icon: React.ReactNode;
  label: string;
  expanded: boolean;
  onClick: () => void;
  isActive: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={!expanded ? label : undefined}
      className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors min-h-[44px] ${
        isActive ? active : `${text} ${hover}`
      }`}
    >
      <span className="flex-shrink-0">{icon}</span>
      {expanded && <span className="text-sm truncate">{label}</span>}
    </button>
  );
}

function FolderDropdown({
  onEdit,
  onDelete,
}: {
  folder?: FolderType;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="absolute right-0 top-full mt-1 w-36 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-lg py-1 z-50"
      onClick={e => e.stopPropagation()}
    >
      <button
        onClick={onEdit}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#e6e6e6] hover:bg-[#242424]"
      >
        <Pencil size={14} />Rename
      </button>
      <button
        onClick={onDelete}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-[#242424]"
      >
        <Trash2 size={14} />Delete
      </button>
    </div>
  );
}

// Mobile drawer content — same as before
function MobileContent({
  folders, recentNotes, currentView, selectedFolderId, loading,
  isCreatingFolder, newFolderName, editingFolder, editingName, folderDropdownOpen,
  onCreateNote, onHomeClick, onTasksClick, onAskClick, onBriefClick, onBookmarksClick, onSettingsClick,
  onFolderClick, onNoteClick, onStartCreateFolder, onNewFolderNameChange,
  onKeyDown, onEditingNameChange, onFolderUpdateBlur, onFolderEdit, onFolderDelete,
  setFolderDropdownOpen,
}: {
  folders: FolderType[];
  recentNotes: Note[];
  currentView: string;
  selectedFolderId: number | null;
  loading: boolean;
  isCreatingFolder: boolean;
  newFolderName: string;
  editingFolder: FolderType | null;
  editingName: string;
  folderDropdownOpen: number | null;
  onCreateNote: () => void;
  onHomeClick: () => void;
  onTasksClick: () => void;
  onAskClick: () => void;
  onBriefClick: () => void;
  onBookmarksClick: () => void;
  onSettingsClick: () => void;
  onFolderClick: (f: FolderType) => void;
  onNoteClick: (n: Note) => void;
  onStartCreateFolder: () => void;
  onNewFolderNameChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onEditingNameChange: (v: string) => void;
  onFolderUpdateBlur: () => void;
  onFolderEdit: (f: FolderType) => void;
  onFolderDelete: (id: number) => void;
  setFolderDropdownOpen: (id: number | null) => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto py-2 space-y-1 px-2">
      <button
        onClick={onCreateNote}
        className="w-full flex items-center gap-3 px-3 py-2.5 mb-2 bg-[#faff69] hover:bg-[#e6eb52] text-[#0a0a0a] rounded-lg text-sm font-medium transition-colors"
      >
        <Plus size={18} /><span>New Note</span>
      </button>

      <button onClick={onBriefClick} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${currentView === 'brief' ? active : `${text} ${hover}`}`}>
        <Newspaper size={18} /><span className="flex-1 text-left">Daily Brief</span>
      </button>

      <button onClick={onHomeClick} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${currentView === 'home' && !selectedFolderId ? active : `${text} ${hover}`}`}>
        <Home size={18} /><span className="flex-1 text-left">Notes</span>
      </button>

      <button onClick={onBookmarksClick} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${currentView === 'bookmarks' ? active : `${text} ${hover}`}`}>
        <Bookmark size={18} /><span className="flex-1 text-left">Bookmarks</span>
      </button>

      <button onClick={onTasksClick} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${currentView === 'tasks' ? active : `${text} ${hover}`}`}>
        <CheckSquare size={18} /><span className="flex-1 text-left">Tasks</span>
      </button>

      <button onClick={onAskClick} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${currentView === 'ask' ? active : `${text} ${hover}`}`}>
        <MessageSquare size={18} /><span className="flex-1 text-left">Ask</span>
      </button>

      <div className="pt-2">
        <div className="flex items-center justify-between px-3 mb-1">
          <span className={`text-xs font-semibold uppercase tracking-wider ${gray}`}>Folders</span>
          <button onClick={onStartCreateFolder} className={`p-1 rounded ${gray} hover:${text}`}><Plus size={12} /></button>
        </div>
        <div className="space-y-0.5">
          {loading ? <><SkeletonFolderItem /><SkeletonFolderItem /></> : (
            <>
              {isCreatingFolder && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#2a2a2a]">
                  <Folder size={16} className={gray} />
                  <input type="text" value={newFolderName} onChange={e => onNewFolderNameChange(e.target.value)} onKeyDown={onKeyDown} onBlur={() => { if (!newFolderName.trim()) onNewFolderNameChange(''); }} placeholder="Folder name" className="flex-1 bg-transparent text-sm text-[#e6e6e6] placeholder-[#888888] outline-none" autoFocus />
                </div>
              )}
              {folders.map(folder => (
                <div key={folder.id} className="group relative">
                  {editingFolder?.id === folder.id ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#2a2a2a]">
                      <Folder size={16} className={primary} />
                      <input type="text" value={editingName} onChange={e => onEditingNameChange(e.target.value)} onKeyDown={onKeyDown} onBlur={onFolderUpdateBlur} className="flex-1 bg-transparent text-sm text-[#e6e6e6] outline-none" autoFocus />
                    </div>
                  ) : (
                    <button onClick={() => onFolderClick(folder)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors min-h-[44px] ${selectedFolderId === folder.id ? active : `${text} ${hover}`}`}>
                      <Folder size={16} className={selectedFolderId === folder.id ? primary : gray} />
                      <span className="flex-1 text-left truncate">{folder.name}</span>
                      <button onClick={e => { e.stopPropagation(); setFolderDropdownOpen(folderDropdownOpen === folder.id ? null : folder.id); }} className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-[#3a3a3a]">
                        <MoreHorizontal size={14} className={gray} />
                      </button>
                    </button>
                  )}
                  {folderDropdownOpen === folder.id && (
                    <FolderDropdown folder={folder} onEdit={() => { onFolderEdit(folder); setFolderDropdownOpen(null); }} onDelete={() => { onFolderDelete(folder.id); setFolderDropdownOpen(null); }} />
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="pt-2">
        <p className={`text-xs font-semibold uppercase tracking-wider ${gray} px-3 mb-1`}>Recent</p>
        {recentNotes.slice(0, 5).map(note => (
          <button key={note.id} onClick={() => onNoteClick(note)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${text} ${hover} transition-colors`}>
            <FileText size={16} className={gray} />
            <span className="flex-1 text-left truncate">{note.title || 'Untitled'}</span>
          </button>
        ))}
      </div>

      <div className={`pt-4 border-t ${border}`}>
        <button onClick={onSettingsClick} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${currentView === 'settings' ? active : `${gray} ${hover} hover:${text}`}`}>
          <Settings size={16} /><span className="flex-1 text-left">Settings</span>
        </button>
      </div>
    </div>
  );
}
