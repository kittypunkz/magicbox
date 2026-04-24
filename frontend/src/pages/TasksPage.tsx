import { useState } from 'react';
import { CheckSquare, Square, Trash2, Plus, Loader2, AlertCircle, ArrowRight, ArrowLeft, RotateCcw } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { ConfirmModal } from '../components/ConfirmModal';
import type { Task } from '../types';

const c = {
  bg: 'bg-[#191919]',
  text: 'text-[#e6e6e6]',
  gray: 'text-[#6b6b6b]',
  border: 'border-[#2f2f2f]',
  input: 'bg-[#2a2a2a]',
};

const COLUMNS: { status: Task['status']; label: string; color: string }[] = [
  { status: 'backlog', label: 'Backlog',  color: 'text-[#6b6b6b]' },
  { status: 'doing',   label: 'Doing',   color: 'text-blue-400'   },
  { status: 'done',    label: 'Done',    color: 'text-green-400'  },
];

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

function TaskCard({
  task,
  onMove,
  onDelete,
  onRename,
  onNoteClick,
}: {
  task: Task;
  onMove: (status: Task['status']) => void;
  onDelete: () => void;
  onRename: (title: string) => void;
  onNoteClick?: (noteId: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const [confirmUndo, setConfirmUndo] = useState(false);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== task.title) onRename(trimmed);
    else setDraft(task.title);
  };

  return (
    <>
      <div className={`p-3 rounded-lg border ${c.border} bg-[#202020] group flex flex-col gap-2`}>
        {/* Title */}
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
            className={`w-full text-sm bg-transparent border-b border-blue-500 outline-none ${c.text} pb-0.5`}
          />
        ) : (
          <p
            onClick={() => task.status !== 'done' && setEditing(true)}
            className={`text-sm leading-snug ${
              task.status === 'done'
                ? 'line-through text-[#4b4b4b]'
                : `${c.text} cursor-text hover:text-white`
            }`}
          >
            {task.title}
          </p>
        )}

        {/* Date */}
        <p className={`text-xs ${c.gray}`}>
          {task.status === 'done' && task.completed_at
            ? `Completed ${formatDateTime(task.completed_at)}`
            : `Created ${formatDate(task.created_at)}`}
        </p>

        {task.note_id && onNoteClick && (
          <button
            onClick={() => onNoteClick(task.note_id!)}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors text-left"
          >
            View source note →
          </button>
        )}

        {/* Actions row */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1">
            {task.status === 'backlog' && (
              <button
                onClick={() => onMove('doing')}
                title="Move to Doing"
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${c.gray} hover:text-blue-400 hover:bg-[#2a2a2a] transition-colors`}
              >
                <ArrowRight size={12} /> Doing
              </button>
            )}
            {task.status === 'doing' && (
              <>
                <button
                  onClick={() => onMove('backlog')}
                  title="Move to Backlog"
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${c.gray} hover:text-[#e6e6e6] hover:bg-[#2a2a2a] transition-colors`}
                >
                  <ArrowLeft size={12} /> Backlog
                </button>
                <button
                  onClick={() => onMove('done')}
                  title="Mark Done"
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${c.gray} hover:text-green-400 hover:bg-[#2a2a2a] transition-colors`}
                >
                  <CheckSquare size={12} /> Done
                </button>
              </>
            )}
            {task.status === 'done' && (
              <button
                onClick={() => setConfirmUndo(true)}
                title="Move back to Doing"
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${c.gray} hover:text-yellow-400 hover:bg-[#2a2a2a] transition-colors`}
              >
                <RotateCcw size={12} /> Undo
              </button>
            )}
          </div>

          <button
            onClick={onDelete}
            className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all ${c.gray} hover:text-red-400`}
          >
            <Trash2 size={14} />
          </button>
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
  onAdd: (title: string, status: Task['status']) => Promise<void>;
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
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${c.gray} hover:text-[#e6e6e6] hover:bg-[#2a2a2a] transition-colors`}
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
        className={`flex-1 px-3 py-2 ${c.input} border ${c.border} rounded-lg ${c.text} placeholder-[#4b4b4b] text-sm focus:outline-none focus:border-blue-500 transition-colors`}
      />
      <button
        type="submit"
        disabled={loading || !value.trim()}
        className="px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
      </button>
    </form>
  );
}

interface TasksPageProps {
  onNoteClick?: (noteId: number) => void;
}

export function TasksPage({ onNoteClick }: TasksPageProps) {
  const { tasks, loading, error, createTask, moveTask, renameTask, deleteTask } = useTasks();

  const handleAdd = async (title: string, status: Task['status']) => {
    await createTask(title, status);
  };

  return (
    <div className={`h-full flex flex-col ${c.bg}`}>
      {/* Header */}
      <div className={`flex-shrink-0 bg-[#202020] border-b ${c.border} px-4 sm:px-8 py-4 sm:py-5`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#2a2a2a] rounded-xl flex items-center justify-center flex-shrink-0">
            <Square size={20} className={c.gray} />
          </div>
          <div>
            <h1 className={`text-lg sm:text-xl font-bold ${c.text}`}>Tasks</h1>
            <p className={`text-xs ${c.gray}`}>
              {tasks.filter(t => t.status === 'backlog').length} backlog ·{' '}
              {tasks.filter(t => t.status === 'doing').length} doing ·{' '}
              {tasks.filter(t => t.status === 'done').length} done
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex-shrink-0 mx-4 sm:mx-8 mt-4 flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Kanban columns */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={24} className={`animate-spin ${c.gray}`} />
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-4 p-4 sm:p-6 h-full min-w-[600px]">
            {COLUMNS.map(col => {
              const colTasks = tasks.filter(t => t.status === col.status);
              return (
                <div key={col.status} className="flex-1 flex flex-col min-w-[200px] max-w-sm">
                  {/* Column header */}
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${col.color}`}>
                      {col.label}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full bg-[#2a2a2a] ${c.gray}`}>
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {colTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onMove={status => moveTask(task.id, status)}
                        onDelete={() => deleteTask(task.id)}
                        onRename={title => renameTask(task.id, title)}
                        onNoteClick={onNoteClick}
                      />
                    ))}

                    {colTasks.length === 0 && (
                      <div className={`text-center py-8 text-xs ${c.gray} opacity-50`}>
                        No tasks
                      </div>
                    )}
                  </div>

                  {/* Add task */}
                  <div className="mt-3">
                    <AddTaskInput status={col.status} onAdd={handleAdd} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
