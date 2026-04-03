import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, FileText, X, MoreHorizontal, Pencil, Trash2, 
  Home, Settings, MessageSquare, Hash, Star,
  GripVertical, Pin, PinOff, Search, ChevronDown, ChevronRight
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { Folder as FolderType, Note, Tag } from '../types';
import { SkeletonFolderItem } from './Skeleton';

interface SidebarProps {
  folders: FolderType[];
  recentNotes: Note[];
  pinnedTags?: Tag[];
  recentTags?: Tag[];
  allTags?: Tag[];
  onFolderClick: (folderId: number) => void;
  onNoteClick: (note: Note) => void;
  onTagClick?: (tagName: string) => void;
  onCreateNote: () => void;
  onCreateFolder: (name: string) => Promise<FolderType>;
  onFolderEdit: (folder: FolderType) => void;
  onFolderDelete: (folderId: number) => void;
  editingFolder: FolderType | null;
  onFolderUpdate: (id: number, name: string) => void;
  onCancelEdit: () => void;
  onTagPin: (tagId: number, pinned: boolean) => void;
  onTagRename: (tagId: number, newName: string) => Promise<void>;
  onTagDelete: (tagId: number) => void;
  onTagsReorder: (tagIds: number[]) => void;
  loading: boolean;
  currentView: 'home' | 'folder' | 'note' | 'settings' | 'feedback' | 'tag';
  selectedFolderId: number | null;
  selectedTagName?: string | null;
  onCloseMobile?: () => void;
  isMobile?: boolean;
  onSettingsClick?: () => void;
  onFeedbackClick?: () => void;
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

// Sortable Tag Item component
function SortableTagItem({
  tag,
  isSelected,
  onClick,
  onContextMenu,
  noteCount,
}: {
  tag: Tag;
  isSelected: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  noteCount?: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tag.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group"
    >
      <button
        onClick={onClick}
        onContextMenu={onContextMenu}
        className={`
          w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm
          transition-colors min-h-[44px]
          ${isSelected ? c.active : `${c.text} ${c.hover}`}
        `}
      >
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-0.5 -ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical size={12} className={c.gray} />
        </div>
        <Hash size={14} style={{ color: tag.color }} />
        <span className="flex-1 text-left truncate">{tag.name}</span>
        {(noteCount ?? tag.note_count) !== undefined && (
          <span className="text-xs text-[#6b6b6b]">{noteCount ?? tag.note_count}</span>
        )}
      </button>
    </div>
  );
}

// Tag Context Menu
function TagContextMenu({
  tag,
  position,
  onClose,
  onPin,
  onRename,
  onDelete,
}: {
  tag: Tag;
  position: { x: number; y: number };
  onClose: () => void;
  onPin: (pinned: boolean) => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="fixed z-50 w-40 bg-[#202020] border border-[#2f2f2f] rounded-lg shadow-lg py-1"
      style={{ top: position.y, left: position.x }}
      onClick={onClose}
    >
      <button
        onClick={() => onPin(!tag.pinned)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#e6e6e6] hover:bg-[#2f2f2f]"
      >
        {tag.pinned ? <PinOff size={14} /> : <Pin size={14} />}
        {tag.pinned ? 'Unpin' : 'Pin to Sidebar'}
      </button>
      <button
        onClick={onRename}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#e6e6e6] hover:bg-[#2f2f2f]"
      >
        <Pencil size={14} />
        Rename
      </button>
      <button
        onClick={onDelete}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-[#2f2f2f]"
      >
        <Trash2 size={14} />
        Delete
      </button>
    </div>
  );
}

// Rename Modal
function RenameTagModal({
  tag,
  onClose,
  onRename,
}: {
  tag: Tag;
  onClose: () => void;
  onRename: (newName: string) => Promise<void>;
}) {
  const [name, setName] = useState(tag.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim() === tag.name) {
      onClose();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onRename(name.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename tag');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#202020] border border-[#2f2f2f] rounded-xl w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between p-4 border-b border-[#2f2f2f]">
            <h2 className="text-lg font-semibold text-[#e6e6e6]">Rename Tag</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-[#6b6b6b] hover:text-[#e6e6e6] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          <div className="p-4">
            <label className="block text-sm text-[#6b6b6b] mb-2">
              Tag name (updates all notes with this tag)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-[#191919] border border-[#2f2f2f] rounded-lg text-[#e6e6e6] placeholder-[#6b6b6b] outline-none focus:border-blue-500"
              placeholder="Tag name"
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-400 mt-2">{error}</p>
            )}
          </div>
          <div className="flex justify-end gap-2 p-4 border-t border-[#2f2f2f]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-[#6b6b6b] hover:text-[#e6e6e6] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || name.trim() === tag.name}
              className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {loading ? 'Renaming...' : 'Rename'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Sidebar({
  folders,
  recentNotes,
  pinnedTags = [],
  recentTags = [],
  allTags = [],
  onFolderClick,
  onNoteClick,
  onTagClick,
  onCreateNote,
  onCreateFolder,
  onFolderEdit,
  onFolderDelete,
  editingFolder,
  onFolderUpdate,
  onCancelEdit,
  onTagPin,
  onTagRename,
  onTagDelete,
  onTagsReorder,
  loading,
  currentView,
  selectedFolderId,
  selectedTagName,
  onCloseMobile,
  isMobile,
  onSettingsClick,
  onFeedbackClick,
}: SidebarProps) {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingName, setEditingName] = useState('');
  const [folderDropdownOpen, setFolderDropdownOpen] = useState<number | null>(null);

  // Tag context menu state
  const [contextMenu, setContextMenu] = useState<{
    tag: Tag;
    position: { x: number; y: number };
  } | null>(null);

  // Rename modal state
  const [renamingTag, setRenamingTag] = useState<Tag | null>(null);

  // Section collapse state
  const [pinnedExpanded, setPinnedExpanded] = useState(true);
  const [recentExpanded, setRecentExpanded] = useState(true);
  const [allExpanded, setAllExpanded] = useState(false);

  // Tag search state
  const [tagSearchQuery, setTagSearchQuery] = useState('');

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update editing name when editingFolder changes
  useEffect(() => {
    if (editingFolder) {
      setEditingName(editingFolder.name);
    }
  }, [editingFolder]);

  // Close dropdown and context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setFolderDropdownOpen(null);
      setContextMenu(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Handle drag end for pinned tags reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = pinnedTags.findIndex((tag) => tag.id === active.id);
      const newIndex = pinnedTags.findIndex((tag) => tag.id === over.id);
      const newOrder = arrayMove(pinnedTags, oldIndex, newIndex);
      onTagsReorder(newOrder.map((tag) => tag.id));
    }
  };

  // Handle right-click on tag
  const handleTagContextMenu = (e: React.MouseEvent, tag: Tag) => {
    e.preventDefault();
    setContextMenu({
      tag,
      position: { x: e.clientX, y: e.clientY },
    });
  };

  // Handle tag rename
  const handleTagRename = async (newName: string) => {
    if (renamingTag) {
      await onTagRename(renamingTag.id, newName);
    }
  };

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
    window.location.href = '/';
    if (isMobile && onCloseMobile) {
      onCloseMobile();
    }
  }, [isMobile, onCloseMobile]);

  // Filter tags for search
  const filteredAllTags = tagSearchQuery
    ? allTags.filter((tag) =>
        tag.name.toLowerCase().includes(tagSearchQuery.toLowerCase())
      )
    : allTags;

  const FolderDropdown = ({ folder }: { folder: FolderType }) => (
    <div
      className="absolute right-0 top-full mt-1 w-36 bg-[#202020] border border-[#2f2f2f] rounded-lg shadow-lg py-1 z-50"
      onClick={(e) => e.stopPropagation()}
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

        {/* Pinned Tags Section */}
        <div>
          <button
            onClick={() => setPinnedExpanded(!pinnedExpanded)}
            className="w-full flex items-center gap-1 px-4 mb-1"
          >
            {pinnedExpanded ? (
              <ChevronDown size={12} className={c.gray} />
            ) : (
              <ChevronRight size={12} className={c.gray} />
            )}
            <h3 className={`text-xs font-semibold uppercase tracking-wider ${c.gray}`}>
              Pinned Tags
            </h3>
            <span className={`text-xs ${c.gray}`}>({pinnedTags.length})</span>
          </button>
          {pinnedExpanded && (
            <div className="px-2 space-y-1">
              {pinnedTags.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={pinnedTags.map((tag) => tag.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {pinnedTags.map((tag) => (
                      <SortableTagItem
                        key={tag.id}
                        tag={tag}
                        isSelected={currentView === 'tag' && selectedTagName === tag.name}
                        onClick={() => onTagClick?.(tag.name)}
                        onContextMenu={(e) => handleTagContextMenu(e, tag)}
                        noteCount={tag.note_count}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              ) : (
                <div className={`px-3 py-3 text-center ${c.gray} text-xs`}>
                  No pinned tags. Right-click a tag to pin it.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent Tags Section */}
        <div>
          <button
            onClick={() => setRecentExpanded(!recentExpanded)}
            className="w-full flex items-center gap-1 px-4 mb-1"
          >
            {recentExpanded ? (
              <ChevronDown size={12} className={c.gray} />
            ) : (
              <ChevronRight size={12} className={c.gray} />
            )}
            <h3 className={`text-xs font-semibold uppercase tracking-wider ${c.gray}`}>
              Recent Tags
            </h3>
          </button>
          {recentExpanded && (
            <div className="px-2 space-y-1">
              {recentTags.length > 0 ? (
                recentTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => onTagClick?.(tag.name)}
                    onContextMenu={(e) => handleTagContextMenu(e, tag)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                      transition-colors min-h-[44px]
                      ${currentView === 'tag' && selectedTagName === tag.name ? c.active : `${c.text} ${c.hover}`}
                    `}
                  >
                    <Hash size={14} style={{ color: tag.color }} />
                    <span className="flex-1 text-left truncate">{tag.name}</span>
                    {tag.note_count !== undefined && (
                      <span className="text-xs text-[#6b6b6b]">{tag.note_count}</span>
                    )}
                  </button>
                ))
              ) : (
                <div className={`px-3 py-3 text-center ${c.gray} text-xs`}>
                  No recent tags
                </div>
              )}
            </div>
          )}
        </div>

        {/* All Tags Section */}
        <div>
          <button
            onClick={() => setAllExpanded(!allExpanded)}
            className="w-full flex items-center gap-1 px-4 mb-1"
          >
            {allExpanded ? (
              <ChevronDown size={12} className={c.gray} />
            ) : (
              <ChevronRight size={12} className={c.gray} />
            )}
            <h3 className={`text-xs font-semibold uppercase tracking-wider ${c.gray}`}>
              All Tags
            </h3>
            <span className={`text-xs ${c.gray}`}>({allTags.length})</span>
          </button>
          {allExpanded && (
            <div className="px-2 space-y-1">
              {/* Search input */}
              <div className="relative mb-2">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b6b]" />
                <input
                  type="text"
                  value={tagSearchQuery}
                  onChange={(e) => setTagSearchQuery(e.target.value)}
                  placeholder="Search tags..."
                  className="w-full pl-8 pr-3 py-2 bg-[#191919] border border-[#2f2f2f] rounded-lg text-sm text-[#e6e6e6] placeholder-[#6b6b6b] outline-none focus:border-blue-500"
                />
              </div>
              {filteredAllTags.length > 0 ? (
                filteredAllTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => onTagClick?.(tag.name)}
                    onContextMenu={(e) => handleTagContextMenu(e, tag)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                      transition-colors min-h-[44px]
                      ${currentView === 'tag' && selectedTagName === tag.name ? c.active : `${c.text} ${c.hover}`}
                    `}
                  >
                    <Hash size={14} style={{ color: tag.color }} />
                    <span className="flex-1 text-left truncate">{tag.name}</span>
                    {tag.note_count !== undefined && (
                      <span className="text-xs text-[#6b6b6b]">{tag.note_count}</span>
                    )}
                    {tag.pinned === 1 && (
                      <Star size={12} className="text-yellow-500" fill="currentColor" />
                    )}
                  </button>
                ))
              ) : (
                <div className={`px-3 py-3 text-center ${c.gray} text-xs`}>
                  {tagSearchQuery ? 'No matching tags' : 'No tags yet'}
                </div>
              )}
            </div>
          )}
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
              <>
                <SkeletonFolderItem />
                <SkeletonFolderItem />
                <SkeletonFolderItem />
              </>
            ) : (
              <>
                {/* Create Folder Input */}
                {isCreatingFolder && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#2f2f2f]">
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
                  <div key={folder.id} className="group relative">
                    {editingFolder?.id === folder.id ? (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#2f2f2f]">
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
                        <span className="flex-1 text-left truncate">{folder.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFolderDropdownOpen(
                              folderDropdownOpen === folder.id ? null : folder.id
                            );
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
            Recent Notes
          </h3>
          <div className="px-2 space-y-1">
            {loading ? (
              <>
                <SkeletonFolderItem />
                <SkeletonFolderItem />
                <SkeletonFolderItem />
              </>
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
        {onFeedbackClick && (
          <button
            onClick={() => {
              onFeedbackClick();
              if (isMobile && onCloseMobile) onCloseMobile();
            }}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
              transition-colors min-h-[44px]
              ${currentView === 'feedback' ? c.active : `${c.gray} ${c.hover} hover:text-[#e6e6e6]`}
            `}
          >
            <MessageSquare size={16} />
            <span className="flex-1 text-left">Feedback</span>
          </button>
        )}
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
          {folders.length} folder{folders.length !== 1 ? 's' : ''} · {allTags.length} tag{allTags.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Tag Context Menu */}
      {contextMenu && (
        <TagContextMenu
          tag={contextMenu.tag}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onPin={(pinned) => {
            onTagPin(contextMenu.tag.id, pinned);
            setContextMenu(null);
          }}
          onRename={() => {
            setRenamingTag(contextMenu.tag);
            setContextMenu(null);
          }}
          onDelete={() => {
            if (confirm(`Delete tag "${contextMenu.tag.name}"? Notes will not be deleted.`)) {
              onTagDelete(contextMenu.tag.id);
            }
            setContextMenu(null);
          }}
        />
      )}

      {/* Rename Tag Modal */}
      {renamingTag && (
        <RenameTagModal
          tag={renamingTag}
          onClose={() => setRenamingTag(null)}
          onRename={handleTagRename}
        />
      )}
    </div>
  );
}
