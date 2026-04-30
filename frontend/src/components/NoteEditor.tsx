import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, MoreVertical, Trash2, Pin, PinOff, ExternalLink, Search, Download, Sparkles, Loader2, Check, CheckSquare, ImagePlus } from 'lucide-react';
import { useNote } from '../hooks/useNotes';
import { useFolders } from '../hooks/useFolders';
import { useRecentNotes } from '../hooks/useRecentNotes';
import { ConfirmModal } from './ConfirmModal';
import { TaskConfirmModal } from './TaskConfirmModal';
import { BlockNoteEditor } from './BlockNoteEditor';
import { EditorSearch } from './EditorSearch';
import { exportNoteAsMarkdown } from '../utils/exportImport';
import { processAPI, tasksAPI, subtasksAPI, uploadsAPI } from '../api/client';
import { compressImage } from '../utils/imageCompress';
import type { Note, Task } from '../types';

// Dark mode colors - Obsidian style
const c = {
  bg: 'bg-[#0a0a0a]',
  sidebar: 'bg-[#1a1a1a]',
  hover: 'hover:bg-[#242424]',
  text: 'text-[#e6e6e6]',
  gray: 'text-[#888888]',
  border: 'border-[#2a2a2a]',
  input: 'bg-transparent',
  placeholder: 'placeholder-[#3a3a3a]',
};

interface NoteEditorProps {
  noteId: number;
  onBack: () => void;
  onUpdate?: (note: Note) => void;
  onDelete?: (id: number) => void;
}

