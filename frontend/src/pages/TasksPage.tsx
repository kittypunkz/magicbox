import { useState, useEffect } from 'react';
import {
  Square,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
  RotateCcw,
  LayoutDashboard,
  FileText,
  Link,
  AlignLeft,
  Check,
  Clock3,
  CheckCircle2,
  Sparkles,
  History,
} from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { useSummary } from '../hooks/useSummary';
import { subtasksAPI } from '../api/client';
import { ConfirmModal } from '../components/ConfirmModal';
import { SummaryView } from '../components/SummaryView';
import { NotePickerModal } from '../components/NotePickerModal';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { formatDate, formatDateTime } from '../lib/dates';
import type { Task, Subtask, TaskSummary } from '../types';

const c = {
  bg: 'bg-[#0a0a0a]',
  text: 'text-[#e6e6e6]',
  gray: 'text-[#888888]',
  border: 'border-[#2a2a2a]',
  input: 'bg-[#242424]',
};

const COLUMNS: { status: Task['status']; label: string; color: string }[] = [
  { status: 'backlog', label: 'Backlog', color: 'text-[#888888]' },
  { status: 'doing', label: 'Doing', color: 'text-[#faff69]' },
  { status: 'done', label: 'Done', color: 'text-green-400' },
];

type TasksTab = 'today' | 'board' | 'worklog';

const TABS: { key: TasksTab; label: string; icon: typeof Clock3 }[] = [
  { key: 'today', label: 'Today', icon: Clock3 },
  { key: 'board', label: 'Board', icon: LayoutDashboard },
  { key: 'worklog', label: 'Work Log', icon: History },
];

const TODAY_SECTIONS: Array<{
  key: keyof Pick<TaskSummary, 'doing' | 'done_today' | 'added_today' | 'carry_over'>;
  label: string;
  subtitle: string;
  emptyLabel: string;
  icon: typeof Clock3;
  color: string;
}> = [
  {
    key: 'doing',
    label: 'Doing',
    subtitle: 'Tasks currently in progress.',
    emptyLabel: 'Nothing is in progress right now.',
    icon: Clock3,
    color: 'text-[#faff69]',
  },
  {
    key: 'done_today',
    label: 'Done Today',
    subtitle: 'Tasks completed today in Bangkok time.',
    emptyLabel: 'No tasks completed yet today.',
    icon: CheckCircle2,
    color: 'text-green-400',
  },
  {
    key: 'added_today',
    label: 'Added Today',
    subtitle: 'Tasks created today, regardless of current status.',
    emptyLabel: 'No tasks were added today.',
    icon: Sparkles,
    color: 'text-sky-400',
  },
  {
    key: 'carry_over',
    label: 'Carry Over',
    subtitle: 'Older unfinished tasks that rolled into today.',
    emptyLabel: 'No carry-over tasks right now.',
    icon: History,
    color: 'text-orange-400',
  },
];

