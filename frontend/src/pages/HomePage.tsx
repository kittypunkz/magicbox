import { Plus, Trash2, Folder } from 'lucide-react';
import { formatDistanceToNow } from '../lib/utils';
import { SkeletonCard as SkeletonNoteCard } from '../components/Skeleton';
import type { Note, Folder as FolderType } from '../types';

interface HomePageProps {
  notes: Note[];
  folders: FolderType[];
  onNoteClick: (note: Note) => void;
  onCreateNote: () => void;
  onDeleteNote: (e: React.MouseEvent, noteId: number) => void;
  loading: boolean;
}

export function HomePage({ notes, folders, onNoteClick, onCreateNote, onDeleteNote, loading }: HomePageProps) {
  const getFolderName = (folderId: number | null) => {
    if (!folderId) return null;
    return folders.find(f => f.id === folderId)?.name;
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonNoteCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#6b6b6b] p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-2 border-dashed border-[#2f2f2f] rounded-2xl flex items-center justify-center">
            <span className="text-3xl">📝</span>
          </div>
          <h2 className="text-xl font-semibold text-[#e6e6e6]">No notes yet</h2>
          <p className="text-sm max-w-xs mx-auto">Create your first note to get started with MagicBox</p>
          <button
            onClick={onCreateNote}
            className="mt-4 px-6 py-3 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-xl text-sm font-medium active:scale-95 transition-all shadow-lg shadow-blue-500/20"
          >
            <Plus size={18} className="inline mr-2" />
            Create Note
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
      <div className="max-w-7xl mx-auto">
        {/* Stats */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-[#e6e6e6]">All Notes</h2>
            <p className="text-sm text-[#6b6b6b] mt-1">{notes.length} note{notes.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={onCreateNote}
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg text-sm font-medium active:scale-95 transition-all"
          >
            <Plus size={18} />
            New Note
          </button>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {notes.map((note) => {
            const folderName = getFolderName(note.folder_id);
            return (
              <div
                key={note.id}
                onClick={() => onNoteClick(note)}
                className="group bg-[#202020] rounded-xl p-4 border border-[#2f2f2f] hover:border-[#4b4b4b] active:scale-[0.98] transition-all cursor-pointer touch-manipulation"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-[#e6e6e6] font-medium line-clamp-2 flex-1 pr-2">
                    {note.title || 'Untitled'}
                  </h3>
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
                      sm:pointer-events-auto pointer-events-auto
                    "
                    aria-label="Delete note"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Preview */}
                <p className="text-sm text-[#6b6b6b] line-clamp-3 mb-4 min-h-[3.5em]">
                  {note.content || 'No content'}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-[#2f2f2f]">
                  {folderName ? (
                    <div className="flex items-center gap-1.5 text-xs text-blue-400">
                      <Folder size={12} />
                      <span className="truncate max-w-[100px]">{folderName}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-[#4b4b4b]">No folder</span>
                  )}
                  <span className="text-xs text-[#4b4b4b]">
                    {formatDistanceToNow(new Date(note.updated_at))}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Add New Note Card - Always visible on mobile, hover on desktop */}
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
        </div>
      </div>
    </div>
  );
}
