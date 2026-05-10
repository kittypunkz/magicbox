import { useMemo, useState } from 'react';
import { Plus, Loader2, AlertCircle, Clock3, FolderOpen } from 'lucide-react';
import { useNotes } from '../hooks/useNotes';
import { NoteCard } from '../components/NoteCard';
import type { Folder, Note } from '../types';

const c = {
  bg: 'bg-[#0a0a0a]',
  text: 'text-[#e6e6e6]',
  gray: 'text-[#888888]',
  border: 'border-[#2a2a2a]',
};

type TimeFilter = 'today' | 'yesterday' | 'this_week' | 'all';

const TIME_FILTERS: Array<{ key: TimeFilter; label: string }> = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'this_week', label: 'This Week' },
  { key: 'all', label: 'All' },
];

interface NotesPageProps {
  folders: Folder[];
  onSelectNote: (note: Note) => void;
  onCreateNote: () => void;
}

function parseDB(iso: string): Date {
  if (!iso) return new Date(NaN);
  if (iso.includes('Z') || /[+-]\d{2}:\d{2}$/.test(iso)) return new Date(iso);
  return new Date(iso.replace(' ', 'T') + 'Z');
}

function getBangkokDayStart(offsetDays = 0): Date {
  const now = new Date();
  const bkk = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  bkk.setHours(0, 0, 0, 0);
  bkk.setDate(bkk.getDate() + offsetDays);
  return bkk;
}

function toBangkokDate(date: Date): Date {
  return new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
}

function isWithinRange(date: Date, start: Date, end: Date): boolean {
  const value = toBangkokDate(date).getTime();
  return value >= start.getTime() && value < end.getTime();
}

function matchesTimeFilter(note: Note, filter: TimeFilter): boolean {
  const updatedAt = parseDB(note.updated_at);
  const startToday = getBangkokDayStart(0);
  const startTomorrow = getBangkokDayStart(1);
  const startYesterday = getBangkokDayStart(-1);
  const dayOfWeek = startToday.getDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  const startThisWeek = getBangkokDayStart(-daysSinceMonday);

  switch (filter) {
    case 'today':
      return isWithinRange(updatedAt, startToday, startTomorrow);
    case 'yesterday':
      return isWithinRange(updatedAt, startYesterday, startToday);
    case 'this_week':
      return isWithinRange(updatedAt, startThisWeek, startTomorrow);
    case 'all':
    default:
      return true;
  }
}

function groupLabel(dateString: string): string {
  const date = parseDB(dateString);
  const startToday = getBangkokDayStart(0);
  const startTomorrow = getBangkokDayStart(1);
  const startYesterday = getBangkokDayStart(-1);
  const dayOfWeek = startToday.getDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  const startThisWeek = getBangkokDayStart(-daysSinceMonday);

  if (isWithinRange(date, startToday, startTomorrow)) return 'Today';
  if (isWithinRange(date, startYesterday, startToday)) return 'Yesterday';
  if (isWithinRange(date, startThisWeek, startYesterday)) return 'This Week';

  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Bangkok',
  }).format(toBangkokDate(date));
}

function emptyMessage(filter: TimeFilter, folderName?: string): string {
  const folderSuffix = folderName ? ` in #${folderName}` : '';
  switch (filter) {
    case 'today':
      return `No notes updated today${folderSuffix}.`;
    case 'yesterday':
      return `No notes updated yesterday${folderSuffix}.`;
    case 'this_week':
      return `No notes updated this week${folderSuffix}.`;
    case 'all':
    default:
      return folderName ? `No notes found in #${folderName}.` : 'No notes yet.';
  }
}

export function NotesPage({ folders, onSelectNote, onCreateNote }: NotesPageProps) {
  const { notes, loading, error } = useNotes();
  const [activeFolder, setActiveFolder] = useState<number | 'all'>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  const sortedNotes = useMemo(
    () => [...notes].sort((a, b) => parseDB(b.updated_at).getTime() - parseDB(a.updated_at).getTime()),
    [notes]
  );

  const filteredNotes = useMemo(() => {
    return sortedNotes.filter(note => {
      const matchesFolder = activeFolder === 'all' || note.folder_id === activeFolder;
      return matchesFolder && matchesTimeFilter(note, timeFilter);
    });
  }, [activeFolder, sortedNotes, timeFilter]);

  const visibleFolders = useMemo(
    () => folders.filter(folder => notes.some(note => note.folder_id === folder.id)),
    [folders, notes]
  );

  const groupedNotes = useMemo(() => {
    const groups = new Map<string, Note[]>();
    filteredNotes.forEach(note => {
      const label = groupLabel(note.updated_at);
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label)!.push(note);
    });
    return Array.from(groups.entries());
  }, [filteredNotes]);

  const activeFolderName = activeFolder === 'all'
    ? undefined
    : folders.find(folder => folder.id === activeFolder)?.name;

  return (
    <div className={`h-full overflow-y-auto ${c.bg}`}>
      <div className={`sticky top-0 bg-[#1a1a1a]/95 backdrop-blur border-b ${c.border} px-4 sm:px-8 py-4 z-10`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className={`text-xl font-bold ${c.text}`}>Notes</h1>
            <p className={`mt-1 text-sm ${c.gray}`}>
              Timeline view for recent writing, filtered by time and folder.
            </p>
          </div>
          <button
            onClick={onCreateNote}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#faff69] hover:bg-[#e6eb52] text-[#0a0a0a] rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            New Note
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock3 size={14} className={c.gray} />
              <span className={`text-xs uppercase tracking-widest ${c.gray}`}>Timeline</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {TIME_FILTERS.map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setTimeFilter(filter.key)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    timeFilter === filter.key
                      ? 'bg-[#faff69] text-[#0a0a0a]'
                      : `${c.gray} hover:text-[#e6e6e6] hover:bg-[#242424]`
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <FolderOpen size={14} className={c.gray} />
              <span className={`text-xs uppercase tracking-widest ${c.gray}`}>Folder</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setActiveFolder('all')}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeFolder === 'all'
                    ? 'bg-[#faff69] text-[#0a0a0a]'
                    : `${c.gray} hover:text-[#e6e6e6] hover:bg-[#242424]`
                }`}
              >
                All folders
              </button>
              {visibleFolders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => setActiveFolder(folder.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    activeFolder === folder.id
                      ? 'bg-[#faff69] text-[#0a0a0a]'
                      : `${c.gray} hover:text-[#e6e6e6] hover:bg-[#242424]`
                  }`}
                >
                  #{folder.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 py-5">
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
        ) : filteredNotes.length === 0 ? (
          <div className={`rounded-2xl border border-dashed ${c.border} px-6 py-16 text-center`}>
            <p className={`text-sm ${c.text}`}>{emptyMessage(timeFilter, activeFolderName)}</p>
            <p className={`mt-2 text-xs ${c.gray}`}>
              Try another timeline filter or capture a new note to start the timeline.
            </p>
            <button
              onClick={onCreateNote}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-[#faff69] hover:bg-[#e6eb52] text-[#0a0a0a] rounded-lg text-sm transition-colors"
            >
              <Plus size={16} />
              New Note
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedNotes.map(([label, sectionNotes]) => (
              <section key={label}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className={`text-sm font-semibold ${c.text}`}>{label}</h2>
                    <p className={`text-xs ${c.gray}`}>
                      {sectionNotes.length} {sectionNotes.length === 1 ? 'note' : 'notes'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {sectionNotes.map(note => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onClick={() => onSelectNote(note)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
