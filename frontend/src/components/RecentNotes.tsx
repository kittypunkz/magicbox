import { Clock, FileText, X } from 'lucide-react';
import { useRecentNotes } from '../hooks/useRecentNotes';
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

interface RecentNotesProps {
  onSelectNote: (note: Note) => void;
}

// Type for recent note entries
interface RecentNote {
  id: number;
  title: string;
  folder_id: number;
  folder_name: string;
  viewedAt: string;
}

function formatTimeAgo(dateStr: string): string {
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

export function RecentNotes({ onSelectNote }: RecentNotesProps) {
  const { recentNotes, clearRecentNotes } = useRecentNotes();

  if (recentNotes.length === 0) {
    return null;
  }

  const handleNoteClick = (recentNote: RecentNote) => {
    const note: Note = {
      id: recentNote.id,
      title: recentNote.title,
      folder_id: recentNote.folder_id,
      folder_name: recentNote.folder_name,
      content: '',
      created_at: recentNote.viewedAt,
      updated_at: recentNote.viewedAt,
    };
    onSelectNote(note);
  };

  return (
    <div className={`px-4 py-3 border-t ${c.border}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock size={14} className={c.gray} />
          <span className={`text-xs font-semibold ${c.gray} uppercase tracking-wider`}>
            Recent
          </span>
        </div>
        <button
          onClick={clearRecentNotes}
          className={`p-1 ${c.gray} hover:text-red-500 transition-colors`}
          title="Clear recent notes"
        >
          <X size={12} />
        </button>
      </div>
      
      <div className="space-y-1">
        {recentNotes.map((note) => (
          <button
            key={note.id}
            onClick={() => handleNoteClick(note)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md ${c.hover} transition-colors text-left group`}
          >
            <FileText size={14} className={`${c.gray} shrink-0`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${c.text} truncate`}>
                {note.title}
              </p>
              <p className={`text-[10px] ${c.gray}`}>
                {formatTimeAgo(note.viewedAt)}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