export function NoteEditor({ noteId, onBack, onUpdate, onDelete }: NoteEditorProps) {
  const { note, loading, error, updateNote } = useNote(noteId);
  const { folders } = useFolders();
  const { addRecentNote } = useRecentNotes();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [folderId, setFolderId] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const [showNoteMenu, setShowNoteMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const isFullWidth = true;
  const [showSearch, setShowSearch] = useState(false);
  const [blockNoteEditor, setBlockNoteEditor] = useState<any>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractModal, setExtractModal] = useState<{ suggestions: { title: string; subtasks?: string[] }[] } | null>(null);
  const [linkedTasks, setLinkedTasks] = useState<Task[]>([]);
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Ctrl+F to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load note data
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content || '');
      setFolderId(note.folder_id);
      setIsPinned(note.is_pinned === 1);
      addRecentNote(note);
    }
  }, [note, addRecentNote]);

  // Load tasks linked to this note
  useEffect(() => {
    if (!note) return;
    tasksAPI.getAll({ note_id: note.id }).then(setLinkedTasks).catch(() => {});
  }, [note?.id]);

  // Auto-save
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
    setLastSaved(new Date());
    if (updated) {
      onUpdate?.(updated);
    }
  }, [note, title, content, folderId, isPinned, updateNote, onUpdate]);

  // Debounced auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      save();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [title, content, folderId, save]);

  // Handle extract tasks
  const handleExtract = async () => {
    if (!note) return;
    setExtracting(true);
    try {
      const { tasks } = await processAPI.note(note.id);
      setExtractModal({ suggestions: tasks });
    } catch {
      // silent
    } finally {
      setExtracting(false);
    }
  };

  const handleExtractConfirm = async (tasks: { title: string; subtasks: string[] }[], noteId: number) => {
    await Promise.all(tasks.map(async ({ title, subtasks }) => {
      const task = await tasksAPI.create(title, noteId);
      if (subtasks.length > 0) {
        await Promise.all(subtasks.map(s => subtasksAPI.create(task.id, s)));
      }
    }));
    const updated = await tasksAPI.getAll({ note_id: noteId });
    setLinkedTasks(updated);
  };

  const uploadFile = useCallback(async (file: File): Promise<string> => {
    if (!note) throw new Error('No note');
    const compressed = await compressImage(file);
    return uploadsAPI.upload(compressed, note.id);
  }, [note]);

  const handleImageButtonClick = () => imageInputRef.current?.click();

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !blockNoteEditor) return;
    e.target.value = '';
    setUploading(true);
    try {
      const url = await uploadFile(file);
      const currentBlock = blockNoteEditor.getTextCursorPosition().block;
      blockNoteEditor.insertBlocks(
        [{ type: 'image', props: { url } }],
        currentBlock,
        'after'
      );
    } catch (err) {
      console.error('Image upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleToggleTask = async (task: Task) => {
    const next: Task['status'] = task.status === 'done' ? 'backlog' : 'done';
    const updated = await tasksAPI.update(task.id, { status: next });
    setLinkedTasks(prev => prev.map(t => t.id === task.id ? updated : t));
  };

  // Handle delete
  const handleDelete = async () => {
    if (!note) return;
    await onDelete?.(note.id);
    setShowDeleteModal(false);
    onBack();
  };

  // Get folder name
  const currentFolder = folders.find((f) => f.id === folderId);

  if (loading) {
    return (
      <div 
        data-area-id="noteeditor"
        className="noteeditor flex items-center justify-center h-full bg-[#0a0a0a]"
      >
        <div className="noteeditor-loading animate-spin rounded-full h-8 w-8 border-b-2 border-[#6366f1]" />
      </div>
    );
  }

  if (error || !note) {
    return (
      <div 
        data-area-id="noteeditor"
        className={`noteeditor-error flex flex-col items-center justify-center h-full ${c.gray} bg-[#0a0a0a]`}
      >
        <p>Error loading note</p>
        <button 
          data-area-id="noteeditor-back-btn"
          onClick={onBack} 
          className="noteeditor-back-btn mt-4 text-[#6366f1] hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div 
      data-area-id="noteeditor"
      className={`noteeditor h-full flex flex-col ${c.bg}`}
    >
      {/* Top Bar - Minimal */}
      <div 
        data-area-id="noteeditor-header"
        className={`noteeditor-header flex items-center justify-between px-6 py-3 border-b ${c.border}`}
      >
        <div className="flex items-center gap-4">
          <button
            data-area-id="noteeditor-back-btn"
            onClick={() => {
              save();
              onBack();
            }}
            className={`noteeditor-back-btn p-2 ${c.hover} rounded-lg transition-colors ${c.text}`}
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>
          
          {/* Folder Selector */}
          <div className="relative">
            <button
              data-area-id="noteeditor-folder-select"
              onClick={() => setShowFolderMenu(!showFolderMenu)}
              className={`noteeditor-folder-select text-sm ${c.gray} hover:text-[#e6e6e6] transition-colors`}
            >
              {currentFolder?.name || 'Inbox'}
              {saving && <span className="ml-2 text-xs opacity-50">• saving</span>}
              {lastSaved && !saving && <span className="ml-2 text-xs opacity-50">• saved</span>}
            </button>
            
            {/* Folder Dropdown */}
            {showFolderMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setShowFolderMenu(false)}
                />
                <div 
                  data-area-id="noteeditor-folder-dropdown"
                  className={`noteeditor-folder-dropdown absolute top-full left-0 mt-2 w-48 ${c.sidebar} border ${c.border} rounded-lg shadow-lg z-50 py-1`}
                >
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => {
                        setFolderId(folder.id);
                        setShowFolderMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm ${c.hover} transition-colors ${
                        folder.id === folderId ? 'text-[#6366f1]' : c.text
                      }`}
                    >
                      {folder.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Pin Toggle Button */}
          <button
            onClick={() => {
              const newPinned = !isPinned;
              setIsPinned(newPinned);
              // Let debounced auto-save handle the update - no direct call here
            }}
            className={`p-2 rounded-lg transition-colors ${
              isPinned ? 'text-yellow-500' : 'text-[#888888] hover:text-[#e6e6e6]'
            }`}
            title={isPinned ? 'Unpin note' : 'Pin note'}
            aria-label={isPinned ? 'Unpin note' : 'Pin note'}
          >
            {isPinned ? <Pin size={18} fill="currentColor" /> : <PinOff size={18} />}
          </button>

          {/* Search Toggle */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 rounded-lg transition-colors ${
              showSearch ? 'text-[#6366f1]' : 'text-[#888888] hover:text-[#e6e6e6]'
            }`}
            title="Search in note (Ctrl+F)"
            aria-label="Search in note"
          >
            <Search size={18} />
          </button>

          {/* Extract Tasks */}
          {!note?.bookmark_url && (
            <button
              onClick={handleExtract}
              disabled={extracting}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#888888] hover:text-[#e6e6e6] border border-[#2a2a2a] hover:border-[#4f4f4f] rounded-lg transition-colors disabled:opacity-50"
              title="Extract tasks from note"
            >
              {extracting ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              Extract Tasks
            </button>
          )}

          {/* Image Upload */}
          {!note?.bookmark_url && (
            <>
              <button
                onClick={handleImageButtonClick}
                disabled={uploading}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#888888] hover:text-[#e6e6e6] border border-[#2a2a2a] hover:border-[#4f4f4f] rounded-lg transition-colors disabled:opacity-50"
                title="Upload image (or paste / drag-drop)"
              >
                {uploading ? <Loader2 size={12} className="animate-spin" /> : <ImagePlus size={12} />}
                Image
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleImageFileChange}
              />
            </>
          )}
        </div>

        {/* Note Menu */}
        <div className="relative">
          <button
            onClick={() => setShowNoteMenu(!showNoteMenu)}
            className={`p-2 ${c.hover} rounded-lg transition-colors ${c.gray}`}
          >
            <MoreVertical size={18} />
          </button>
          
          {showNoteMenu && (
            <>
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setShowNoteMenu(false)}
              />
              <div 
                className={`absolute top-full right-0 mt-1 w-40 ${c.sidebar} border ${c.border} rounded-lg shadow-lg z-50 py-1`}
              >
                <button
                  onClick={() => {
                    if (note) exportNoteAsMarkdown(note);
                    setShowNoteMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm ${c.text} ${c.hover} transition-colors flex items-center gap-2`}
                >
                  <Download size={14} />
                  Export as Markdown
                </button>
                <button
                  onClick={() => {
                    setShowNoteMenu(false);
                    setShowDeleteModal(true);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm text-red-400 ${c.hover} transition-colors flex items-center gap-2`}
                >
                  <Trash2 size={14} />
                  Delete note
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Editor Content - Clean, Obsidian-style */}
      <div 
        data-area-id="noteeditor-content"
        className="noteeditor-content flex-1 overflow-y-auto"
      >
        <div className={`${isFullWidth ? 'max-w-6xl' : 'max-w-3xl'} mx-auto px-8 py-8 transition-all duration-300`}>
          {/* Title Input */}
          <input
            data-area-id="noteeditor-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
            className={`noteeditor-title w-full text-4xl font-bold bg-transparent outline-none ${c.placeholder} ${c.text} mb-6`}
          />
          
          {/* Linked Tasks */}
          {linkedTasks.length > 0 && (
            <div className="mb-6 border border-[#2a2a2a] rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-[#1a1a1a] text-xs text-[#888888] flex items-center gap-2">
                <CheckSquare size={12} />
                Tasks from this note ({linkedTasks.length})
              </div>
              <ul className="divide-y divide-[#2a2a2a]">
                {linkedTasks.map(task => (
                  <li
                    key={task.id}
                    onClick={() => handleToggleTask(task)}
                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-[#222] transition-colors"
                  >
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      task.status === 'done' ? 'bg-[#6366f1] border-[#6366f1]' : 'border-[#5a5a5a]'
                    }`}>
                      {task.status === 'done' && <Check size={10} className="text-[#0a0a0a]" />}
                    </span>
                    <span className={`text-sm flex-1 transition-colors ${
                      task.status === 'done' ? 'line-through text-[#888888]' : 'text-[#e6e6e6]'
                    }`}>
                      {task.title}
                    </span>
                    {task.status === 'doing' && (
                      <span className="text-xs text-yellow-500 px-1.5 py-0.5 bg-yellow-500/10 rounded">doing</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Bookmark View or Content Textarea */}
          {note?.bookmark_url ? (
            <div className="noteeditor-bookmark flex flex-col items-center gap-4 py-8">
              <div className="flex items-center gap-3 px-6 py-4 bg-[#1a1a2e] rounded-xl border border-emerald-800/30 w-full max-w-lg">
                <img
                  src={`https://www.google.com/s2/favicons?domain=${(() => { try { return new URL(note.bookmark_url).hostname; } catch { return ''; } })()}&sz=64`}
                  alt=""
                  className="w-8 h-8 rounded"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[#888888] mb-1">Bookmark</div>
                  <a
                    href={note.bookmark_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 truncate block"
                  >
                    {note.bookmark_title || (() => { try { return new URL(note.bookmark_url).hostname; } catch { return note.bookmark_url; } })()}
                  </a>
                  <div className="text-xs text-[#3a3a3a] mt-0.5 truncate">
                    {(() => { try { return new URL(note.bookmark_url).hostname; } catch { return ''; } })()}
                  </div>
                </div>
              </div>
              <a
                href={note.bookmark_url}
                target="_blank"
                rel="noopener noreferrer"
                className="noteeditor-bookmark-open inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                Open Link
              </a>
              <p className={`text-sm ${c.gray} mt-2`}>
                This is a bookmark. You can edit the title and folder above.
              </p>
            </div>
          ) : (
            <>
              {showSearch && blockNoteEditor && (
                <EditorSearch
                  editor={blockNoteEditor}
                  onClose={() => setShowSearch(false)}
                />
              )}
              <BlockNoteEditor
                initialContent={content}
                onChange={setContent}
                onEditorReady={setBlockNoteEditor}
                uploadFile={uploadFile}
              />
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Note"
        message={`Are you sure you want to delete "${title || 'Untitled'}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Extract Tasks Modal */}
      {extractModal && note && (
        <TaskConfirmModal
          isOpen={true}
          noteId={note.id}
          noteTitle={note.title}
          suggestions={extractModal.suggestions}
          onConfirm={handleExtractConfirm}
          onClose={() => setExtractModal(null)}
        />
      )}
    </div>
  );
}
