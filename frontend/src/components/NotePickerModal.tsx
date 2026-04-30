import { useState, useEffect, useRef } from 'react';
import { Search, FileText, Loader2, X } from 'lucide-react';
import { searchAPI, notesAPI } from '../api/client';
import type { Note } from '../types';

interface NotePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (note: Note) => void;
}

export function NotePickerModal({ isOpen, onClose, onConfirm }: NotePickerModalProps) {
  const [query, setQuery] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Note | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelected(null);
      setNotes([]);
      setTimeout(() => inputRef.current?.focus(), 50);
      loadRecent();
    }
  }, [isOpen]);

  const loadRecent = async () => {
    setLoading(true);
    try {
      const data = await notesAPI.getAll();
      setNotes(data.slice(0, 10));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!query.trim()) { loadRecent(); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchAPI.search(query);
        setNotes(res.data ?? []);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a]">
          <span className="text-sm font-semibold text-[#e6e6e6]">Link a note</span>
          <button onClick={onClose} className="p-1 text-[#888888] hover:text-[#e6e6e6] transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2a2a2a]">
          <Search size={14} className="text-[#888888] flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search notes…"
            className="flex-1 bg-transparent text-sm text-[#e6e6e6] placeholder-[#5a5a5a] outline-none"
          />
          {loading && <Loader2 size={14} className="text-[#888888] animate-spin flex-shrink-0" />}
        </div>

        {/* Results */}
        <div className="overflow-y-auto max-h-64">
          {notes.length === 0 && !loading ? (
            <p className="text-center text-sm text-[#888888] py-8">No notes found</p>
          ) : (
            notes.map(note => (
              <button
                key={note.id}
                onClick={() => setSelected(selected?.id === note.id ? null : note)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-[#2a2a2a] last:border-0 ${
                  selected?.id === note.id
                    ? 'bg-[#6366f1]/10 text-[#6366f1]'
                    : 'text-[#e6e6e6] hover:bg-[#242424]'
                }`}
              >
                <FileText size={14} className="flex-shrink-0 text-[#888888]" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{note.title || 'Untitled'}</p>
                  {note.folder_name && (
                    <p className="text-xs text-[#888888] truncate">#{note.folder_name}</p>
                  )}
                </div>
                {selected?.id === note.id && (
                  <div className="w-2 h-2 rounded-full bg-[#6366f1] flex-shrink-0" />
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[#2a2a2a]">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-[#888888] hover:text-[#e6e6e6] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => selected && onConfirm(selected)}
            disabled={!selected}
            className="px-4 py-1.5 bg-[#6366f1] hover:bg-[#4f46e5] text-[#0a0a0a] disabled:opacity-50 text-sm rounded-lg transition-colors"
          >
            Link note
          </button>
        </div>
      </div>
    </div>
  );
}
