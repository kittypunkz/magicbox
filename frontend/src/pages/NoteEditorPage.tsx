import { useState, useEffect, useCallback } from 'react';
import { Pin, PinOff, Folder, Loader2, CheckCircle } from 'lucide-react';
import { useNote } from '../hooks/useNotes';
import { useFolders } from '../hooks/useFolders';
import { useSettings } from '../hooks/useSettings';
import { MarkdownEditor } from '../components/MarkdownEditor';
import type { Note } from '../types';

const c = {
  bg: 'bg-[#0a0a0a]',
  text: 'text-[#e6e6e6]',
  gray: 'text-[#888888]',
  border: 'border-[#2a2a2a]',
};

interface NoteEditorPageProps {
  noteId: number;
  onBack: () => void;
  onUpdate?: (note: Note) => void;
  onDelete?: (id: number) => void;
}

export function NoteEditorPage({ noteId, onBack, onUpdate, onDelete }: NoteEditorPageProps) {
  const { note, loading, error, updateNote } = useNote(noteId);
  const { folders } = useFolders();
  const { settings } = useSettings();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [folderId, setFolderId] = useState<number>(1);
  const [isPinned, setIsPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showFolderPicker, setShowFolderPicker] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content || '');
      setFolderId(note.folder_id);
      setIsPinned(note.is_pinned === 1);
    }
  }, [note]);

  const save = useCallback(async () => {
    if (!note) return;
    const updates: { title?: string; content?: string; folder_id?: number; is_pinned?: boolean } = {};
    if (title !== note.title) updates.title = title;
    if (content !== note.content) updates.content = content;
    if (folderId !== note.folder_id) updates.folder_id = folderId;
    if (isPinned !== (note.is_pinned === 1)) updates.is_pinned = isPinned;
    if (Object.keys(updates).length === 0) return;

    setSaving(true);
    const updated = await updateNote(updates);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (updated) onUpdate?.(updated);
  }, [note, title, content, folderId, isPinned, updateNote, onUpdate]);

  // Auto-save with configurable debounce
  useEffect(() => {
    const t = setTimeout(() => save(), settings.autosaveDelayMs);
    return () => clearTimeout(t);
  }, [title, content, folderId, isPinned, save, settings.autosaveDelayMs]);

  const togglePin = useCallback(async () => {
    const next = !isPinned;
    setIsPinned(next);
    if (note) {
      await updateNote({ is_pinned: next });
    }
  }, [isPinned, note, updateNote]);

  const handleDelete = async () => {
    if (!note || !confirm('Delete this note?')) return;
    onDelete?.(note.id);
    onBack();
  };

  const currentFolder = folders.find(f => f.id === folderId);

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-full ${c.bg}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#faff69]" />
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className={`flex flex-col items-center justify-center h-full ${c.gray} ${c.bg}`}>
        <p>Error loading note</p>
        <button onClick={onBack} className="mt-4 text-[#faff69] hover:underline">Go back</button>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${c.bg}`}>
      {/* Toolbar */}
      <div className={`flex items-center gap-2 px-4 py-2 border-b ${c.border} bg-[#1a1a1a]/50`}>
        {/* Folder picker */}
        <div className="relative">
          <button
            onClick={() => setShowFolderPicker(!showFolderPicker)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border ${c.border} ${c.gray} hover:text-[#e6e6e6] hover:bg-[#242424] transition-colors`}
          >
            <Folder size={12} />
            <span>{currentFolder?.name || 'No folder'}</span>
          </button>
          {showFolderPicker && (
            <div className={`absolute top-full mt-1 left-0 w-48 bg-[#1a1a1a] border ${c.border} rounded-lg shadow-lg py-1 z-50`}>
              {folders.map(f => (
                <button
                  key={f.id}
                  onClick={() => { setFolderId(f.id); setShowFolderPicker(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                    f.id === folderId ? 'text-[#faff69] bg-[#faff69]/10' : `${c.gray} hover:text-[#e6e6e6] hover:bg-[#242424]`
                  }`}
                >
                  <Folder size={14} />
                  {f.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Save indicator */}
        <span className={`text-xs ${c.gray} flex items-center gap-1`}>
          {saving && <Loader2 size={12} className="animate-spin" />}
          {saved && <><CheckCircle size={12} className="text-green-400" /> Saved</>}
        </span>

        {/* Pin */}
        <button
          onClick={togglePin}
          className={`p-1.5 rounded-lg transition-colors ${isPinned ? 'text-[#faff69]' : `${c.gray} hover:text-[#e6e6e6]`}`}
          title={isPinned ? 'Unpin' : 'Pin'}
        >
          {isPinned ? <Pin size={16} /> : <PinOff size={16} />}
        </button>

        {/* Delete */}
        <button
          onClick={handleDelete}
          className={`p-1.5 rounded-lg ${c.gray} hover:text-red-400 transition-colors`}
          title="Delete note"
        >
          ×
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-3xl mx-auto w-full">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Untitled"
          className={`w-full bg-transparent text-2xl font-bold ${c.text} placeholder-[#5a5a5a] outline-none mb-6`}
        />

        {/* Body */}
        <MarkdownEditor
          value={content}
          onChange={setContent}
          placeholder="Start writing in Markdown..."
        />
      </div>
    </div>
  );
}
