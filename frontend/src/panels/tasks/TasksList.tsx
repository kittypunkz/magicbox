import { useMemo, useState } from 'react';
import { LayoutDashboard, List, Plus } from 'lucide-react';
import type { Task } from '../../types';
import { TasksBoard } from './TasksBoard';

interface TasksListProps {
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

export function TasksList(props: TasksListProps) {
  const initialMode = typeof localStorage === 'undefined'
    ? 'board'
    : localStorage.getItem('magicbox.tasksView') === 'list' ? 'list' : 'board';
  const [mode, setMode] = useState<'board' | 'list'>(initialMode);
  const [status, setStatus] = useState<Task['status'] | 'all'>('all');

  const setViewMode = (next: 'board' | 'list') => {
    setMode(next);
    localStorage.setItem('magicbox.tasksView', next);
  };

  const filtered = useMemo(() => {
    return status === 'all' ? props.tasks : props.tasks.filter(task => task.status === status);
  }, [props.tasks, status]);

  return (
    <div className="flex h-full flex-col bg-mb-base">
      <header className="shrink-0 border-b border-mb-border px-4 py-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h1 className="text-base font-semibold text-mb-primary">Tasks</h1>
          <div className="flex items-center gap-1 rounded-lg bg-mb-surface p-1">
            <button
              type="button"
              onClick={() => setViewMode('board')}
              title="Board"
              className={`rounded-md p-1.5 ${mode === 'board' ? 'bg-mb-active text-mb-primary' : 'text-mb-muted hover:text-mb-primary'}`}
            >
              <LayoutDashboard size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              title="List"
              className={`rounded-md p-1.5 ${mode === 'list' ? 'bg-mb-active text-mb-primary' : 'text-mb-muted hover:text-mb-primary'}`}
            >
              <List size={15} />
            </button>
          </div>
        </div>
        {mode === 'list' && (
          <div className="flex flex-wrap gap-1.5">
            {(['all', 'backlog', 'doing', 'done'] as const).map(item => (
              <button
                key={item}
                type="button"
                onClick={() => setStatus(item)}
                className={`rounded-full px-2.5 py-1 text-xs capitalize ${
                  status === item ? 'bg-mb-accent text-white' : 'bg-mb-surface text-mb-muted hover:text-mb-primary'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </header>

      {mode === 'board' ? (
        <TasksBoard {...props} />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {filtered.map(task => (
            <button
              key={task.id}
              type="button"
              onClick={() => props.onSelectTask(task.id)}
              className={`mb-1 w-full border-l-2 px-3 py-2.5 text-left transition-colors ${
                props.selectedTaskId === task.id ? 'border-mb-accent bg-mb-active' : 'border-transparent hover:bg-mb-hover'
              }`}
            >
              <div className="truncate text-sm text-mb-primary">{task.title}</div>
              <div className="mt-0.5 text-xs capitalize text-mb-muted">{task.status}{task.note_title ? ` · ${task.note_title}` : ''}</div>
            </button>
          ))}
          <button
            type="button"
            onClick={() => props.onCreateTask('New task', status === 'all' ? 'backlog' : status)}
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-mb-muted hover:bg-mb-hover hover:text-mb-primary"
          >
            <Plus size={14} />
            New Task
          </button>
        </div>
      )}
    </div>
  );
}
