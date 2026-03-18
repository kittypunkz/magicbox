import { useState, useMemo } from 'react';
import { Plus, Trash2, Folder, CheckSquare, Square, X } from 'lucide-react';
import { formatDistanceToNow } from '../lib/utils';
import { SkeletonCard as SkeletonNoteCard } from '../components/Skeleton';
import type { Note, Folder as FolderType } from '../types';

interface FolderPageProps {
  folderId: number;
  folders: FolderType[];
  notes: Note[];
  onNoteClick: (note: Note) => void;
  onCreateNote: () => void;
  onDeleteNote: (e: React.MouseEvent, noteId: number) => void;
  loading: boolean;
}

export function FolderPage({ folderId, folders, notes, onNoteClick, onCreateNote, onDeleteNote, loading }: FolderPageProps) {
  const [isBulkDeleteMode, setIsBulkDeleteMode] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<Set<number>>(new Set());

  const folder = folders.find(f => f.id === folderId);
  const folderNotes = useMemo(() => 
    notes.filter(n => n.folder_id === folderId),
    [notes, folderId]
  );

  const handleSelectNote = (noteId: number) => {
    const newSelected = new Set(selectedNotes);
    if (newSelected.has(noteId)) {
      newSelected.delete(noteId);
    } else {
      newSelected.add(noteId);
    }
    setSelectedNotes(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedNotes.size === folderNotes.length) {
      setSelectedNotes(new Set());
    } else {
      setSelectedNotes(new Set(folderNotes.map(n => n.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedNotes.size === 0) return;
    if (confirm(`Delete ${selectedNotes.size} note${selectedNotes.size > 1 ? 's' : ''}?`)) {
      selectedNotes.forEach(noteId => {
        onDeleteNote({ stopPropagation: () => {} } as React.MouseEvent, noteId);
      });
      setSelectedNotes(new Set());
      setIsBulkDeleteMode(false);
    }
  };

  const handleCancelBulkDelete = () => {
    setIsBulkDeleteMode(false);
    setSelectedNotes(new Set());
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonNoteCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#6b6b6b] p-4">
        <div className="w-16 h-16 rounded-2xl bg-[#2f2f2f] flex items-center justify-center mb-4">
          <Folder size={32} className="text-[#4b4b4b]" />
        </div>
        <h2 className="text-xl font-semibold text-[#e6e6e6]">Folder not found</h2>
      </div>
    );
  }

  const hasNotes = folderNotes.length > 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-[#6b6b6b] mb-1">
              <Folder size={14} />
              <span>Folder</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-[#e6e6e6]">{folder.name}</h2>
            <p className="text-sm text-[#6b6b6b] mt-1">
              {folderNotes.length} note{folderNotes.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Bulk Delete Controls */}
          {isBulkDeleteMode ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 px-3 py-2 text-sm text-[#6b6b6b] hover:text-[#e6e6e6] transition-colors"
              >
                {selectedNotes.size === folderNotes.length ? <CheckSquare size={18} /> : <Square size={18} />}
                {selectedNotes.size === folderNotes.length ? 'Deselect All' : 'Select All'}
              </button>
              <div className="w-px h-6 bg-[#2f2f2f]" />
              <span className="text-sm text-[#6b6b6b] min-w-[80px]">
                {selectedNotes.size} selected
              </span>
              <button
                onClick={handleBulkDelete}
                disabled={selectedNotes.size === 0}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
              >
                <Trash2 size={16} />
                Delete
              </button>
              <button
                onClick={handleCancelBulkDelete}
                className="p-2 text-[#6b6b6b] hover:text-[#e6e6e6] hover:bg-[#2f2f2f] rounded-lg active:scale-95 transition-all"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsBulkDeleteMode(true)}
                disabled={!hasNotes}
                className="flex items-center gap-2 px-4 py-2.5 text-[#6b6b6b] hover:text-[#e6e6e6] hover:bg-[#2f2f2f] rounded-lg text-sm font-medium disabled:opacity-50 active:scale-95 transition-all"
              >
                <CheckSquare size={16} />
                Select
              </button>
              <button
                onClick={onCreateNote}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg text-sm font-medium active:scale-95 transition-all"
              >
                <Plus size={18} />
                New Note
              </button>
            </div>
          )}
        </div>

        {/* Notes Grid */}
        {hasNotes ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {folderNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => {
                  if (isBulkDeleteMode) {
                    handleSelectNote(note.id);
                  } else {
                    onNoteClick(note);
                  }
                }}
                className={`
                  group bg-[#202020] rounded-xl p-4 border 
                  ${isBulkDeleteMode && selectedNotes.has(note.id) 
                    ? 'border-blue-500 bg-blue-500/10' 
                    : 'border-[#2f2f2f] hover:border-[#4b4b4b]'
                  }
                  active:scale-[0.98] transition-all cursor-pointer touch-manipulation relative
                `}
              >
                {/* Bulk Delete Checkbox */}
                {isBulkDeleteMode && (
                  <div className="absolute top-3 right-3 z-10">
                    {selectedNotes.has(note.id) ? (
                      <CheckSquare size={20} className="text-blue-500" />
                    ) : (
                      <Square size={20} className="text-[#4b4b4b]" />
                    )}
                  </div>
                )}

                {/* Card Header */}
                <div className="flex items-start justify-between mb-3 pr-8">
                  <h3 className="text-[#e6e6e6] font-medium line-clamp-2 flex-1 pr-2">
                    {note.title || 'Untitled'}
                  </h3>
                  {!isBulkDeleteMode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNote(e, note.id);
                      }}
                      className="
                        opacity-0 group-hover:opacity-100 
                        sm:opacity-0 sm:group-hover:opacity-100
                        p-2 text-[#6b6b6b] hover:text-red-400 
                        hover:bg-red-500/10 rounded-lg 
                        transition-all active:scale-95
                      "
                      aria-label="Delete note"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {/* Preview */}
                <p className="text-sm text-[#6b6b6b] line-clamp-3 mb-4 min-h-[3.5em]">
                  {note.content || 'No content'}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-[#2f2f2f]">
                  <span className="text-xs text-[#4b4b4b]">
                    {formatDistanceToNow(new Date(note.updated_at))}
                  </span>
                </div>
              </div>
            ))}

            {/* Add New Note Card */}
            {!isBulkDeleteMode && (
              <button
                onClick={onCreateNote}
                className="
                  flex flex-col items-center justify-center 
                  min-h-[160px] sm:min-h-[180px]
                  border-2 border-dashed border-[#2f2f2f] 
                  hover:border-blue-500/50 hover:bg-blue-500/5
                  active:border-blue-500 active:bg-blue-500/10
                  rounded-xl p-4 
                  transition-all active:scale-[0.98]
                  group
                "
              >
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-3 group-hover:bg-blue-500/20 transition-colors">
                  <Plus size={24} className="text-blue-500" />
                </div>
                <span className="text-sm font-medium text-blue-500">Add New Note</span>
              </button>
            )}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 text-[#6b6b6b]">
            <div className="w-16 h-16 border-2 border-dashed border-[#2f2f2f] rounded-2xl flex items-center justify-center mb-4">
              <span className="text-3xl">📝</span>
            </div>
            <h3 className="text-lg font-medium text-[#e6e6e6] mb-2">No notes in this folder</h3>
            <p className="text-sm mb-6 max-w-xs text-center">Create your first note in this folder</p>
            <button
              onClick={onCreateNote}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-xl text-sm font-medium active:scale-95 transition-all"
            >
              <Plus size={18} className="inline mr-2" />
              Create Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
