import { useState, useEffect } from 'react';
import { CheckSquare, Square, X, Loader2, AlertCircle, ChevronRight } from 'lucide-react';

interface SuggestedTask {
  title: string;
  subtasks: string[];
  selected: boolean;
}

interface TaskConfirmModalProps {
  isOpen: boolean;
  noteId: number;
  noteTitle: string;
  suggestions: { title: string; subtasks?: string[] }[];
  onConfirm: (tasks: { title: string; subtasks: string[] }[], noteId: number) => Promise<void>;
  onClose: () => void;
}

export function TaskConfirmModal({
  isOpen,
  noteId,
  noteTitle,
  suggestions,
  onConfirm,
  onClose,
}: TaskConfirmModalProps) {
  const [tasks, setTasks] = useState<SuggestedTask[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTasks(suggestions.map(s => ({ title: s.title, subtasks: s.subtasks ?? [], selected: true })));
    }
  }, [isOpen, suggestions]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggle = (i: number) =>
    setTasks(prev => prev.map((t, idx) => idx === i ? { ...t, selected: !t.selected } : t));

  const selected = tasks.filter(t => t.selected);

  const handleConfirm = async () => {
    if (selected.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await onConfirm(selected.map(t => ({ title: t.title, subtasks: t.subtasks })), noteId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save tasks');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a] flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-[#e6e6e6]">Extracted Tasks</h2>
            <p className="text-xs text-[#888888] mt-0.5 truncate max-w-[280px]">from: {noteTitle}</p>
          </div>
          <button onClick={onClose} className="text-[#888888] hover:text-[#e6e6e6] transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {tasks.length === 0 ? (
            <p className="text-sm text-[#888888] text-center py-4">No tasks found in this note.</p>
          ) : (
            tasks.map((task, i) => (
              <button
                key={i}
                onClick={() => toggle(i)}
                className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                  task.selected
                    ? 'border-[#6366f1]/40 bg-[#6366f1]/10'
                    : 'border-[#2a2a2a] bg-[#0a0a0a] opacity-60'
                }`}
              >
                {task.selected
                  ? <CheckSquare size={16} className="text-[#6366f1] flex-shrink-0 mt-0.5" />
                  : <Square size={16} className="text-[#888888] flex-shrink-0 mt-0.5" />
                }
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-[#e6e6e6]">{task.title}</span>
                  {task.subtasks.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5">
                      {task.subtasks.map((sub, j) => (
                        <li key={j} className="flex items-start gap-1.5 text-xs text-[#8b8b8b]">
                          <ChevronRight size={10} className="flex-shrink-0 mt-0.5" />
                          <span>{sub}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {error && (
          <div className="px-4 pb-2 flex items-start gap-2">
            <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        <div className="p-4 border-t border-[#2a2a2a] flex gap-2 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-[#2a2a2a] text-[#888888] rounded-lg text-sm hover:text-[#e6e6e6] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving || selected.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#6366f1] hover:bg-[#4f46e5] text-[#0a0a0a] disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
          >
            {saving ? (
              <><Loader2 size={14} className="animate-spin" /> Saving...</>
            ) : (
              `Save ${selected.length} task${selected.length !== 1 ? 's' : ''}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
