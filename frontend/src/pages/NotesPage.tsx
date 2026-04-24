import { useState } from 'react';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { useNotes } from '../hooks/useNotes';
import { NoteCard } from '../components/NoteCard';
import type { Folder, Note } from '../types';

const c = {
  bg: 'bg-[#191919]',
  text: 'text-[#e6e6e6]',
  gray: 'text-[#6b6b6b]',
  border: 'border-[#2f2f2f]',
};

interface NotesPageProps {
  folders: Folder[];
  onSelectNote: (note: Note) => void;
  onCreateNote: () => void;
}

export function NotesPage({ folders, onSelectNote, onCreateNote }: NotesPageProps) {
  const { notes, loading, error } = useNotes();
  const [activeFolder, setActiveFolder] = useState<number | 'all'>('all');

  const filtered = activeFolder === 'all'
    ? notes
    : notes.filter(n => n.folder_id === activeFolder);

  const visibleFolders = folders.filter(f => notes.some(n => n.folder_id === f.id));

  return (
    <div className={`h-full overflow-y-auto ${c.bg}`}>
      {/* Header */}
      <div className={`sticky top-0 bg-[#202020]/95 backdrop-blur border-b ${c.border} px-4 sm:px-8 py-4 z-10`}>
        <div className="flex items-center justify-between mb-3">
          <h1 className={`text-xl font-bold ${c.text}`}>Notes</h1>
          <button
            onClick={onCreateNote}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            New Note
          </button>
        </div>

        {/* Folder filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveFolder('all')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeFolder === 'all'
                ? 'bg-blue-500 text-white'
                : `${c.gray} hover:text-[#e6e6e6] hover:bg-[#2a2a2a]`
            }`}
          >
            All
          </button>
          {visibleFolders.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFolder(f.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeFolder === f.id
                  ? 'bg-blue-500 text-white'
                  : `${c.gray} hover:text-[#e6e6e6] hover:bg-[#2a2a2a]`
              }`}
            >
              #{f.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-8 py-4">
        {error && (
          <div className="flex items-start gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className={`animate-spin ${c.gray}`} />
          </div>
        ) : filtered.length === 0 ? (
          <div className={`text-center py-16 ${c.gray}`}>
            <p className="text-sm mb-4">No notes yet</p>
            <button
              onClick={onCreateNote}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm mx-auto transition-colors"
            >
              <Plus size={16} />New Note
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => onSelectNote(note)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
