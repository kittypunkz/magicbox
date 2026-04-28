import { useState, useEffect, useRef } from 'react';
import { X, Trash2, Loader2, Plus, Check } from 'lucide-react';
import { tasksAPI, subtasksAPI } from '../api/client';
import type { Task, Subtask } from '../types';

interface TaskDetailModalProps {
  taskId: number | null;
  onClose: () => void;
  onTaskUpdated: (task: Task) => void;
}

const c = {
  text: 'text-[#e6e6e6]',
  gray: 'text-[#888888]',
  border: 'border-[#2a2a2a]',
  input: 'bg-[#242424]',
};

export function TaskDetailModal({ taskId, onClose, onTaskUpdated }: TaskDetailModalProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [addingSubtask, setAddingSubtask] = useState(false);
  const newSubtaskRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!taskId) return;
    setLoading(true);
    tasksAPI.getById(taskId).then(t => {
      setTask(t);
      setDescription(t.description ?? '');
      setSubtasks(t.subtasks ?? []);
    }).finally(() => setLoading(false));
  }, [taskId]);

  const saveDescription = async () => {
    if (!task) return;
    const trimmed = description.trim();
    if (trimmed === (task.description ?? '')) return;
    const updated = await tasksAPI.update(task.id, { description: trimmed || null });
    setTask(updated);
    onTaskUpdated(updated);
  };

  const toggleSubtask = async (sub: Subtask) => {
    const optimistic = subtasks.map(s => s.id === sub.id ? { ...s, done: sub.done ? 0 : 1 } : s);
    setSubtasks(optimistic);
    try {
      const updated = await subtasksAPI.update(task!.id, sub.id, { done: !sub.done });
      setSubtasks(prev => prev.map(s => s.id === sub.id ? updated : s));
      // Refresh task counts
      const updatedTask = await tasksAPI.getById(task!.id);
      setTask(updatedTask);
      onTaskUpdated(updatedTask);
    } catch {
      setSubtasks(prev => prev.map(s => s.id === sub.id ? sub : s));
    }
  };

  const deleteSubtask = async (sub: Subtask) => {
    setSubtasks(prev => prev.filter(s => s.id !== sub.id));
    try {
      await subtasksAPI.delete(task!.id, sub.id);
      const updatedTask = await tasksAPI.getById(task!.id);
      setTask(updatedTask);
      onTaskUpdated(updatedTask);
    } catch {
      setSubtasks(prev => [...prev, sub]);
    }
  };

  const addSubtask = async () => {
    const title = newSubtask.trim();
    if (!title || !task) return;
    setAddingSubtask(true);
    try {
      const sub = await subtasksAPI.create(task.id, title);
      setSubtasks(prev => [...prev, sub]);
      setNewSubtask('');
      const updatedTask = await tasksAPI.getById(task.id);
      setTask(updatedTask);
      onTaskUpdated(updatedTask);
      newSubtaskRef.current?.focus();
    } finally {
      setAddingSubtask(false);
    }
  };

  if (!taskId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">

        {/* Header */}
        <div className={`flex items-start justify-between gap-3 px-5 py-4 border-b ${c.border}`}>
          <div className="flex-1 min-w-0">
            {task ? (
              <h2 className={`text-base font-semibold ${c.text} leading-snug`}>{task.title}</h2>
            ) : (
              <div className="h-5 w-48 bg-[#242424] rounded animate-pulse" />
            )}
          </div>
          <button onClick={onClose} className={`p-1 ${c.gray} hover:text-[#e6e6e6] transition-colors flex-shrink-0`}>
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <Loader2 size={20} className={`animate-spin ${c.gray}`} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

            {/* Description */}
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${c.gray} mb-2`}>Description</p>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                onBlur={saveDescription}
                placeholder="Add a description…"
                rows={4}
                className={`w-full ${c.input} border ${c.border} rounded-lg px-3 py-2.5 text-sm ${c.text} placeholder-[#5a5a5a] resize-none outline-none focus:border-[#4f4f4f] transition-colors`}
              />
            </div>

            {/* Subtasks */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className={`text-xs font-semibold uppercase tracking-wider ${c.gray}`}>Subtasks</p>
                {subtasks.length > 0 && (
                  <span className={`text-xs ${c.gray}`}>
                    {subtasks.filter(s => s.done).length}/{subtasks.length}
                  </span>
                )}
              </div>

              {/* Subtask list */}
              <div className="space-y-1 mb-2">
                {subtasks.map(sub => (
                  <div key={sub.id} className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[#242424] group transition-colors`}>
                    <button
                      onClick={() => toggleSubtask(sub)}
                      className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        sub.done
                          ? 'bg-[#faff69] border-[#faff69]'
                          : `border-[#5a5a5a] hover:border-[#faff69]`
                      }`}
                    >
                      {sub.done ? <Check size={10} className="text-[#0a0a0a]" strokeWidth={3} /> : null}
                    </button>
                    <span className={`flex-1 text-sm ${sub.done ? 'line-through text-[#5a5a5a]' : c.text}`}>
                      {sub.title}
                    </span>
                    <button
                      onClick={() => deleteSubtask(sub)}
                      className={`opacity-0 group-hover:opacity-100 p-0.5 ${c.gray} hover:text-red-400 transition-all`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add subtask input */}
              <div className={`flex items-center gap-2 ${c.input} border ${c.border} rounded-lg px-3 py-2`}>
                <Plus size={14} className={c.gray} />
                <input
                  ref={newSubtaskRef}
                  value={newSubtask}
                  onChange={e => setNewSubtask(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') addSubtask();
                    if (e.key === 'Escape') setNewSubtask('');
                  }}
                  placeholder="Add subtask…"
                  className={`flex-1 bg-transparent text-sm ${c.text} placeholder-[#5a5a5a] outline-none`}
                />
                {addingSubtask
                  ? <Loader2 size={14} className={`animate-spin ${c.gray}`} />
                  : newSubtask.trim() && (
                    <button onClick={addSubtask} className="text-xs text-[#faff69] hover:text-[#faff69] transition-colors">
                      Add
                    </button>
                  )
                }
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
