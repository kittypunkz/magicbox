import { useState } from 'react';
import { Folder, FileText, Clock, Trash2, Plus, X, CheckSquare, Square, Pin } from 'lucide-react';
import { useFolder, useFolders } from '../hooks/useFolders';
import { ConfirmModal } from '../components/ConfirmModal';
import { CreateNoteModal } from '../components/CreateNoteModal';
import { SkeletonCard } from '../components/Skeleton';
import { useMinLoading } from '../hooks/useMinLoading';
import { notesAPI, foldersAPI } from '../api/client';
import type { Note, Folder as FolderType } from '../types';

// Dark mode colors
const c = {
  bg: 'bg-[#191919]',
  sidebar: 'bg-[#202020]',
  hover: 'hover:bg-[#2a2a2a]',
  text: 'text-[#e6e6e6]',
  gray: 'text-[#6b6b6b]',
  border: 'border-[#2f2f2f]',
  input: 'bg-[#2a2a2a]',
};

interface FolderPageProps {
  folderId: number;
  folders: FolderType[];
  onSelectNote: (note: Note) => void;
  onCreateNote?: (title: string, content: string, folderId: number, bookmarkUrl?: string) => Promise<void> | void;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function FolderPage({ folderId, folders: propFolders, onSelectNote, onCreateNote }: FolderPageProps) {
  const { folder, loading, error, refetch } = useFolder(folderId);
  const { refetch: refetchFolders } = useFolders();
  // Minimum 500ms loading time for skeleton
  const showLoading = useMinLoading(loading, 500);
  
  // Single note delete state
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Bulk delete state
  const [isBulkDeleteMode, setIsBulkDeleteMode] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<Set<number>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  
  // New Note Modal state
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    setNoteToDelete(note);
  };

  const handleConfirmDelete = async () => {
    if (!noteToDelete) return;
    
    setIsDeleting(true);
    try {
      await notesAPI.delete(noteToDelete.id);
      await refetch(); // Refresh the folder notes
    } finally {
      setIsDeleting(false);
      setNoteToDelete(null);
    }
  };

  const handleCloseModal = () => {
    if (isDeleting) return;
    setNoteToDelete(null);
  };

  // Bulk delete handlers
  const toggleBulkDeleteMode = () => {
    setIsBulkDeleteMode(!isBulkDeleteMode);
    setSelectedNotes(new Set()); // Clear selection when toggling
  };

  const handleNoteSelect = (noteId: number) => {
    const newSelected = new Set(selectedNotes);
    if (newSelected.has(noteId)) {
      newSelected.delete(noteId);
    } else {
      newSelected.add(noteId);
    }
    setSelectedNotes(newSelected);
  };

