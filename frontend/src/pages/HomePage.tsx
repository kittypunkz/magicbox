import { useState } from 'react';
import { Sparkles, FileText, Folder } from 'lucide-react';
import { CentralInput } from '../components/CentralInput';
import { useFolders } from '../hooks/useFolders';
import { useNotes } from '../hooks/useNotes';
import { notesAPI } from '../api/client';
import type { Note } from '../types';

interface HomePageProps {
  onSelectNote: (note: Note) => void;
}

export function HomePage({ onSelectNote }: HomePageProps) {
  const { folders, refetch: refetchFolders } = useFolders();
  const { notes, refetch: refetchNotes } = useNotes();
  const [creating, setCreating] = useState(false);

  const handleCreateNote = async (title: string, folderId: number) => {
    if (creating) return;
    
    setCreating(true);
    try {
      let targetFolderId = folderId;
      const hashTag = title.match(/#(\w+)/);
      
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
          refetchFolders();
        } else {
          targetFolderId = existingFolder.id;
        }
      }

      const cleanTitle = title.replace(/#\w+/g, '').trim() || 'Untitled';
      const note = await notesAPI.create({
        folder_id: targetFolderId,
        title: cleanTitle,
        content: '',
      });

      refetchNotes();
      onSelectNote(note);
    } finally {
      setCreating(false);
    }
  };

  const recentNotes = notes.slice(0, 5);

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-notion-bg dark:bg-notion-dark-bg transition-theme">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-16 min-h-[50vh]">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-2xl mb-6 shadow-lg shadow-blue-200 dark:shadow-blue-900/30">
            <Sparkles size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-notion-text dark:text-notion-dark-text mb-3">
            Welcome to MagicBox
          </h1>
          <p className="text-notion-gray dark:text-notion-dark-gray text-lg">
            Capture your thoughts. Organize with folders.
          </p>
        </div>

        <CentralInput folders={folders} onCreateNote={handleCreateNote} />
      </div>

      {/* Recent Notes */}
      {recentNotes.length > 0 && (
        <div className="max-w-4xl mx-auto w-full px-8 pb-16">
          <h2 className="text-lg font-semibold text-notion-text dark:text-notion-dark-text mb-4 flex items-center gap-2">
            <FileText size={20} />
            Recent Notes
          </h2>
          <RecentNoteList notes={recentNotes} onSelectNote={onSelectNote} />
        </div>
      )}

      {/* Quick Stats */}
      <div className="border-t border-notion-border dark:border-notion-dark-border bg-gray-50 dark:bg-notion-dark-sidebar">
        <div className="max-w-4xl mx-auto px-8 py-6 flex items-center justify-center gap-12">
          <div className="text-center">
            <p className="text-2xl font-bold text-notion-text dark:text-notion-dark-text">{notes.length}</p>
            <p className="text-sm text-notion-gray dark:text-notion-dark-gray flex items-center gap-1">
              <FileText size={14} />
              Notes
            </p>
          </div>
          <div className="w-px h-10 bg-notion-border dark:bg-notion-dark-border" />
          <div className="text-center">
            <p className="text-2xl font-bold text-notion-text dark:text-notion-dark-text">{folders.length}</p>
            <p className="text-sm text-notion-gray dark:text-notion-dark-gray flex items-center gap-1">
              <Folder size={14} />
              Folders
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Recent notes list component
function RecentNoteList({ notes, onSelectNote }: { notes: Note[]; onSelectNote: (note: Note) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {notes.map((note) => (
        <button
          key={note.id}
          onClick={() => onSelectNote(note)}
          className="group flex items-start gap-3 p-4 bg-white dark:bg-notion-dark-input border border-notion-border dark:border-notion-dark-border rounded-xl hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all text-left"
        >
          <FileText size={20} className="text-notion-gray dark:text-notion-dark-gray mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-notion-text dark:text-notion-dark-text truncate">{note.title}</h3>
            <p className="text-sm text-notion-gray dark:text-notion-dark-gray line-clamp-2 mt-1">
              {note.content?.replace(/[#*_`]/g, '').slice(0, 100) || 'No content'}
            </p>
            <p className="text-xs text-notion-gray dark:text-notion-dark-gray mt-2">
              {new Date(note.updated_at).toLocaleDateString()}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
