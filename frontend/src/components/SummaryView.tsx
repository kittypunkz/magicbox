import { useState, useMemo } from 'react';
import { Loader2, AlertCircle, CheckCircle2, Clock, Inbox, Check, Download } from 'lucide-react';
import { useSummary } from '../hooks/useSummary';
import type { DateRange } from '../hooks/useSummary';
import { TaskDetailModal } from './TaskDetailModal';
import { formatDate, formatDateTime } from '../lib/dates';
import type { Task, TaskSummary } from '../types';

const c = {
  text: 'text-[#e6e6e6]',
  gray: 'text-[#888888]',
  border: 'border-[#2a2a2a]',
};

const SECTIONS = [
  { key: 'done_today'as const, label: 'Done Today',   icon: CheckCircle2, color: 'text-green-400', emptyMsg: 'Nothing completed today yet'  },
  { key: 'doing'     as const, label: 'Doing',        icon: Clock,        color: 'text-[#faff69]',  emptyMsg: 'Nothing in progress today'   },
  { key: 'backlog'   as const, label: 'Backlog',       icon: Inbox,        color: 'text-[#888888]', emptyMsg: 'Backlog is clear'             },
] as const;


function taskToMd(task: Task): string {
  const lines = [`- ${task.title}`];
  if (task.description?.trim()) {
    lines.push(`  ${task.description.trim()}`);
  }
  (task.subtasks ?? []).forEach(s => lines.push(`  - ${s.title}`));
  return lines.join('\n');
}

function buildMarkdown(summary: TaskSummary, mode: 'today' | 'custom', dateLabel: string, doneTasks: Task[]): string {
  const lines: string[] = [];

  const dateHeading = mode === 'custom' && summary.from !== summary.to
    ? `${summary.from} to ${summary.to}`
    : mode === 'custom'
      ? summary.from
      : dateLabel;

  lines.push(`Work Log | ${dateHeading}`, '');

  const doingTasks = mode === 'custom' ? summary.doing : summary.doing;

  lines.push('Done Task');
  if (doneTasks.length === 0) {
    lines.push('- (none)');
  } else {
    doneTasks.forEach(t => lines.push(taskToMd(t)));
  }

  lines.push('', 'Doing Task');
  if (doingTasks.length === 0) {
    lines.push('- (none)');
  } else {
    doingTasks.forEach(t => lines.push(taskToMd(t)));
  }

  return lines.join('\n');
}

