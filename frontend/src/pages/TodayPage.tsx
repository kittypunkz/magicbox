import type { ReactNode } from 'react';
import { ArrowUpRight, Bookmark, FileText, Loader2, Sparkles } from 'lucide-react';
import { useNotes } from '../hooks/useNotes';
import { useSummary } from '../hooks/useSummary';
import { formatDate, formatDateTime, formatRelativeTime } from '../lib/dates';
import type { Note, Task } from '../types';

const c = {
  bg: 'bg-[#0a0a0a]',
  card: 'bg-[#1a1a1a]',
  text: 'text-[#e6e6e6]',
  gray: 'text-[#888888]',
  border: 'border-[#2a2a2a]',
};

interface TodayPageProps {
  onCreateNote: () => void;
  onSelectNote: (note: Note) => void;
}

function SectionCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={`${c.card} border ${c.border} rounded-2xl overflow-hidden`}>
      <div className={`px-5 py-4 border-b ${c.border} flex items-start justify-between gap-4`}>
        <div>
          <h2 className={`text-sm font-semibold ${c.text}`}>{title}</h2>
          {subtitle ? <p className={`text-xs mt-1 ${c.gray}`}>{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function TaskList({
  tasks,
  emptyLabel,
}: {
  tasks: Task[];
  emptyLabel: string;
}) {
  if (tasks.length === 0) {
    return <p className={`text-sm ${c.gray}`}>{emptyLabel}</p>;
  }

  return (
    <div className="space-y-3">
      {tasks.map(task => (
        <div key={task.id} className={`rounded-xl border ${c.border} bg-[#131313] px-4 py-3`}>
          <p className={`text-sm font-medium ${c.text}`}>{task.title}</p>
          {task.description ? (
            <p className={`text-xs mt-1 line-clamp-2 ${c.gray}`}>{task.description}</p>
          ) : null}
          <p className="text-xs text-[#5a5a5a] mt-2">
            {task.completed_at ? `Completed ${formatDateTime(task.completed_at)}` : `Created ${formatDate(task.created_at)}`}
          </p>
        </div>
      ))}
    </div>
  );
}

export function TodayPage({ onCreateNote, onSelectNote }: TodayPageProps) {
  const { notes, loading: notesLoading } = useNotes();
  const { summary, loading: summaryLoading } = useSummary();

  const recentNotes = notes.filter(note => !note.bookmark_url).slice(0, 5);
  const recentBookmarks = notes.filter(note => note.bookmark_url).slice(0, 5);

  return (
    <div className={`h-full overflow-y-auto ${c.bg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        <section className="relative overflow-hidden rounded-3xl border border-[#343434] bg-[radial-gradient(circle_at_top,#3a3a20_0%,#151515_45%,#0a0a0a_100%)] p-6 sm:p-8">
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle at 20% 0%, #faff69 0%, transparent 35%)' }} />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#c8cb77]">Today</p>
              <h1 className={`mt-2 text-3xl sm:text-4xl font-semibold ${c.text}`}>Daily work memory</h1>
              <p className={`mt-3 max-w-2xl text-sm sm:text-base ${c.gray}`}>
                Capture what matters, see what is active now, and review what changed today without digging through all notes.
              </p>
            </div>
            <button
              onClick={onCreateNote}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#faff69] px-4 py-3 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-[#e8ec5b]"
            >
              <Sparkles size={16} />
              Quick Capture
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <SectionCard
              title="Doing Now"
              subtitle="Tasks currently in progress today."
            >
              {summaryLoading ? <Loader2 size={20} className={`animate-spin ${c.gray}`} /> : <TaskList tasks={summary?.doing ?? []} emptyLabel="Nothing is in progress right now." />}
            </SectionCard>

            <SectionCard
              title="Done Today"
              subtitle="Tasks completed today in Bangkok time."
            >
              {summaryLoading ? <Loader2 size={20} className={`animate-spin ${c.gray}`} /> : <TaskList tasks={summary?.done_today ?? []} emptyLabel="No completed tasks yet today." />}
            </SectionCard>
          </div>

          <div className="space-y-6">
            <SectionCard
              title="Recent Notes"
              subtitle="Latest notes captured for recall."
            >
              {notesLoading ? (
                <Loader2 size={20} className={`animate-spin ${c.gray}`} />
              ) : recentNotes.length === 0 ? (
                <p className={`text-sm ${c.gray}`}>No recent notes yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentNotes.map(note => (
                    <button
                      key={note.id}
                      onClick={() => onSelectNote(note)}
                      className={`w-full rounded-xl border ${c.border} bg-[#131313] px-4 py-3 text-left transition-colors hover:border-[#4b4b4b]`}
                    >
                      <div className="flex items-start gap-3">
                        <FileText size={16} className="mt-0.5 text-[#888888]" />
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium truncate ${c.text}`}>{note.title || 'Untitled'}</p>
                          <p className={`text-xs mt-1 line-clamp-2 ${c.gray}`}>{note.content?.replace(/[#*_`]/g, '').trim() || 'No content'}</p>
                          <p className="text-xs text-[#5a5a5a] mt-2">{formatRelativeTime(note.updated_at)}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Recent Bookmarks"
              subtitle="Links saved recently for quick reopen."
            >
              {notesLoading ? (
                <Loader2 size={20} className={`animate-spin ${c.gray}`} />
              ) : recentBookmarks.length === 0 ? (
                <p className={`text-sm ${c.gray}`}>No recent bookmarks yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentBookmarks.map(note => (
                    <a
                      key={note.id}
                      href={note.bookmark_url ?? '#'}
                      target="_blank"
                      rel="noreferrer"
                      className={`block rounded-xl border ${c.border} bg-[#131313] px-4 py-3 transition-colors hover:border-[#4b4b4b]`}
                    >
                      <div className="flex items-start gap-3">
                        <Bookmark size={16} className="mt-0.5 text-emerald-400" />
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium truncate ${c.text}`}>{note.bookmark_title || note.title || 'Untitled bookmark'}</p>
                          <p className="text-xs mt-1 truncate text-emerald-400">{note.bookmark_url}</p>
                          <p className="text-xs text-[#5a5a5a] mt-2">{formatRelativeTime(note.updated_at)}</p>
                        </div>
                        <ArrowUpRight size={14} className="text-[#666]" />
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className={`rounded-2xl border ${c.border} bg-[#131313] px-4 py-4`}>
            <p className="text-xs uppercase tracking-wide text-[#666]">Doing</p>
            <p className={`mt-2 text-2xl font-semibold ${c.text}`}>{summary?.doing.length ?? 0}</p>
          </div>
          <div className={`rounded-2xl border ${c.border} bg-[#131313] px-4 py-4`}>
            <p className="text-xs uppercase tracking-wide text-[#666]">Done Today</p>
            <p className="mt-2 text-2xl font-semibold text-green-400">{summary?.done_today.length ?? 0}</p>
          </div>
          <div className={`rounded-2xl border ${c.border} bg-[#131313] px-4 py-4`}>
            <p className="text-xs uppercase tracking-wide text-[#666]">Recent Notes</p>
            <p className={`mt-2 text-2xl font-semibold ${c.text}`}>{recentNotes.length}</p>
          </div>
          <div className={`rounded-2xl border ${c.border} bg-[#131313] px-4 py-4`}>
            <p className="text-xs uppercase tracking-wide text-[#666]">Bookmarks</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-400">{recentBookmarks.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