function TaskCard({
  task,
  onMove,
  onDelete,
  onRename,
  onNoteClick,
  onLinkNote,
  onOpenDetail,
  onToggleSubtask,
}: {
  task: Task;
  onMove: (status: Task['status']) => void;
  onDelete: () => void;
  onRename: (title: string) => void;
  onNoteClick?: (noteId: number) => void;
  onLinkNote?: () => void;
  onOpenDetail?: () => void;
  onToggleSubtask?: (subtaskId: number, done: boolean) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const [confirmUndo, setConfirmUndo] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks ?? []);

  useEffect(() => {
    setSubtasks(task.subtasks ?? []);
  }, [task.subtasks]);

  const handleToggleSubtask = async (sub: Subtask) => {
    if (!onToggleSubtask) return;
    const newDone = !sub.done;
    setSubtasks(prev => prev.map(s => s.id === sub.id ? { ...s, done: newDone ? 1 : 0 } : s));
    try {
      await onToggleSubtask(sub.id, newDone);
    } catch {
      setSubtasks(prev => prev.map(s => s.id === sub.id ? sub : s));
    }
  };

  const isDone = task.status === 'done';
  const draggable = !isDone;

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== task.title) onRename(trimmed);
    else setDraft(task.title);
  };

  return (
    <>
      <div
        draggable={draggable}
        onDragStart={draggable ? e => {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', String(task.id));
          setDragging(true);
        } : undefined}
        onDragEnd={draggable ? () => setDragging(false) : undefined}
        className={`p-3 rounded-lg border bg-[#1a1a1a] group flex flex-col gap-2 transition-all
          ${dragging ? 'opacity-40 scale-95' : ''}
          ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}
          ${c.border}`}
      >
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') { setDraft(task.title); setEditing(false); }
            }}
            className={`w-full text-sm bg-transparent border-b border-[#3a3a3a] outline-none ${c.text} pb-0.5`}
          />
        ) : (
          <p
            onClick={() => !isDone && setEditing(true)}
            className={`text-sm leading-snug select-none ${
              isDone ? 'text-[#888]' : `${c.text} hover:text-white`
            }`}
          >
            {task.title}
          </p>
        )}

        {task.description && (
          <p className="text-xs text-[#8b8b8b] leading-snug line-clamp-2">{task.description}</p>
        )}

        <p className={`text-xs ${c.gray}`}>
          {isDone && task.completed_at
            ? `Completed ${formatDateTime(task.completed_at)}`
            : `Created ${formatDate(task.created_at)}`}
        </p>

        {subtasks.length > 0 && (
          <div className="space-y-1">
            {subtasks.map(sub => (
              <div key={sub.id} className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleSubtask(sub)}
                  className={`flex-shrink-0 w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                    sub.done
                      ? 'bg-[#faff69] border-[#faff69]'
                      : 'border-[#5a5a5a] hover:border-[#faff69]'
                  }`}
                >
                  {sub.done ? <Check size={9} className="text-[#0a0a0a]" strokeWidth={3} /> : null}
                </button>
                <span className={`text-xs leading-snug ${sub.done ? 'line-through text-[#5a5a5a]' : 'text-[#aaa]'}`}>
                  {sub.title}
                </span>
              </div>
            ))}
          </div>
        )}

        {onOpenDetail && !isDone && (
          <button
            onClick={onOpenDetail}
            className={`flex items-center gap-1 text-xs ${c.gray} hover:text-[#faff69] transition-colors`}
          >
            <Plus size={10} /> Add subtask
          </button>
        )}

        <div className="flex items-center gap-1.5">
          {task.note_id && onNoteClick ? (
            <button
              onClick={() => onNoteClick(task.note_id!)}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs border border-[#2a2a2a] text-[#888888] hover:text-[#faff69] hover:border-[#faff69]/40 transition-colors"
            >
              <FileText size={10} />
              {task.note_title ?? 'Source note'}
            </button>
          ) : !task.note_id && onLinkNote ? (
            <button
              onClick={onLinkNote}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs border border-dashed border-[#2a2a2a] text-[#5a5a5a] hover:text-[#faff69] hover:border-[#faff69]/40 transition-colors"
              title="Link a note"
            >
              <Link size={10} />
              Add note
            </button>
          ) : null}
        </div>

        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1">
            {isDone && (
              <button
                onClick={() => setConfirmUndo(true)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${c.gray} hover:text-yellow-400 hover:bg-[#242424] transition-colors`}
              >
                <RotateCcw size={12} /> Undo
              </button>
            )}
          </div>
          <div className="flex items-center gap-1">
            {onOpenDetail && (
              <button
                onClick={onOpenDetail}
                className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all ${c.gray} hover:text-[#e6e6e6]`}
                title="View detail"
              >
                <AlignLeft size={14} />
              </button>
            )}
            <button
              onClick={onDelete}
              className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all ${c.gray} hover:text-red-400`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmUndo}
        onClose={() => setConfirmUndo(false)}
        onConfirm={() => { setConfirmUndo(false); onMove('doing'); }}
        title="Mark as incomplete?"
        message="This will clear the completion date and time and move the task back to Doing."
        confirmText="Yes, undo"
        cancelText="Cancel"
        variant="warning"
      />
    </>
  );
}

function AddTaskInput({
  status,
  onAdd,
}: {
  status: Task['status'];
  onAdd: (title: string, status: Task['status']) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    setLoading(true);
    try {
      await onAdd(value.trim(), status);
      setValue('');
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${c.gray} hover:text-[#e6e6e6] hover:bg-[#242424] transition-colors`}
      >
        <Plus size={14} /> Add task
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        autoFocus
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Escape') { setOpen(false); setValue(''); } }}
        onBlur={() => { if (!value.trim()) setOpen(false); }}
        placeholder="Task title…"
        className={`flex-1 px-3 py-2 ${c.input} border ${c.border} rounded-lg ${c.text} placeholder-[#5a5a5a] text-sm focus:outline-none focus:border-[#faff69] transition-colors`}
      />
      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="px-3 py-2 bg-[#faff69] hover:bg-[#e6eb52] text-[#0a0a0a] disabled:opacity-50 rounded-lg text-sm transition-colors"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
      </button>
    </form>
  );
}

function TasksTodaySection({
  title,
  subtitle,
  emptyLabel,
  icon: Icon,
  color,
  tasks,
  onMoveTask,
  onDeleteTask,
  onRenameTask,
  onNoteClick,
  onLinkNote,
  onOpenDetail,
  onToggleSubtask,
}: {
  title: string;
  subtitle: string;
  emptyLabel: string;
  icon: typeof Clock3;
  color: string;
  tasks: Task[];
  onMoveTask: (id: number, status: Task['status']) => Promise<unknown>;
  onDeleteTask: (id: number) => Promise<void>;
  onRenameTask: (id: number, title: string) => Promise<unknown>;
  onNoteClick?: (noteId: number) => void;
  onLinkNote: (taskId: number) => void;
  onOpenDetail: (taskId: number) => void;
  onToggleSubtask: (taskId: number, subtaskId: number, done: boolean) => Promise<void>;
}) {
  return (
    <section className="rounded-2xl border border-[#2a2a2a] bg-[#111111] overflow-hidden">
      <div className="flex items-start gap-3 px-4 py-4 border-b border-[#2a2a2a]">
        <div className="w-9 h-9 rounded-xl bg-[#1c1c1c] flex items-center justify-center flex-shrink-0">
          <Icon size={16} className={color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className={`text-sm font-semibold ${color}`}>{title}</h2>
            <span className={`text-xs px-1.5 py-0.5 rounded-full bg-[#242424] ${c.gray}`}>
              {tasks.length}
            </span>
          </div>
          <p className={`mt-1 text-xs ${c.gray}`}>{subtitle}</p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {tasks.length === 0 ? (
          <div className={`rounded-xl border border-dashed border-[#2a2a2a] px-4 py-8 text-center text-sm ${c.gray} opacity-70`}>
            {emptyLabel}
          </div>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onMove={status => { void onMoveTask(task.id, status); }}
              onDelete={() => { void onDeleteTask(task.id); }}
              onRename={title => { void onRenameTask(task.id, title); }}
              onNoteClick={onNoteClick}
              onLinkNote={!task.note_id ? () => onLinkNote(task.id) : undefined}
              onOpenDetail={() => onOpenDetail(task.id)}
              onToggleSubtask={(subtaskId, done) => onToggleSubtask(task.id, subtaskId, done)}
            />
          ))
        )}
      </div>
    </section>
  );
}

interface TasksPageProps {
  onNoteClick?: (noteId: number) => void;
}

export function TasksPage({ onNoteClick }: TasksPageProps) {
  const { tasks, loading, error, createTask, moveTask, renameTask, deleteTask, linkNote, patchTask } = useTasks();
  const { summary, loading: summaryLoading, error: summaryError, refetch: refetchSummary } = useSummary();
  const [overColumn, setOverColumn] = useState<Task['status'] | null>(null);
  const [activeTab, setActiveTab] = useState<TasksTab>('today');
  const [linkingTaskId, setLinkingTaskId] = useState<number | null>(null);
  const [detailTaskId, setDetailTaskId] = useState<number | null>(null);

  async function runWithSummaryRefresh<T>(action: () => Promise<T>) {
    const result = await action();
    await refetchSummary();
    return result;
  }

  const handleCreateTask = (title: string, status: Task['status']) =>
    runWithSummaryRefresh(() => createTask(title, status));

  const handleMoveTask = (id: number, status: Task['status']) =>
    runWithSummaryRefresh(() => moveTask(id, status));

  const handleRenameTask = (id: number, title: string) =>
    runWithSummaryRefresh(() => renameTask(id, title));

  const handleDeleteTask = (id: number) =>
    runWithSummaryRefresh(async () => {
      await deleteTask(id);
    });

  const handleLinkNote = (id: number, noteId: number | null) =>
    runWithSummaryRefresh(() => linkNote(id, noteId));

  const handleToggleSubtask = (taskId: number, subtaskId: number, done: boolean) =>
    runWithSummaryRefresh(async () => {
      await subtasksAPI.update(taskId, subtaskId, { done });
    });

  const taskCounts = {
    backlog: tasks.filter(t => t.status === 'backlog').length,
    doing: tasks.filter(t => t.status === 'doing').length,
    done: tasks.filter(t => t.status === 'done').length,
  };

  return (
    <div className={`h-full flex flex-col ${c.bg}`}>
      <div className={`flex-shrink-0 bg-[#1a1a1a] border-b ${c.border} px-4 sm:px-8 py-4 sm:py-5`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#242424] rounded-xl flex items-center justify-center flex-shrink-0">
              <Square size={20} className={c.gray} />
            </div>
            <div className="flex-1">
              <h1 className={`text-lg sm:text-xl font-bold ${c.text}`}>Tasks</h1>
              <p className={`text-xs ${c.gray}`}>
                {taskCounts.backlog} backlog · {taskCounts.doing} doing · {taskCounts.done} done
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {TABS.map(({ key, label, icon: Icon }) => {
              const active = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
                    active
                      ? 'border-[#444] bg-[#2a2a2a] text-[#e6e6e6]'
                      : `border-[#2a2a2a] ${c.gray} hover:border-[#444] hover:text-[#e6e6e6]`
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {activeTab === 'today' && (
        <div className="flex-1 overflow-y-auto">
          {summaryError && (
            <div className="mx-4 mt-4 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 sm:mx-8">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-red-400" />
              <p className="text-sm text-red-400">{summaryError}</p>
            </div>
          )}

          {summaryLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 size={24} className={`animate-spin ${c.gray}`} />
            </div>
          ) : summary ? (
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-8">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {TODAY_SECTIONS.map(({ key, label, icon: Icon, color }) => (
                  <div key={key} className="rounded-2xl border border-[#2a2a2a] bg-[#111111] px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-[#1c1c1c] flex items-center justify-center">
                        <Icon size={16} className={color} />
                      </div>
                      <span className={`text-xs ${c.gray}`}>{label}</span>
                    </div>
                    <p className={`mt-3 text-2xl font-semibold ${c.text}`}>{summary[key].length}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                {TODAY_SECTIONS.map(section => (
                  <TasksTodaySection
                    key={section.key}
                    title={section.label}
                    subtitle={section.subtitle}
                    emptyLabel={section.emptyLabel}
                    icon={section.icon}
                    color={section.color}
                    tasks={summary[section.key]}
                    onMoveTask={handleMoveTask}
                    onDeleteTask={handleDeleteTask}
                    onRenameTask={handleRenameTask}
                    onNoteClick={onNoteClick}
                    onLinkNote={taskId => setLinkingTaskId(taskId)}
                    onOpenDetail={taskId => setDetailTaskId(taskId)}
                    onToggleSubtask={handleToggleSubtask}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {activeTab === 'worklog' && <SummaryView />}

      {activeTab === 'board' && error && (
        <div className="flex-shrink-0 mx-4 sm:mx-8 mt-4 flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {activeTab === 'board' && loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={24} className={`animate-spin ${c.gray}`} />
        </div>
      ) : activeTab === 'board' ? (
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-4 p-4 sm:p-6 h-full min-w-[600px]">
            {COLUMNS.map(col => {
              const colTasks = tasks.filter(t => t.status === col.status);
              const isOver = overColumn === col.status;

              return (
                <div
                  key={col.status}
                  className="flex-1 flex flex-col min-w-[200px] max-w-sm"
                  onDragOver={e => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    setOverColumn(col.status);
                  }}
                  onDragLeave={e => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setOverColumn(null);
                    }
                  }}
                  onDrop={e => {
                    e.preventDefault();
                    const id = parseInt(e.dataTransfer.getData('text/plain'));
                    if (!isNaN(id)) {
                      void handleMoveTask(id, col.status);
                    }
                    setOverColumn(null);
                  }}
                >
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${col.color}`}>
                      {col.label}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full bg-[#242424] ${c.gray}`}>
                      {colTasks.length}
                    </span>
                  </div>

                  <div
                    className={`flex-1 overflow-y-auto space-y-2 pr-1 rounded-xl transition-colors
                      ${isOver ? 'bg-[#ffffff08] ring-1 ring-[#3a3a3a]' : ''}`}
                  >
                    {colTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onMove={status => { void handleMoveTask(task.id, status); }}
                        onDelete={() => { void handleDeleteTask(task.id); }}
                        onRename={title => { void handleRenameTask(task.id, title); }}
                        onNoteClick={onNoteClick}
                        onLinkNote={!task.note_id ? () => setLinkingTaskId(task.id) : undefined}
                        onOpenDetail={() => setDetailTaskId(task.id)}
                        onToggleSubtask={(subtaskId, done) => handleToggleSubtask(task.id, subtaskId, done)}
                      />
                    ))}

                    {colTasks.length === 0 && (
                      <div className={`text-center py-8 text-xs ${c.gray} opacity-50`}>
                        {isOver ? 'Drop here' : 'No tasks'}
                      </div>
                    )}
                  </div>

                  <div className="mt-3">
                    <AddTaskInput
                      status={col.status}
                      onAdd={handleCreateTask}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <NotePickerModal
        isOpen={linkingTaskId !== null}
        onClose={() => setLinkingTaskId(null)}
        onConfirm={async note => {
          if (linkingTaskId !== null) {
            await handleLinkNote(linkingTaskId, note.id);
            setLinkingTaskId(null);
          }
        }}
      />

      <TaskDetailModal
        taskId={detailTaskId}
        onClose={() => setDetailTaskId(null)}
        onTaskUpdated={task => {
          patchTask(task);
          void refetchSummary();
        }}
      />
    </div>
  );
}