  const handleSelectAll = () => {
    if (folder?.notes) {
      if (selectedNotes.size === folder.notes.length) {
        // Deselect all
        setSelectedNotes(new Set());
      } else {
        // Select all
        setSelectedNotes(new Set(folder.notes.map(n => n.id)));
      }
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    let success = 0;
    let failed = 0;

    for (const noteId of selectedNotes) {
      try {
        await notesAPI.delete(noteId);
        success++;
      } catch {
        failed++;
      }
    }

    setIsBulkDeleting(false);
    setShowBulkDeleteConfirm(false);
    setIsBulkDeleteMode(false);
    setSelectedNotes(new Set());
    await refetch(); // Refresh the folder notes
  };

  const handleCancelBulkDelete = () => {
    if (isBulkDeleting) return;
    setShowBulkDeleteConfirm(false);
  };

  const handleCreateNote = async (title: string, content: string, folderName: string | null, bookmarkUrl?: string) => {
    if (!onCreateNote) return;
    
    // Default to current folder
    let targetFolderId = folderId;
    
    // If folder name provided and different from current, find or create it
    if (folderName && folderName.toLowerCase() !== folder?.name.toLowerCase()) {
      const existingFolder = propFolders.find(
        (f) => f.name.toLowerCase() === folderName.toLowerCase()
      );
      
      if (existingFolder) {
        targetFolderId = existingFolder.id;
      } else {
        // Create new folder
        const newFolder = await foldersAPI.create(folderName);
        targetFolderId = newFolder.id;
        // Refresh folders list
        await refetchFolders();
      }
    }
    
    await onCreateNote(title, content, targetFolderId, bookmarkUrl);
    // Refresh folder to show new note
    await refetch();
  };

  if (showLoading) {
    return (
      <div 
        data-area-id="folderpage"
        className={`folderpage h-full overflow-y-auto ${c.bg}`}
      >
        {/* Skeleton Header */}
        <div className={`sticky top-0 bg-[#202020] border-b ${c.border} px-4 sm:px-8 py-4 sm:py-6 z-10`}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#2a2a2a] rounded-xl animate-pulse" />
            <div className="space-y-2">
              <div className="h-5 sm:h-6 w-32 sm:w-48 bg-[#2a2a2a] rounded animate-pulse" />
              <div className="h-3 sm:h-4 w-16 sm:w-24 bg-[#2a2a2a] rounded animate-pulse" />
            </div>
          </div>
        </div>
        {/* Skeleton Notes Grid */}
        <div className="px-4 sm:px-8 py-4 sm:py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !folder) {
    return (
      <div 
        data-area-id="folderpage"
        className={`folderpage-error flex flex-col items-center justify-center h-full ${c.gray}`}
      >
        <Folder size={48} className="mb-4 opacity-30" />
        <p>Folder not found</p>
      </div>
    );
  }

  const hasNotes = folder.notes && folder.notes.length > 0;
  const selectedCount = selectedNotes.size;

  return (
    <div 
      data-area-id="folderpage"
      className={`folderpage h-full overflow-y-auto ${c.bg}`}
    >
      {/* Header */}
      <div 
        data-area-id="folderpage-header"
        className={`folderpage-header sticky top-0 bg-[#202020] border-b ${c.border} px-4 sm:px-8 py-4 sm:py-6 z-10`}
      >
        <div className="folderpage-header-content flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div 
              data-area-id="folderpage-icon"
              className="folderpage-icon w-10 h-10 sm:w-12 sm:h-12 bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0"
            >
              <Folder size={20} className="text-blue-500 sm:hidden" />
              <Folder size={24} className="text-blue-500 hidden sm:block" />
            </div>
            <div className="folderpage-header-info min-w-0">
              <h1 
                data-area-id="folderpage-name"
                className={`folderpage-name text-lg sm:text-2xl font-bold ${c.text} truncate`}
              >
                {folder.name}
              </h1>
              <p 
                data-area-id="folderpage-count"
                className={`folderpage-count text-xs sm:text-sm ${c.gray} flex items-center gap-2`}
              >
                <FileText size={12} className="sm:hidden" />
                <FileText size={14} className="hidden sm:block" />
                {folder.notes?.length || 0} note{folder.notes?.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isBulkDeleteMode ? (
              // Bulk Delete Mode Actions
              <>
                <span className={`text-xs sm:text-sm ${c.gray} hidden sm:inline`}>
                  {selectedCount} selected
                </span>
                <button
                  data-area-id="folderpage-select-all-btn"
                  onClick={handleSelectAll}
                  className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg ${c.hover} ${c.text} transition-colors`}
                >
                  {selectedCount === folder.notes?.length ? (
                    <CheckSquare size={16} className="text-blue-500 sm:hidden" />
                  ) : (
                    <Square size={16} className={`${c.gray} sm:hidden`} />
                  )}
                  {selectedCount === folder.notes?.length ? (
                    <CheckSquare size={18} className="text-blue-500 hidden sm:block" />
                  ) : (
                    <Square size={18} className={`${c.gray} hidden sm:block`} />
                  )}
                  <span className="text-xs sm:text-sm hidden sm:inline">All</span>
                </button>
                <button
                  data-area-id="folderpage-bulk-delete-confirm-btn"
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  disabled={selectedCount === 0}
                  className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-[#4b5563] disabled:cursor-not-allowed text-white rounded-lg transition-colors`}
                >
                  <Trash2 size={16} className="sm:hidden" />
                  <Trash2 size={18} className="hidden sm:block" />
                  <span className="text-xs sm:text-sm hidden sm:inline">Delete ({selectedCount})</span>
                </button>
                <button
                  data-area-id="folderpage-cancel-bulk-delete-btn"
                  onClick={toggleBulkDeleteMode}
                  className={`p-1.5 sm:p-2 ${c.gray} hover:text-white rounded-lg transition-colors`}
                >
                  <X size={18} className="sm:hidden" />
                  <X size={20} className="hidden sm:block" />
                </button>
              </>
            ) : (
              // Normal Mode Actions
              hasNotes && (
                <button
                  data-area-id="folderpage-bulk-delete-mode-btn"
                  onClick={toggleBulkDeleteMode}
                  className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 ${c.input} border ${c.border} rounded-lg ${c.text} ${c.hover} transition-colors`}
                >
                  <Trash2 size={16} className="sm:hidden" />
                  <Trash2 size={18} className="hidden sm:block" />
                  <span className="text-xs sm:text-sm hidden sm:inline">Delete</span>
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Notes List */}
      <div className="folderpage-content px-4 sm:px-8 py-4 sm:py-6">
        {!hasNotes ? (
          <div 
            data-area-id="folderpage-empty"
            className={`folderpage-empty flex flex-col items-center justify-center py-12 sm:py-16 ${c.gray}`}
          >
            <FileText size={40} className="mb-4 opacity-30 sm:hidden" />
            <FileText size={48} className="mb-4 opacity-30 hidden sm:block" />
            <p className="text-base sm:text-lg font-medium">No notes in this folder</p>
            <p className="text-xs sm:text-sm mt-1 mb-4 sm:mb-6">Create a note to get started</p>
            {onCreateNote && (
              <button
                data-area-id="folderpage-create-note-btn"
                onClick={() => setIsNoteModalOpen(true)}
                className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-medium rounded-lg transition-colors"
              >
                <Plus size={18} className="sm:hidden" />
                <Plus size={20} className="hidden sm:block" />
                Create New Note
              </button>
            )}
          </div>
        ) : (
          <div 
            data-area-id="folderpage-notes-grid"
            className="folderpage-notes-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {folder.notes.map((note) => (
              <div
                key={note.id}
                data-area-id={`folderpage-note-${note.id}`}
                onClick={() => !isBulkDeleteMode && onSelectNote(note as Note)}
                className={`folderpage-note-card group relative flex flex-col p-4 sm:p-5 ${c.input} border ${c.border} rounded-xl transition-all ${
                  isBulkDeleteMode 
                    ? 'cursor-default' 
                    : 'hover:shadow-md cursor-pointer touch-manipulation active:scale-[0.98]'
                } ${selectedNotes.has(note.id) ? 'ring-2 ring-blue-500 border-blue-500' : ''} ${
                  note.bookmark_url ? 'border-l-4 border-l-emerald-500 hover:border-emerald-700' : 'hover:border-blue-700'
                }`}
              >
                {/* Checkbox for bulk delete */}
                {isBulkDeleteMode && (
                  <div 
                    className="absolute top-3 left-3 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      data-area-id={`folderpage-note-checkbox-${note.id}`}
                      onClick={() => handleNoteSelect(note.id)}
                      className="p-1 rounded transition-colors"
                    >
                      {selectedNotes.has(note.id) ? (
                        <CheckSquare size={18} className="text-blue-500 sm:hidden" />
                      ) : (
                        <Square size={18} className={`${c.gray} sm:hidden`} />
                      )}
                      {selectedNotes.has(note.id) ? (
                        <CheckSquare size={20} className="text-blue-500 hidden sm:block" />
                      ) : (
                        <Square size={20} className={`${c.gray} hidden sm:block`} />
                      )}
                    </button>
                  </div>
                )}

                {/* Single Delete button - appears on hover for desktop, always visible on mobile */}
                {!isBulkDeleteMode && (
                  <div className="folderpage-note-delete-wrapper absolute top-3 right-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10">
                    <button
                      data-area-id={`folderpage-note-delete-${note.id}`}
                      onClick={(e) => handleDeleteClick(e, note as Note)}
                      disabled={isDeleting}
                      className={`folderpage-note-delete-btn p-2 ${c.gray} hover:text-red-500 hover:bg-red-500/20 rounded-lg transition-colors`}
                      title="Delete note"
                    >
                      <Trash2 size={14} className="sm:hidden" />
                      <Trash2 size={16} className="hidden sm:block" />
                    </button>
                  </div>
                )}

                <div className={`flex items-center gap-2 mb-2 ${isBulkDeleteMode ? 'pl-7 sm:pl-8' : 'pr-8'}`}>
                  <h3 
                    data-area-id={`folderpage-note-title-${note.id}`}
                    className={`folderpage-note-title font-semibold ${c.text} truncate`}
                  >
                    {note.title}
                  </h3>
                  {note.is_pinned === 1 && (
                    <>
                      <Pin 
                        size={14} 
                        className="text-yellow-500 flex-shrink-0" 
                        fill="currentColor" 
                        aria-hidden="true"
                      />
                      <span className="sr-only">Pinned note</span>
                    </>
                  )}
                </div>
                <p className={`folderpage-note-preview text-sm ${c.gray} line-clamp-3 flex-1`}>
                  {note.bookmark_url ? (
                    <span className="text-emerald-400">
                      {(() => { try { return new URL(note.bookmark_url).hostname; } catch { return note.bookmark_url; } })()}
                    </span>
                  ) : (
                    'Click to open this note'
                  )}
                </p>
                <div className={`folderpage-note-meta flex items-center gap-2 mt-4 pt-4 border-t ${c.border} text-xs ${c.gray}`}>
                  <Clock size={12} />
                  {formatDate(note.updated_at)}
                </div>
              </div>
            ))}
            
            {/* Add New Note Card */}
            {!isBulkDeleteMode && onCreateNote && (
              <button
                data-area-id="folderpage-add-note-card"
                onClick={() => setIsNoteModalOpen(true)}
                className={`folderpage-add-note-card group relative flex flex-col items-center justify-center p-4 sm:p-5 border-2 border-dashed ${c.border} rounded-xl hover:border-blue-500 hover:bg-blue-500/5 transition-all cursor-pointer touch-manipulation active:scale-[0.98] min-h-[140px] sm:min-h-[180px]`}
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-2 sm:mb-3 group-hover:bg-blue-500/20 transition-colors`}>
                  <Plus size={20} className="text-blue-500 sm:hidden" />
                  <Plus size={24} className="text-blue-500 hidden sm:block" />
                </div>
                <span className={`text-sm font-medium ${c.text}`}>Add New Note</span>
                <span className={`text-xs ${c.gray} mt-1 hidden sm:inline`}>Click to create</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Single Note Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={noteToDelete !== null}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        title="Delete Note"
        message={`Are you sure you want to delete "${noteToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        variant="danger"
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showBulkDeleteConfirm}
        onClose={handleCancelBulkDelete}
        onConfirm={handleBulkDelete}
        title="Delete Selected Notes"
        message={`Are you sure you want to delete ${selectedCount} selected note${selectedCount !== 1 ? 's' : ''}? This action cannot be undone.`}
        confirmText={`Delete ${selectedCount} Note${selectedCount !== 1 ? 's' : ''}`}
        cancelText="Cancel"
        isLoading={isBulkDeleting}
        variant="danger"
      />

      {/* Create Note Modal */}
      {onCreateNote && (
        <CreateNoteModal
          isOpen={isNoteModalOpen}
          onClose={() => setIsNoteModalOpen(false)}
          folders={propFolders}
          onCreateNote={handleCreateNote}
          defaultFolderName={folder?.name}
        />
      )}
    </div>
  );
}
