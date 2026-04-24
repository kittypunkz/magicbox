import { useState, useEffect } from 'react';
import { CheckSquare, Square, X, Loader2, AlertCircle } from 'lucide-react';

interface SuggestedTask {
  title: string;
  selected: boolean;
}

interface TaskConfirmModalProps {
  isOpen: boolean;
  noteId: number;
  noteTitle: string;
  suggestions: { title: string }[];
  onConfirm: (titles: string[], noteId: number) => Promise<void>;
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
      setTasks(suggestions.map(s => ({ ...s, selected: true })));
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
      await onConfirm(selected.map(t => t.title), noteId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save tasks');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#202020] border border-[#2f2f2f] rounded-xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[#2f2f2f] flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-[#e6e6e6]">Extracted Tasks</h2>
            <p className="text-xs text-[#6b6b6b] mt-0.5 truncate max-w-[280px]">from: {noteTitle}</p>
          </div>
          <button onClick={onClose} className="text-[#6b6b6b] hover:text-[#e6e6e6] transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {tasks.length === 0 ? (
            <p className="text-sm text-[#6b6b6b] text-center py-4">No tasks found in this note.</p>
          ) : (
            tasks.map((task, i) => (
              <button
                key={i}
                onClick={() => toggle(i)}
                className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                  task.selected
                    ? 'border-blue-500/40 bg-blue-500/10'
                    : 'border-[#2f2f2f] bg-[#191919] opacity-60'
                }`}
              >
                {task.selected
                  ? <CheckSquare size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                  : <Square size={16} className="text-[#6b6b6b] flex-shrink-0 mt-0.5" />
                }
                <span className="text-sm text-[#e6e6e6]">{task.title}</span>
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

        <div className="p-4 border-t border-[#2f2f2f] flex gap-2 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-[#2f2f2f] text-[#6b6b6b] rounded-lg text-sm hover:text-[#e6e6e6] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving || selected.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
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
