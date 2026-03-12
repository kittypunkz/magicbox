import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Save, Clock, Folder, Check } from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';
import { useNote } from '../hooks/useNotes';
import { useFolders } from '../hooks/useFolders';
import { useRecentNotes } from '../hooks/useRecentNotes';
import type { Note } from '../types';

// Dark mode colors
const c = {
  bg: 'bg-[#191919]',
  sidebar: 'bg-[#202020]',
  hover: 'hover:bg-[#2a2a2a]',
  text: 'text-[#e6e6e6]',
  gray: 'text-[#6b6b6b]',
  border: 'border-[#2f2f2f]',
  input: 'bg-[#2a2a2a]',
};

interface NoteEditorProps {
  noteId: number;
  onBack: () => void;
  onUpdate?: (note: Note) => void;
}

export function NoteEditor({ noteId, onBack, onUpdate }: NoteEditorProps) {
  const { note, loading, error, updateNote } = useNote(noteId);
  const { folders } = useFolders();
  const { addRecentNote } = useRecentNotes();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [folderId, setFolderId] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showFolderSelect, setShowFolderSelect] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content || '');
      setFolderId(note.folder_id);
      addRecentNote(note);
    }
  }, [note, addRecentNote]);

  const save = useCallback(async () => {
    if (!note) return;
    
    const updates: { title?: string; content?: string; folder_id?: number } = {};
    if (title !== note.title) updates.title = title;
    if (content !== note.content) updates.content = content;
    if (folderId !== note.folder_id) updates.folder_id = folderId;
    
    if (Object.keys(updates).length === 0) return;
    
    setSaving(true);
    const updated = await updateNote(updates);
    setSaving(false);
    setLastSaved(new Date());
    if (updated) {
      onUpdate?.(updated);
    }
  }, [note, title, content, folderId, updateNote, onUpdate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      save();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [title, content, folderId, save]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className={`flex flex-col items-center justify-center h-full ${c.gray}`}>
        <p>Error loading note</p>
        <button onClick={onBack} className="mt-4 text-blue-500 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  const currentFolder = folders.find((f) => f.id === folderId);

  return (
    <div className={`h-full flex flex-col bg-[#202020]`}>
      {/* Header */}
      <div className={`flex items-center gap-4 px-6 py-4 border-b ${c.border}`}>
        <button
          onClick={() => {
            save();
            onBack();
          }}
          className={`p-2 ${c.hover} rounded-lg transition-colors`}
        >
          <ArrowLeft size={20} className={c.text} />
        </button>
        
        <div className="flex-1">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
            className={`w-full text-xl font-semibold bg-transparent outline-none placeholder-[#4b5563] ${c.text}`}
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Folder selector */}
          <div className="relative">
            <button
              onClick={() => setShowFolderSelect(!showFolderSelect)}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm ${c.gray} ${c.hover} rounded-lg transition-colors`}
            >
              <Folder size={16} className="text-blue-500" />
              {currentFolder?.name || 'Inbox'}
            </button>
            
            {showFolderSelect && (
              <div className={`absolute top-full right-0 mt-2 w-48 ${c.input} border ${c.border} rounded-lg shadow-lg z-10`}>
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => {
                      setFolderId(folder.id);
                      setShowFolderSelect(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2 text-sm ${c.hover} first:rounded-t-lg last:rounded-b-lg ${
                      folder.id === folderId ? 'bg-blue-900/20 text-blue-400' : c.text
                    }`}
                  >
                    {folder.name}
                    {folder.id === folderId && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Save status */}
          <div className={`flex items-center gap-2 text-xs ${c.gray}`}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b border-current" />
                Saving...
              </>
            ) : lastSaved ? (
              <>
                <Clock size={12} />
                Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </>
            ) : null}
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            <Save size={16} />
            Save
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden" data-color-mode="dark">
        <MDEditor
          value={content}
          onChange={(val) => setContent(val || '')}
          height="100%"
          visibleDragbar={false}
          preview="edit"
          hideToolbar={false}
          textareaProps={{
            placeholder: 'Start writing...',
          }}
        />
      </div>
    </div>
  );
}
