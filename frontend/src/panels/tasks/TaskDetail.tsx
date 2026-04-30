import { useEffect, useRef, useState } from 'react';
import { Check, FileText, Loader2, Plus, Trash2, X } from 'lucide-react';
import { subtasksAPI, tasksAPI } from '../../api/client';
import type { Subtask, Task } from '../../types';

interface TaskDetailProps {
  taskId: number | null;
  onClose: () => void;
  onTaskUpdated: (task: Task) => void;
  onDelete: (id: number) => void;
  onNoteClick?: (id: number) => void;
}

export function TaskDetail({ taskId, onClose, onTaskUpdated, onDelete, onNoteClick }: TaskDetailProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [description, setDescription] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!taskId) {
      setTask(null);
      setSubtasks([]);
      return;
    }
    setLoading(true);
    tasksAPI.getById(taskId)
      .then(next => {
        setTask(next);
        setDescription(next.description ?? '');
        setSubtasks(next.subtasks ?? []);
      })
      .finally(() => setLoading(false));
  }, [taskId]);

  if (!taskId) {
    return (
      <div className="hidden h-full w-[340px] shrink-0 items-center justify-center border-l border-mb-border bg-mb-base text-sm text-mb-muted lg:flex">
        Select a task
      </div>
    );
  }

  const updateTask = async (data: { status?: Task['status']; description?: string | null }) => {
    if (!task) return;
    const updated = await tasksAPI.update(task.id, data);
    setTask(updated);
    onTaskUpdated(updated);
  };

  const saveDescription = async () => {
    if (!task || description.trim() === (task.description ?? '')) return;
    await updateTask({ description: description.trim() || null });
  };

  const toggleSubtask = async (subtask: Subtask) => {
    if (!task) return;
    const done = !subtask.done;
    setSubtasks(prev => prev.map(item => item.id === subtask.id ? { ...item, done: done ? 1 : 0 } : item));
    const updatedSubtask = await subtasksAPI.update(task.id, subtask.id, { done });
    setSubtasks(prev => prev.map(item => item.id === subtask.id ? updatedSubtask : item));
    const updatedTask = await tasksAPI.getById(task.id);
    onTaskUpdated(updatedTask);
  };

  const addSubtask = async () => {
    const title = newSubtask.trim();
    if (!task || !title) return;
    setAdding(true);
    try {
      const subtask = await subtasksAPI.create(task.id, title);
      setSubtasks(prev => [...prev, subtask]);
      setNewSubtask('');
      const updatedTask = await tasksAPI.getById(task.id);
      onTaskUpdated(updatedTask);
      inputRef.current?.focus();
    } finally {
      setAdding(false);
    }
  };

  const deleteSubtask = async (subtask: Subtask) => {
    if (!task) return;
    setSubtasks(prev => prev.filter(item => item.id !== subtask.id));
    await subtasksAPI.delete(task.id, subtask.id);
    const updatedTask = await tasksAPI.getById(task.id);
    onTaskUpdated(updatedTask);
  };

  return (
    <aside className="flex h-full w-full shrink-0 flex-col border-l border-mb-border bg-mb-base lg:w-[360px]">
      <header className="flex items-center justify-between gap-3 border-b border-mb-border px-5 py-4">
        <h2 className="truncate text-base font-semibold text-mb-primary">Task Detail</h2>
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-mb-muted hover:bg-mb-hover hover:text-mb-primary">
          <X size={16} />
        </button>
      </header>

      {loading || !task ? (
        <div className="flex flex-1 items-center justify-center text-mb-muted">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <h3 className="mb-5 text-lg font-semibold leading-snug text-mb-primary">{task.title}</h3>

          <div className="mb-5 space-y-3 text-sm">
            <label className="block">
              <span className="mb-1.5 block text-xs uppercase tracking-wide text-mb-muted">Status</span>
              <select
                value={task.status}
                onChange={event => updateTask({ status: event.target.value as Task['status'] })}
                className="w-full rounded-lg border border-mb-border bg-mb-surface px-3 py-2 text-mb-primary outline-none focus:border-mb-accent"
              >
                <option value="backlog">Backlog</option>
                <option value="doing">Doing</option>
                <option value="done">Done</option>
              </select>
            </label>
            {task.note_id && (
              <button
                type="button"
                onClick={() => onNoteClick?.(task.note_id!)}
                className="inline-flex items-center gap-2 text-sm text-mb-muted hover:text-mb-accent"
              >
                <FileText size={14} />
                {task.note_title || 'Source note'}
              </button>
            )}
          </div>

          <label className="mb-5 block">
            <span className="mb-1.5 block text-xs uppercase tracking-wide text-mb-muted">Notes</span>
            <textarea
              value={description}
              onChange={event => setDescription(event.target.value)}
              onBlur={saveDescription}
              rows={4}
              placeholder="Add task notes..."
              className="w-full resize-none rounded-lg border border-mb-border bg-mb-surface px-3 py-2 text-sm text-mb-primary placeholder:text-mb-muted outline-none focus:border-mb-accent"
            />
          </label>

          <section className="mb-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-mb-muted">Subtasks</span>
              <span className="text-xs text-mb-muted">{subtasks.filter(s => s.done).length}/{subtasks.length}</span>
            </div>
            <div className="space-y-1">
              {subtasks.map(subtask => (
                <div key={subtask.id} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-mb-hover">
                  <button
                    type="button"
                    onClick={() => toggleSubtask(subtask)}
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      subtask.done ? 'border-mb-accent bg-mb-accent text-white' : 'border-mb-muted text-transparent hover:border-mb-accent'
                    }`}
                  >
                    <Check size={10} />
                  </button>
                  <span className={`min-w-0 flex-1 text-sm ${subtask.done ? 'text-mb-muted line-through' : 'text-mb-primary'}`}>
                    {subtask.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteSubtask(subtask)}
                    className="opacity-0 text-mb-muted hover:text-red-400 group-hover:opacity-100"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-mb-border bg-mb-surface px-3 py-2">
              <Plus size={14} className="text-mb-muted" />
              <input
                ref={inputRef}
                value={newSubtask}
                onChange={event => setNewSubtask(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') addSubtask();
                  if (event.key === 'Escape') setNewSubtask('');
                }}
                placeholder="Add subtask..."
                className="min-w-0 flex-1 bg-transparent text-sm text-mb-primary placeholder:text-mb-muted outline-none"
              />
              {adding ? <Loader2 size={14} className="animate-spin text-mb-muted" /> : null}
            </div>
          </section>

          <div className="flex gap-2 border-t border-mb-border pt-5">
            <button
              type="button"
              onClick={() => updateTask({ status: task.status === 'done' ? 'doing' : 'done' })}
              className="rounded-lg bg-mb-accent px-3 py-2 text-sm text-white hover:bg-mb-accent-hover"
            >
              {task.status === 'done' ? 'Mark Doing' : 'Mark Done'}
            </button>
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="rounded-lg border border-mb-border px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
