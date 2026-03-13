import { useState, useMemo } from 'react';
import { Sparkles, FileText, Folder, Trash2 } from 'lucide-react';
import { CentralInput } from '../components/CentralInput';
import { ConfirmModal } from '../components/ConfirmModal';
import { useNotes } from '../hooks/useNotes';
import { notesAPI } from '../api/client';
import type { Folder as FolderType, Note } from '../types';

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

interface HomePageProps {
  folders: FolderType[];
  addFolderLocally: (folder: FolderType) => void;
  onSelectNote: (note: Note) => void;
}

// Days to consider a note as "unused"
const UNUSED_DAYS = 30;

function getUnusedNotes(notes: Note[]): Note[] {
  const now = new Date().getTime();
  const unusedThreshold = UNUSED_DAYS * 24 * 60 * 60 * 1000; // 30 days in ms
  
  return notes.filter((note) => {
    const updatedAt = new Date(note.updated_at).getTime();
    return now - updatedAt > unusedThreshold;
  });
}

export function HomePage({ folders, addFolderLocally, onSelectNote }: HomePageProps) {
  const { notes, refetch: refetchNotes, deleteNote } = useNotes();
  const [creating, setCreating] = useState(false);
  const [showDeleteUnusedModal, setShowDeleteUnusedModal] = useState(false);
  const [isDeletingUnused, setIsDeletingUnused] = useState(false);
  const [deleteResult, setDeleteResult] = useState<{ success: number; failed: number } | null>(null);
  
  // State for single note delete
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [isDeletingNote, setIsDeletingNote] = useState(false);

  const unusedNotes = useMemo(() => getUnusedNotes(notes), [notes]);
  const hasUnusedNotes = unusedNotes.length > 0;

  const handleCreateNote = async (title: string, content: string, folderId: number) => {
    if (creating) return;
    
    setCreating(true);
    try {
      // Check if folder exists, if not create it
      let targetFolderId = folderId;
      const hashTag = content.match(/#(\w+)/);
      
      if (hashTag) {
        const folderName = hashTag[1];
        const existingFolder = folders.find(
          (f) => f.name.toLowerCase() === folderName.toLowerCase()
        );
        
        if (!existingFolder) {
          const response = await fetch('/api/folders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: folderName }),
          });
          const newFolder = await response.json();
          targetFolderId = newFolder.id;
          addFolderLocally(newFolder);
        } else {
          targetFolderId = existingFolder.id;
        }
      }

      const note = await notesAPI.create({
        folder_id: targetFolderId,
        title: title,
        content: content.replace(/#\w+/g, '').trim(), // Remove hashtags from content
      });

      refetchNotes();
      onSelectNote(note);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUnused = async () => {
    setIsDeletingUnused(true);
    let success = 0;
    let failed = 0;

    for (const note of unusedNotes) {
      try {
        await deleteNote(note.id);
        success++;
      } catch {
        failed++;
      }
    }

    setIsDeletingUnused(false);
    setDeleteResult({ success, failed });
    refetchNotes();
  };

  const handleCloseResultModal = () => {
    setDeleteResult(null);
    setShowDeleteUnusedModal(false);
  };

  // Single note delete handlers
  const handleDeleteClick = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    setNoteToDelete(note);
  };

  const handleConfirmDelete = async () => {
    if (!noteToDelete) return;
    
    setIsDeletingNote(true);
    try {
      await deleteNote(noteToDelete.id);
      await refetchNotes();
    } finally {
      setIsDeletingNote(false);
      setNoteToDelete(null);
    }
  };

  const handleCloseDeleteModal = () => {
    if (isDeletingNote) return;
    setNoteToDelete(null);
  };

  const recentNotes = notes.slice(0, 5);

  return (
    <div 
      data-area-id="homepage"
      className={`homepage flex flex-col h-full overflow-y-auto ${c.bg}`}
    >
      {/* Hero Section */}
      <div 
        data-area-id="homepage-hero"
        className="homepage-hero flex-1 flex flex-col items-center justify-center px-8 py-16 min-h-[50vh]"
      >
        <div className="homepage-hero-content text-center mb-12">
          <div className="homepage-hero-icon inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-2xl mb-6 shadow-lg">
            <Sparkles size={32} className="text-white" />
          </div>
          <h1 className={`homepage-hero-title text-4xl font-bold ${c.text} mb-3`}>
            Welcome to MagicBox
          </h1>
          <p className={`homepage-hero-subtitle ${c.gray} text-lg`}>
            Capture your thoughts. Organize with folders.
          </p>
        </div>

        <CentralInput folders={folders} onCreateNote={handleCreateNote} />
      </div>

      {/* Recent Notes */}
      {recentNotes.length > 0 && (
        <div 
          data-area-id="homepage-recent-section"
          className="homepage-recent-section max-w-4xl mx-auto w-full px-8 pb-16"
        >
          <h2 className={`homepage-recent-title text-lg font-semibold ${c.text} mb-4 flex items-center gap-2`}>
            <FileText size={20} />
            Recent Notes
          </h2>
          <div className="homepage-recent-grid grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentNotes.map((note) => (
              <div
                key={note.id}
                data-area-id={`homepage-recent-${note.id}`}
                className={`homepage-recent-card group relative flex items-start gap-3 p-4 ${c.input} border ${c.border} rounded-xl hover:shadow-md hover:border-blue-700 transition-all cursor-pointer`}
              >
                {/* Card click area */}
                <div 
                  className="absolute inset-0 z-0"
                  onClick={() => onSelectNote(note)}
                />
                
                {/* Delete button - appears on hover */}
                <div className="homepage-recent-card-delete-wrapper absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    data-area-id={`homepage-recent-delete-${note.id}`}
                    onClick={(e) => handleDeleteClick(e, note)}
                    disabled={isDeletingNote}
                    className={`homepage-recent-card-delete-btn p-2 ${c.gray} hover:text-red-500 hover:bg-red-900/20 rounded-lg transition-colors`}
                    title="Delete note"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <FileText size={20} className={`${c.gray} relative z-0`} />
                <div className="homepage-recent-card-content flex-1 min-w-0 pr-8 relative z-0">
                  <h3 className={`homepage-recent-card-title font-medium ${c.text} truncate`}>{note.title}</h3>
                  <p className={`homepage-recent-card-preview text-sm ${c.gray} line-clamp-2 mt-1`}>
                    {note.content?.replace(/[#*_`]/g, '').slice(0, 100) || 'No content'}
                  </p>
                  <p className={`homepage-recent-card-date text-xs ${c.gray} mt-2`}>
                    {new Date(note.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div 
        data-area-id="homepage-stats"
        className={`homepage-stats border-t ${c.border} bg-[#202020]`}
      >
        <div className="homepage-stats-content max-w-4xl mx-auto px-8 py-6 flex items-center justify-center gap-12">
          <div 
            data-area-id="homepage-stats-notes"
            className="homepage-stats-notes text-center"
          >
            <p className={`homepage-stats-notes-count text-2xl font-bold ${c.text}`}>{notes.length}</p>
            <p className={`homepage-stats-notes-label text-sm ${c.gray} flex items-center gap-1 justify-center`}>
              <FileText size={14} />
              Notes
            </p>
          </div>
          <div className={`homepage-stats-divider w-px h-10 ${c.border}`} />
          <div 
            data-area-id="homepage-stats-folders"
            className="homepage-stats-folders text-center"
          >
            <p className={`homepage-stats-folders-count text-2xl font-bold ${c.text}`}>{folders.length}</p>
            <p className={`homepage-stats-folders-label text-sm ${c.gray} flex items-center gap-1 justify-center`}>
              <Folder size={14} />
              Folders
            </p>
          </div>
          <div className={`homepage-stats-divider w-px h-10 ${c.border}`} />
          <div 
            data-area-id="homepage-stats-unused"
            className="homepage-stats-unused text-center"
          >
            <p className={`homepage-stats-unused-count text-2xl font-bold ${hasUnusedNotes ? 'text-red-500' : c.text}`}>
              {unusedNotes.length}
            </p>
            <button
              data-area-id="homepage-stats-unused-btn"
              onClick={() => setShowDeleteUnusedModal(true)}
              disabled={!hasUnusedNotes}
              className={`homepage-stats-unused-btn text-sm flex items-center gap-1 justify-center transition-colors ${
                hasUnusedNotes 
                  ? 'text-red-500 hover:text-red-400' 
                  : c.gray
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={hasUnusedNotes ? `Delete notes not updated in ${UNUSED_DAYS} days` : 'No unused notes'}
            >
              <Trash2 size={14} />
              Unused
            </button>
          </div>
        </div>
      </div>

      {/* Single Note Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={noteToDelete !== null}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Note"
        message={`Are you sure you want to delete "${noteToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeletingNote}
        variant="danger"
      />

      {/* Delete Unused Notes Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteUnusedModal && deleteResult === null}
        onClose={() => setShowDeleteUnusedModal(false)}
        onConfirm={handleDeleteUnused}
        title="Delete Unused Notes"
        message={`You have ${unusedNotes.length} note${unusedNotes.length !== 1 ? 's' : ''} that haven't been updated in ${UNUSED_DAYS} days. Are you sure you want to delete them? This action cannot be undone.`}
        confirmText={`Delete ${unusedNotes.length} Note${unusedNotes.length !== 1 ? 's' : ''}`}
        cancelText="Cancel"
        isLoading={isDeletingUnused}
        variant="warning"
      />

      {/* Delete Result Modal */}
      <ConfirmModal
        isOpen={deleteResult !== null}
        onClose={handleCloseResultModal}
        onConfirm={handleCloseResultModal}
        title="Deletion Complete"
        message={
          deleteResult?.failed === 0
            ? `Successfully deleted ${deleteResult?.success} note${deleteResult?.success !== 1 ? 's' : ''}.`
            : `Deleted ${deleteResult?.success} note${deleteResult?.success !== 1 ? 's' : ''}. ${deleteResult?.failed} failed.`
        }
        confirmText="OK"
        cancelText=""
        variant={deleteResult?.failed === 0 ? 'info' : 'warning'}
      />
    </div>
  );
}
