import { useState } from 'react';
import { Sparkles, FileText, Folder } from 'lucide-react';
import { CentralInput } from '../components/CentralInput';
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

export function HomePage({ folders, addFolderLocally, onSelectNote }: HomePageProps) {
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
          // Instantly add to folders list without waiting for refetch
          addFolderLocally(newFolder);
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
    <div className={`flex flex-col h-full overflow-y-auto ${c.bg}`}>
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-16 min-h-[50vh]">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-2xl mb-6 shadow-lg">
            <Sparkles size={32} className="text-white" />
          </div>
          <h1 className={`text-4xl font-bold ${c.text} mb-3`}>
            Welcome to MagicBox
          </h1>
          <p className={`${c.gray} text-lg`}>
            Capture your thoughts. Organize with folders.
          </p>
        </div>

        <CentralInput folders={folders} onCreateNote={handleCreateNote} />
      </div>

      {/* Recent Notes */}
      {recentNotes.length > 0 && (
        <div className="max-w-4xl mx-auto w-full px-8 pb-16">
          <h2 className={`text-lg font-semibold ${c.text} mb-4 flex items-center gap-2`}>
            <FileText size={20} />
            Recent Notes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => onSelectNote(note)}
                className={`group flex items-start gap-3 p-4 ${c.input} border ${c.border} rounded-xl hover:shadow-md hover:border-blue-700 transition-all text-left`}
              >
                <FileText size={20} className={c.gray} />
                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium ${c.text} truncate`}>{note.title}</h3>
                  <p className={`text-sm ${c.gray} line-clamp-2 mt-1`}>
                    {note.content?.replace(/[#*_`]/g, '').slice(0, 100) || 'No content'}
                  </p>
                  <p className={`text-xs ${c.gray} mt-2`}>
                    {new Date(note.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className={`border-t ${c.border} bg-[#202020]`}>
        <div className="max-w-4xl mx-auto px-8 py-6 flex items-center justify-center gap-12">
          <div className="text-center">
            <p className={`text-2xl font-bold ${c.text}`}>{notes.length}</p>
            <p className={`text-sm ${c.gray} flex items-center gap-1`}>
              <FileText size={14} />
              Notes
            </p>
          </div>
          <div className={`w-px h-10 ${c.border}`} />
          <div className="text-center">
            <p className={`text-2xl font-bold ${c.text}`}>{folders.length}</p>
            <p className={`text-sm ${c.gray} flex items-center gap-1`}>
              <Folder size={14} />
              Folders
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
