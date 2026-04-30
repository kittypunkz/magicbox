import { useState } from 'react';
import type React from 'react';
import { AlertCircle, Check, FileText, Loader2, Plus } from 'lucide-react';
import type { Task } from '../../types';

const columns: { status: Task['status']; label: string }[] = [
  { status: 'backlog', label: 'Backlog' },
  { status: 'doing', label: 'Doing' },
  { status: 'done', label: 'Done' },
];

interface TasksBoardProps {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  selectedTaskId: number | null;
  onSelectTask: (id: number) => void;
  onCreateTask: (title: string, status: Task['status']) => Promise<void>;
  onMoveTask: (id: number, status: Task['status']) => Promise<unknown>;
  onRenameTask: (id: number, title: string) => Promise<unknown>;
  onNoteClick?: (id: number) => void;
}

export function TasksBoard({
  tasks,
  loading,
  error,
  selectedTaskId,
  onSelectTask,
  onCreateTask,
  onMoveTask,
  onRenameTask,
  onNoteClick,
}: TasksBoardProps) {
  const [overColumn, setOverColumn] = useState<Task['status'] | null>(null);

  if (loading) {
    return <div className="flex flex-1 items-center justify-center text-mb-muted"><Loader2 size={22} className="animate-spin" /></div>;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {error && (
        <div className="mx-4 mt-4 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-x-auto">
        <div className="flex h-full min-w-[660px] gap-4 p-4">
          {columns.map(column => {
            const columnTasks = tasks.filter(task => task.status === column.status);
            const isOver = overColumn === column.status;
            return (
              <section
                key={column.status}
                className="flex min-w-[200px] flex-1 flex-col"
                onDragOver={event => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
                  setOverColumn(column.status);
                }}
                onDragLeave={event => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node)) setOverColumn(null);
                }}
                onDrop={event => {
                  event.preventDefault();
                  const id = Number(event.dataTransfer.getData('text/plain'));
                  if (!Number.isNaN(id)) onMoveTask(id, column.status);
                  setOverColumn(null);
                }}
              >
                <div className="mb-3 flex items-center gap-2 px-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-mb-muted">{column.label}</span>
                  <span className="rounded-full bg-mb-surface px-1.5 py-0.5 text-xs text-mb-muted">{columnTasks.length}</span>
                </div>
                <div className={`min-h-0 flex-1 space-y-2 overflow-y-auto rounded-xl pr-1 transition-colors ${isOver ? 'bg-mb-hover/50 ring-1 ring-mb-border' : ''}`}>
                  {columnTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      selected={selectedTaskId === task.id}
                      onSelect={() => onSelectTask(task.id)}
                      onMove={status => onMoveTask(task.id, status)}
                      onRename={title => onRenameTask(task.id, title)}
                      onNoteClick={onNoteClick}
                    />
                  ))}
                  {columnTasks.length === 0 && (
                    <div className="py-8 text-center text-xs text-mb-muted">{isOver ? 'Drop here' : 'No tasks'}</div>
                  )}
                </div>
                <AddTaskInput status={column.status} onAdd={onCreateTask} />
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TaskCard({
  task,
  selected,
  onSelect,
  onRename,
  onNoteClick,
}: {
  task: Task;
  selected: boolean;
  onSelect: () => void;
  onMove: (status: Task['status']) => void;
  onRename: (title: string) => void;
  onNoteClick?: (id: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const isDone = task.status === 'done';

  const commit = () => {
    setEditing(false);
    const title = draft.trim();
    if (title && title !== task.title) onRename(title);
    else setDraft(task.title);
  };

  return (
    <div
      draggable={!isDone}
      onDragStart={event => {
        if (isDone) return;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(task.id));
      }}
      onClick={onSelect}
      className={`cursor-pointer rounded-lg border border-mb-border bg-mb-surface p-3 transition-colors hover:bg-mb-hover ${
        selected ? 'border-l-2 border-l-mb-accent bg-mb-active' : ''
      } ${!isDone ? 'active:cursor-grabbing' : ''}`}
    >
      {editing ? (
        <input
          autoFocus
          value={draft}
          onClick={event => event.stopPropagation()}
          onChange={event => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={event => {
            if (event.key === 'Enter') commit();
            if (event.key === 'Escape') { setDraft(task.title); setEditing(false); }
          }}
          className="w-full border-b border-mb-border bg-transparent pb-0.5 text-sm text-mb-primary outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={event => {
            event.stopPropagation();
            if (!isDone) setEditing(true);
          }}
          className={`block w-full text-left text-sm leading-snug ${isDone ? 'text-mb-muted line-through' : 'text-mb-primary'}`}
        >
          {task.title}
        </button>
      )}
      {task.description && <p className="mt-2 line-clamp-2 text-xs text-mb-muted">{task.description}</p>}
      {task.subtask_count > 0 && (
        <div className="mt-2 flex items-center gap-1 text-xs text-mb-muted">
          <Check size={12} />
          {task.subtask_done_count}/{task.subtask_count}
        </div>
      )}
      {task.note_id && (
        <button
          type="button"
          onClick={event => {
            event.stopPropagation();
            onNoteClick?.(task.note_id!);
          }}
          className="mt-2 inline-flex max-w-full items-center gap-1 rounded-md border border-mb-border px-1.5 py-0.5 text-xs text-mb-muted hover:text-mb-accent"
        >
          <FileText size={10} />
          <span className="truncate">{task.note_title || 'Source note'}</span>
        </button>
      )}
    </div>
  );
}

function AddTaskInput({
  status,
  onAdd,
}: {
  status: Task['status'];
  onAdd: (title: string, status: Task['status']) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
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
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-mb-muted hover:bg-mb-hover hover:text-mb-primary"
      >
        <Plus size={14} />
        Add task
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-3 flex gap-2">
      <input
        autoFocus
        value={value}
        onChange={event => setValue(event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Escape') { setValue(''); setOpen(false); }
        }}
        placeholder="Task title..."
        className="min-w-0 flex-1 rounded-lg border border-mb-border bg-mb-surface px-3 py-2 text-sm text-mb-primary placeholder:text-mb-muted outline-none focus:border-mb-accent"
      />
      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="rounded-lg bg-mb-accent px-3 py-2 text-white disabled:opacity-50"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
      </button>
    </form>
  );
}
