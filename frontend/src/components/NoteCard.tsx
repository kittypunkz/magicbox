import { useState } from 'react';
import { Pin, Loader2, Sparkles } from 'lucide-react';
import { processAPI } from '../api/client';
import { TaskConfirmModal } from './TaskConfirmModal';
import { tasksAPI } from '../api/client';
import { formatRelativeTime } from '../lib/dates';
import type { Note } from '../types';

interface NoteCardProps {
  note: Note;
  onClick: () => void;
}

export function NoteCard({ note, onClick }: NoteCardProps) {
  const [extracting, setExtracting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<{ title: string }[]>([]);

  const handleExtract = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setExtracting(true);
    try {
      const { tasks } = await processAPI.note(note.id);
      setSuggestions(tasks);
      setModalOpen(true);
    } catch (err) {
      console.error('Extract failed:', err);
    } finally {
      setExtracting(false);
    }
  };

  const handleConfirm = async (titles: string[], noteId: number) => {
    await Promise.all(titles.map(title => tasksAPI.create(title, noteId)));
  };

  const preview = note.content?.slice(0, 120) || '';
  const folderName = note.folder_name;
  const relTime = getRelativeTime(note.updated_at);

  return (
    <>
      <div
        onClick={onClick}
        className="bg-[#202020] border border-[#2f2f2f] rounded-xl p-4 cursor-pointer hover:border-[#3f3f3f] hover:bg-[#222] transition-colors group"
      >
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            {!!note.is_pinned && <Pin size={12} className="text-blue-400 flex-shrink-0" />}
            {folderName && (
              <span className="text-xs text-[#6b6b6b] flex-shrink-0">#{folderName}</span>
            )}
            <span className="text-xs text-[#4b4b4b] flex-shrink-0">{relTime}</span>
          </div>
        </div>

        <h3 className="text-sm font-medium text-[#e6e6e6] mb-1 line-clamp-1">{note.title}</h3>

        {preview && (
          <p className="text-xs text-[#6b6b6b] line-clamp-2 mb-3">{preview}</p>
        )}

        <button
          onClick={handleExtract}
          disabled={extracting}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#6b6b6b] hover:text-[#e6e6e6] border border-[#2f2f2f] hover:border-[#4f4f4f] rounded-lg transition-colors disabled:opacity-50"
        >
          {extracting
            ? <Loader2 size={12} className="animate-spin" />
            : <Sparkles size={12} />
          }
          Extract Tasks
        </button>
      </div>

      <TaskConfirmModal
        isOpen={modalOpen}
        noteId={note.id}
        noteTitle={note.title}
        suggestions={suggestions}
        onConfirm={handleConfirm}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}

function getRelativeTime(dateStr: string): string {
  return formatRelativeTime(dateStr);
}