function downloadMd(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function TaskRow({ task, showCompleted, onOpenDetail }: { task: Task; showCompleted: boolean; onOpenDetail: () => void }) {
  const subtasks = task.subtasks ?? [];

  return (
    <div
      className={`px-4 py-2.5 border-b ${c.border} last:border-0 cursor-pointer hover:bg-[#252525] transition-colors`}
      onClick={onOpenDetail}
    >
      <p className={`text-sm ${c.text}`}>{task.title}</p>
      {task.description && (
        <p className={`text-xs ${c.gray} mt-0.5 line-clamp-2`}>{task.description}</p>
      )}
      <p className={`text-xs text-[#5a5a5a] mt-0.5`}>
        {showCompleted && task.completed_at
          ? `Completed ${formatDateTime(task.completed_at)}`
          : `Created ${formatDate(task.created_at)}`}
      </p>
      {subtasks.length > 0 && (
        <ul className="mt-2 space-y-1">
          {subtasks.map(s => (
            <li key={s.id} className="flex items-center gap-2">
              <span className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center ${
                s.done
                  ? 'bg-green-500/20 border-green-500/40'
                  : 'border-[#444]'
              }`}>
                {s.done ? <Check size={10} className="text-green-400" /> : null}
              </span>
              <span className={`text-xs ${s.done ? 'text-[#555]' : c.gray}`}>
                {s.title}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type Mode = 'today' | 'custom';

interface SummaryViewProps {
  onRefresh?: () => void;
}

export function SummaryView({ onRefresh: _onRefresh }: SummaryViewProps) {
  const [mode, setMode] = useState<Mode>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [detailTaskId, setDetailTaskId] = useState<number | null>(null);

  const range = useMemo((): DateRange | undefined => {
    if (mode === 'today') return undefined;
    if (customFrom && customTo) return { from: customFrom, to: customTo };
    return undefined;
  }, [mode, customFrom, customTo]);

  const { summary, loading, error, refetch } = useSummary(range);

  const customIncomplete = mode === 'custom' && (!customFrom || !customTo);

  const dateLabel = summary
    ? new Date(summary.date + 'T00:00:00+07:00').toLocaleDateString(undefined, {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Bangkok',
      })
    : '';

  const doneTasks = summary
    ? [...summary.done_today].sort((a, b) =>
        new Date(a.completed_at!).getTime() - new Date(b.completed_at!).getTime()
      )
    : [];

  function handleExport() {
    if (!summary) return;
    const md = buildMarkdown(summary, mode, dateLabel, doneTasks);
    const filename = mode === 'custom' && summary.from !== summary.to
      ? `work-log-${summary.from}-to-${summary.to}.md`
      : `work-log-${summary.date}.md`;
    downloadMd(md, filename);
  }

  const modeBtn = (m: Mode, label: string) => (
    <button
      key={m}
      onClick={() => setMode(m)}
      className={`px-4 py-1.5 text-xs rounded-full border transition-colors ${
        mode === m
          ? `bg-[#2a2a2a] border-[#444] ${c.text}`
          : `border-[#2a2a2a] ${c.gray} hover:${c.text} hover:border-[#444]`
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 space-y-6">

        {/* Mode selector */}
        <div className="space-y-3">
          <div className="flex justify-center gap-2">
            {modeBtn('today', 'Today')}
            {modeBtn('custom', 'Custom range')}
          </div>

          {mode === 'custom' && (
            <div className="flex gap-3 items-center justify-center">
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                className="bg-[#242424] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm text-[#e6e6e6] focus:outline-none focus:border-[#444] [color-scheme:dark]"
              />
              <span className={`text-xs ${c.gray}`}>to</span>
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                className="bg-[#242424] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm text-[#e6e6e6] focus:outline-none focus:border-[#444] [color-scheme:dark]"
              />
            </div>
          )}
        </div>

        {/* Content */}
        {customIncomplete ? (
          <p className={`text-center text-sm ${c.gray} py-6`}>
            Select a start and end date to view completed tasks.
          </p>
        ) : loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={24} className={`animate-spin ${c.gray}`} />
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : summary ? (
          <>
            {/* Date header */}
            <div className="text-center pb-2">
              <p className={`text-xs uppercase tracking-widest ${c.gray} mb-1`}>
                {mode === 'custom' ? 'Custom Range' : 'Today'}
              </p>
              <p className={`text-sm ${c.gray} mt-1`}>
                {mode === 'custom' && summary.from !== summary.to
                  ? `${summary.from} — ${summary.to}`
                  : mode === 'custom'
                    ? summary.from
                    : dateLabel}
              </p>
              <h2 className={`mt-2 text-xl font-semibold ${c.text}`}>Work Log</h2>
              <p className={`text-sm ${c.gray}`}>
                {mode === 'custom'
                  ? `${doneTasks.length} tasks completed`
                  : `${summary.done_today.length} done today · ${summary.doing.length} doing · ${summary.backlog.length} in backlog`}
              </p>
            </div>

            {/* Sections */}
            {mode === 'custom' ? (
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2a2a2a]">
                  <CheckCircle2 size={15} className="text-green-400" />
                  <span className="text-sm font-semibold text-green-400">Completed</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full bg-[#242424] ${c.gray} ml-auto`}>
                    {doneTasks.length}
                  </span>
                </div>
                {doneTasks.length === 0 ? (
                  <div className={`px-4 py-6 text-center text-sm ${c.gray} opacity-60`}>
                    No tasks completed in this period
                  </div>
                ) : (
                  doneTasks.map(task => (
                    <TaskRow key={task.id} task={task} showCompleted={true} onOpenDetail={() => setDetailTaskId(task.id)} />
                  ))
                )}
              </div>
            ) : (
              SECTIONS.map(({ key, label, icon: Icon, color, emptyMsg }) => {
                const raw: Task[] = summary[key];
                const tasks = key === 'done_today'
                  ? [...raw].sort((a, b) => new Date(a.completed_at!).getTime() - new Date(b.completed_at!).getTime())
                  : raw;
                return (
                  <div key={key} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2a2a2a]">
                      <Icon size={15} className={color} />
                      <span className={`text-sm font-semibold ${color}`}>{label}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full bg-[#242424] ${c.gray} ml-auto`}>
                        {tasks.length}
                      </span>
                    </div>
                    {tasks.length === 0 ? (
                      <div className={`px-4 py-6 text-center text-sm ${c.gray} opacity-60`}>
                        {emptyMsg}
                      </div>
                    ) : (
                      tasks.map(task => (
                        <TaskRow key={task.id} task={task} showCompleted={key === 'done_today'} onOpenDetail={() => setDetailTaskId(task.id)} />
                      ))
                    )}
                  </div>
                );
              })
            )}

            {/* Actions */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={refetch}
                className={`text-xs ${c.gray} hover:text-[#e6e6e6] transition-colors`}
              >
                Refresh
              </button>
              <span className={`text-xs ${c.gray}`}>·</span>
              <button
                onClick={handleExport}
                className={`flex items-center gap-1.5 text-xs ${c.gray} hover:text-[#e6e6e6] transition-colors`}
              >
                <Download size={12} />
                Export .md
              </button>
            </div>
          </>
        ) : null}

      </div>

      <TaskDetailModal
        taskId={detailTaskId}
        onClose={() => setDetailTaskId(null)}
        onTaskUpdated={() => {}}
      />
    </div>
  );
}
