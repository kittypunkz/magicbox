import { Loader2, AlertCircle, CheckCircle2, Clock, Inbox } from 'lucide-react';
import { useSummary } from '../hooks/useSummary';
import type { Task } from '../types';

const c = {
  text: 'text-[#e6e6e6]',
  gray: 'text-[#6b6b6b]',
  border: 'border-[#2f2f2f]',
};

const SECTIONS = [
  { key: 'doing'     as const, label: 'Doing',        icon: Clock,        color: 'text-blue-400',  emptyMsg: 'Nothing in progress today'   },
  { key: 'done_today'as const, label: 'Done Today',   icon: CheckCircle2, color: 'text-green-400', emptyMsg: 'Nothing completed today yet'  },
  { key: 'backlog'   as const, label: 'Backlog',       icon: Inbox,        color: 'text-[#6b6b6b]', emptyMsg: 'Backlog is clear'             },
] as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Bangkok',
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Bangkok',
  });
}

function TaskRow({ task, showCompleted }: { task: Task; showCompleted: boolean }) {
  return (
    <div className={`flex items-start gap-3 px-4 py-2.5 border-b ${c.border} last:border-0`}>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${c.text} truncate`}>{task.title}</p>
        <p className={`text-xs ${c.gray} mt-0.5`}>
          {showCompleted && task.completed_at
            ? `Completed ${formatDateTime(task.completed_at)}`
            : `Created ${formatDate(task.created_at)}`}
        </p>
      </div>
    </div>
  );
}

interface SummaryViewProps {
  onRefresh?: () => void;
}

export function SummaryView({ onRefresh: _onRefresh }: SummaryViewProps) {
  const { summary, loading, error, refetch } = useSummary();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={24} className={`animate-spin ${c.gray}`} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const dateLabel = new Date(summary.date + 'T00:00:00+07:00').toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Bangkok',
  });

  const totalDone = summary.done_today.length;
  const totalDoing = summary.doing.length;
  const totalBacklog = summary.backlog.length;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 space-y-6">

        {/* Date header */}
        <div className="text-center pb-2">
          <p className={`text-xs uppercase tracking-widest ${c.gray} mb-1`}>Daily Summary</p>
          <h2 className={`text-xl font-semibold ${c.text}`}>{dateLabel}</h2>
          <p className={`text-sm ${c.gray} mt-1`}>
            {totalDoing} doing · {totalDone} done today · {totalBacklog} in backlog
          </p>
        </div>

        {/* Sections */}
        {SECTIONS.map(({ key, label, icon: Icon, color, emptyMsg }) => {
          const tasks: Task[] = summary[key];
          return (
            <div key={key} className="bg-[#202020] border border-[#2f2f2f] rounded-xl overflow-hidden">
              {/* Section header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2f2f2f]">
                <Icon size={15} className={color} />
                <span className={`text-sm font-semibold ${color}`}>{label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full bg-[#2a2a2a] ${c.gray} ml-auto`}>
                  {tasks.length}
                </span>
              </div>

              {/* Tasks */}
              {tasks.length === 0 ? (
                <div className={`px-4 py-6 text-center text-sm ${c.gray} opacity-60`}>
                  {emptyMsg}
                </div>
              ) : (
                tasks.map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    showCompleted={key === 'done_today'}
                  />
                ))
              )}
            </div>
          );
        })}

        {/* Refresh */}
        <div className="text-center">
          <button
            onClick={refetch}
            className={`text-xs ${c.gray} hover:text-[#e6e6e6] transition-colors`}
          >
            Refresh
          </button>
        </div>

      </div>
    </div>
  );
}
