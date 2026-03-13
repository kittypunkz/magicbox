import { useState } from 'react';
import { FileText, Clock, Trash2 } from 'lucide-react';
import { useNotes } from '../hooks/useNotes';
import { ConfirmModal } from './ConfirmModal';
import type { Note } from '../types';

interface NoteListProps {
  folderId?: number;
  onSelectNote: (note: Note) => void;
  selectedNoteId?: number;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString();
}

export function NoteList({ folderId, onSelectNote, selectedNoteId }: NoteListProps) {
  const { notes, loading, deleteNote } = useNotes(folderId);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    setNoteToDelete(note);
  };

  const handleConfirmDelete = async () => {
    if (!noteToDelete) return;
    
    setDeletingId(noteToDelete.id);
    await deleteNote(noteToDelete.id);
    setDeletingId(null);
    setNoteToDelete(null);
  };

  const handleCloseModal = () => {
    if (deletingId) return; // Don't close while deleting
    setNoteToDelete(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-notion-gray dark:text-notion-dark-gray">
        <FileText size={48} className="mb-4 opacity-30" />
        <p className="text-sm">No notes yet</p>
        <p className="text-xs mt-1">Create your first note from the home page</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-1">
        {notes.map((note) => (
          <button
            key={note.id}
            onClick={() => onSelectNote(note)}
            className={`w-full group flex items-start gap-3 p-3 rounded-lg transition-all text-left ${
              selectedNoteId === note.id
                ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                : 'hover:bg-notion-hover dark:hover:bg-notion-dark-hover border border-transparent'
            }`}
          >
            <FileText size={18} className="text-notion-gray dark:text-notion-dark-gray mt-0.5 shrink-0" />
            
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-notion-text dark:text-notion-dark-text truncate">{note.title}</h3>
              <p className="text-sm text-notion-gray dark:text-notion-dark-gray line-clamp-2 mt-0.5">
                {note.content?.replace(/[#*_`]/g, '').slice(0, 100) || 'No content'}
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-notion-gray dark:text-notion-dark-gray">
                <Clock size={12} />
                {formatDate(note.updated_at)}
                {note.folder_name && (
                  <>
                    <span>•</span>
                    <span className="text-blue-500">{note.folder_name}</span>
                  </>
                )}
              </div>
            </div>

            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <button
                onClick={(e) => handleDeleteClick(e, note)}
                disabled={deletingId === note.id}
                className="p-1.5 text-notion-gray dark:text-notion-dark-gray hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </button>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={noteToDelete !== null}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        title="Delete Note"
        message={`Are you sure you want to delete "${noteToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deletingId !== null}
        variant="danger"
      />
    </>
  );
}
