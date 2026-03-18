import { useEffect, useRef, useCallback, useState } from 'react';
import { ArrowLeft, MoreVertical, Trash2 } from 'lucide-react';
import { useNote } from '../hooks/useNotes';
import { useFolders } from '../hooks/useFolders';
import { useRecentNotes } from '../hooks/useRecentNotes';
import { ConfirmModal } from './ConfirmModal';
import type { Note } from '../types';

const c = {
  bg: 'bg-[#191919]',
  sidebar: 'bg-[#202020]',
  hover: 'hover:bg-[#2a2a2a]',
  text: 'text-[#e6e6e6]',
  gray: 'text-[#6b6b6b]',
  border: 'border-[#2f2f2f]',
  placeholder: 'placeholder-[#4b5563]',
  input: 'bg-[#2a2a2a]',
};

interface BlockEditorProps {
  noteId: number;
  onBack: () => void;
  onUpdate?: (note: Note) => void;
  onDelete?: (id: number) => void;
}

export function BlockEditor({ noteId, onBack, onUpdate, onDelete }: BlockEditorProps) {
  const { note, loading, error, updateNote } = useNote(noteId);
  const { folders } = useFolders();
  const { addRecentNote } = useRecentNotes();
  
  const [title, setTitle] = useState('');
  const [folderId, setFolderId] = useState<number>(1);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const [showNoteMenu, setShowNoteMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load note data - only when note ID changes, not on every update
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setFolderId(note.folder_id);
      setContent(note.content || '');
      addRecentNote(note);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note?.id]);  // Only re-run when note ID changes

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  // Save function
  const saveNote = useCallback(async () => {
    if (!note) return;
    
    const updates: { title?: string; content?: string; folder_id?: number } = {};
    if (title !== note.title) updates.title = title;
    if (content !== note.content) updates.content = content;
    if (folderId !== note.folder_id) updates.folder_id = folderId;
    
    if (Object.keys(updates).length === 0) return;
    
    setSaving(true);
    try {
      const updated = await updateNote(updates);
      setLastSaved(new Date());
      if (updated) {
        onUpdate?.(updated);
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  }, [note, title, content, folderId, updateNote, onUpdate]);

  // Debounced save
  const triggerSave = useCallback(() => {
    setSaving(true);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveNote();
    }, 800);
  }, [saveNote]);

  // Handle content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    triggerSave();
  };

  // Handle checkbox toggle on click
  const handleTextareaClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const cursorPosition = textarea.selectionStart;
    const text = textarea.value;
    
    // Find the line where cursor is
    const lineStart = text.lastIndexOf('\n', cursorPosition - 1) + 1;
    const lineEnd = text.indexOf('\n', cursorPosition);
    const line = text.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
    
    // Check if line starts with [ ] or [x]
    const checkboxMatch = line.match(/^(\[ \]|\[x\])\s/);
    if (checkboxMatch) {
      // Calculate position of the bracket in the line
      const bracketPos = lineStart + checkboxMatch.index! + 1;
      // Check if click was near the checkbox (within brackets)
      if (Math.abs(cursorPosition - bracketPos) <= 2) {
        e.preventDefault();
        const isChecked = checkboxMatch[1] === '[x]';
        const newLine = line.replace(/^(\[ \]|\[x\])/, isChecked ? '[ ]' : '[x]');
        const newContent = text.slice(0, lineStart) + newLine + text.slice(lineEnd === -1 ? text.length : lineEnd);
        setContent(newContent);
        triggerSave();
      }
    }
  };

  // Handle key commands
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveNote();
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!note) return;
    await onDelete?.(note.id);
    setShowDeleteModal(false);
    onBack();
  };

  // Force save before leaving
  const handleBack = async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    await saveNote();
    onBack();
  };

  // Get folder name
  const currentFolder = folders.find((f) => f.id === folderId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#191919]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className={`flex flex-col items-center justify-center h-full ${c.gray} bg-[#191919]`}>
        <p>Error loading note</p>
        <button onClick={onBack} className="mt-4 text-blue-500 hover:underline">Go back</button>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${c.bg}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-6 py-3 border-b ${c.border}`}>
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className={`p-2 ${c.hover} rounded-lg transition-colors ${c.text}`}
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowFolderMenu(!showFolderMenu)}
              className={`text-sm ${c.gray} hover:text-[#e6e6e6] transition-colors`}
              data-area-id="editor-save-status"
            >
              {currentFolder?.name || 'Inbox'}
              {saving && <span className="ml-2 text-xs opacity-50">• saving</span>}
              {lastSaved && !saving && <span className="ml-2 text-xs opacity-50">• saved</span>}
            </button>
            
            {showFolderMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowFolderMenu(false)} />
                <div className={`absolute top-full left-0 mt-2 w-48 ${c.sidebar} border ${c.border} rounded-lg shadow-lg z-50 py-1`}>
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => { setFolderId(folder.id); setShowFolderMenu(false); }}
                      className={`w-full text-left px-4 py-2 text-sm ${c.hover} transition-colors ${
                        folder.id === folderId ? 'text-blue-400' : c.text
                      }`}
                    >
                      {folder.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="relative">
          <button onClick={() => setShowNoteMenu(!showNoteMenu)} className={`p-2 ${c.hover} rounded-lg ${c.gray}`}>
            <MoreVertical size={18} />
          </button>
          
          {showNoteMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNoteMenu(false)} />
              <div className={`absolute top-full right-0 mt-1 w-40 ${c.sidebar} border ${c.border} rounded-lg shadow-lg z-50 py-1`}>
                <button
                  onClick={() => { setShowNoteMenu(false); setShowDeleteModal(true); }}
                  className={`w-full text-left px-4 py-2 text-sm text-red-400 ${c.hover} flex items-center gap-2`}
                >
                  <Trash2 size={14} /> Delete note
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-8">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); triggerSave(); }}
            placeholder="Note title"
            className={`w-full text-4xl font-bold bg-transparent outline-none ${c.placeholder} ${c.text} mb-6`}
          />
          
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onClick={handleTextareaClick}
            onKeyDown={handleKeyDown}
            placeholder="Start typing...

Tip: Type [ ] for checkbox, [x] for checked"
            className={`w-full min-h-[400px] bg-transparent outline-none resize-none ${c.text} ${c.placeholder} font-mono text-base leading-relaxed`}
            spellCheck={false}
          />
        </div>
      </div>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Note"
        message={`Delete "${title || 'Untitled'}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
