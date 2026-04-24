import { useState } from 'react';
import { CheckSquare, Square, Trash2, Plus, Loader2, AlertCircle } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import type { Task } from '../types';

const c = {
  bg: 'bg-[#191919]',
  text: 'text-[#e6e6e6]',
  gray: 'text-[#6b6b6b]',
  border: 'border-[#2f2f2f]',
  input: 'bg-[#2a2a2a]',
};

function TaskItem({
  task,
  onToggle,
  onDelete,
  onNoteClick,
}: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onNoteClick?: (noteId: number) => void;
}) {
  const isDone = task.status === 'done';
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${c.border} bg-[#202020] group`}>
      <button
        onClick={onToggle}
        className={`mt-0.5 flex-shrink-0 transition-colors ${isDone ? 'text-green-400' : c.gray}`}
      >
        {isDone ? <CheckSquare size={18} /> : <Square size={18} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${isDone ? 'line-through text-[#4b4b4b]' : c.text}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className={`text-xs ${c.gray}`}>
            {new Date(task.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          {task.note_id && onNoteClick && (
            <button
              onClick={() => onNoteClick(task.note_id!)}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              View source note →
            </button>
          )}
        </div>
      </div>
      <button
        onClick={onDelete}
        className={`flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${c.gray} hover:text-red-400`}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

interface TasksPageProps {
  onNoteClick?: (noteId: number) => void;
}

export function TasksPage({ onNoteClick }: TasksPageProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);

  const statusFilter = filter === 'all' ? undefined : filter;
  const { tasks, loading, error, createTask, toggleTask, deleteTask } = useTasks(statusFilter);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      await createTask(newTitle.trim());
      setNewTitle('');
    } finally {
      setAdding(false);
    }
  };

  const pending = tasks.filter(t => t.status === 'pending').length;
  const done = tasks.filter(t => t.status === 'done').length;

  return (
    <div className={`h-full overflow-y-auto ${c.bg}`}>
      {/* Header */}
      <div className={`sticky top-0 bg-[#202020] border-b ${c.border} px-4 sm:px-8 py-4 sm:py-6 z-10`}>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#2a2a2a] rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckSquare size={24} className={c.gray} />
          </div>
          <div>
            <h1 className={`text-lg sm:text-2xl font-bold ${c.text}`}>Tasks</h1>
            <p className={`text-xs sm:text-sm ${c.gray}`}>{pending} pending · {done} done</p>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 py-4 sm:py-6 space-y-4">
        {/* Add task */}
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Add a task..."
            className={`flex-1 px-3 py-2.5 ${c.input} border ${c.border} rounded-lg ${c.text} placeholder-[#4b4b4b] text-sm focus:outline-none focus:border-blue-500 transition-colors`}
          />
          <button
            type="submit"
            disabled={adding || !newTitle.trim()}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          </button>
        </form>

        {/* Filter tabs */}
        <div className="flex gap-1">
          {(['all', 'pending', 'done'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                filter === f ? 'bg-blue-500 text-white' : `${c.gray} hover:text-[#e6e6e6] hover:bg-[#2a2a2a]`
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Task list */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className={`animate-spin ${c.gray}`} />
          </div>
        ) : tasks.length === 0 ? (
          <div className={`text-center py-12 ${c.gray}`}>
            <CheckSquare size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No tasks yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={() => toggleTask(task.id, task.status)}
                onDelete={() => deleteTask(task.id)}
                onNoteClick={onNoteClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
