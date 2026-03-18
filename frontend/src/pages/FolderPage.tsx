import { useState } from 'react';
import { Folder, FileText, Clock, Trash2, Plus, X, CheckSquare, Square } from 'lucide-react';
import { useFolder } from '../hooks/useFolders';
import { ConfirmModal } from '../components/ConfirmModal';
import { SkeletonCard } from '../components/Skeleton';
import { useMinLoading } from '../hooks/useMinLoading';
import { notesAPI } from '../api/client';
import type { Note } from '../types';

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
  onSelectNote: (note: Note) => void;
  onCreateNote?: (title: string, content: string, folderId: number) => void;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function FolderPage({ folderId, onSelectNote, onCreateNote }: FolderPageProps) {
  const { folder, loading, error, refetch } = useFolder(folderId);
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

  const handleCreateNote = () => {
    if (onCreateNote) {
      onCreateNote('New Note', '', folderId);
    }
  };

  if (showLoading) {
    return (
      <div 
        data-area-id="folderpage"
        className={`folderpage h-full overflow-y-auto ${c.bg}`}
      >
        {/* Skeleton Header */}
        <div className={`sticky top-0 bg-[#202020] border-b ${c.border} px-8 py-6 z-10`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#2a2a2a] rounded-xl animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-48 bg-[#2a2a2a] rounded animate-pulse" />
              <div className="h-4 w-24 bg-[#2a2a2a] rounded animate-pulse" />
            </div>
          </div>
        </div>
        {/* Skeleton Notes Grid */}
        <div className="px-8 py-6">
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
        className={`folderpage-header sticky top-0 bg-[#202020] border-b ${c.border} px-8 py-6 z-10`}
      >
        <div className="folderpage-header-content flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div 
              data-area-id="folderpage-icon"
              className="folderpage-icon w-12 h-12 bg-blue-900/30 rounded-xl flex items-center justify-center"
            >
              <Folder size={24} className="text-blue-500" />
            </div>
            <div className="folderpage-header-info">
              <h1 
                data-area-id="folderpage-name"
                className={`folderpage-name text-2xl font-bold ${c.text}`}
              >
                {folder.name}
              </h1>
              <p 
                data-area-id="folderpage-count"
                className={`folderpage-count text-sm ${c.gray} flex items-center gap-2`}
              >
                <FileText size={14} />
                {folder.notes?.length || 0} note{folder.notes?.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            {isBulkDeleteMode ? (
              // Bulk Delete Mode Actions
              <>
                <span className={`text-sm ${c.gray}`}>
                  {selectedCount} selected
                </span>
                <button
                  data-area-id="folderpage-select-all-btn"
                  onClick={handleSelectAll}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${c.hover} ${c.text} transition-colors`}
                >
                  {selectedCount === folder.notes?.length ? (
                    <CheckSquare size={18} className="text-blue-500" />
                  ) : (
                    <Square size={18} className={c.gray} />
                  )}
                  <span className="text-sm">All</span>
                </button>
                <button
                  data-area-id="folderpage-bulk-delete-confirm-btn"
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  disabled={selectedCount === 0}
                  className={`flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-[#4b5563] disabled:cursor-not-allowed text-white rounded-lg transition-colors`}
                >
                  <Trash2 size={18} />
                  <span className="text-sm">Delete ({selectedCount})</span>
                </button>
                <button
                  data-area-id="folderpage-cancel-bulk-delete-btn"
                  onClick={toggleBulkDeleteMode}
                  className={`p-2 ${c.gray} hover:text-white rounded-lg transition-colors`}
                >
                  <X size={20} />
                </button>
              </>
            ) : (
              // Normal Mode Actions
              hasNotes && (
                <button
                  data-area-id="folderpage-bulk-delete-mode-btn"
                  onClick={toggleBulkDeleteMode}
                  className={`flex items-center gap-2 px-4 py-2 ${c.input} border ${c.border} rounded-lg ${c.text} ${c.hover} transition-colors`}
                >
                  <Trash2 size={18} />
                  <span className="text-sm">Delete</span>
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Notes List */}
      <div className="folderpage-content px-8 py-6">
        {!hasNotes ? (
          <div 
            data-area-id="folderpage-empty"
            className={`folderpage-empty flex flex-col items-center justify-center py-16 ${c.gray}`}
          >
            <FileText size={48} className="mb-4 opacity-30" />
            <p className="text-lg font-medium">No notes in this folder</p>
            <p className="text-sm mt-1 mb-6">Create a note to get started</p>
            {onCreateNote && (
              <button
                data-area-id="folderpage-create-note-btn"
                onClick={handleCreateNote}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <Plus size={20} />
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
                className={`folderpage-note-card group relative flex flex-col p-5 ${c.input} border ${c.border} rounded-xl transition-all ${
                  isBulkDeleteMode 
                    ? 'cursor-default' 
                    : 'hover:shadow-md hover:border-blue-700 cursor-pointer'
                } ${selectedNotes.has(note.id) ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
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
                        <CheckSquare size={20} className="text-blue-500" />
                      ) : (
                        <Square size={20} className={c.gray} />
                      )}
                    </button>
                  </div>
                )}

                {/* Single Delete button - appears on hover (only in normal mode) */}
                {!isBulkDeleteMode && (
                  <div className="folderpage-note-delete-wrapper absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                      data-area-id={`folderpage-note-delete-${note.id}`}
                      onClick={(e) => handleDeleteClick(e, note as Note)}
                      disabled={isDeleting}
                      className={`folderpage-note-delete-btn p-2 ${c.gray} hover:text-red-500 hover:bg-red-500/20 rounded-lg transition-colors`}
                      title="Delete note"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}

                <h3 
                  data-area-id={`folderpage-note-title-${note.id}`}
                  className={`folderpage-note-title font-semibold ${c.text} truncate mb-2 ${isBulkDeleteMode ? 'pl-8' : 'pr-8'}`}
                >
                  {note.title}
                </h3>
                <p className={`folderpage-note-preview text-sm ${c.gray} line-clamp-3 flex-1`}>
                  Click to open this note
                </p>
                <div className={`folderpage-note-meta flex items-center gap-2 mt-4 pt-4 border-t ${c.border} text-xs ${c.gray}`}>
                  <Clock size={12} />
                  {formatDate(note.updated_at)}
                </div>
              </div>
            ))}
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
    </div>
  );
}
