import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, MoreVertical, Trash2, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { useNote } from '../hooks/useNotes';
import { useFolders } from '../hooks/useFolders';
import { useRecentNotes } from '../hooks/useRecentNotes';
import { ConfirmModal } from './ConfirmModal';
import type { Note } from '../types';

// BlockNote imports
import { useCreateBlockNote, BlockNoteViewRaw as BlockNoteView } from '@blocknote/react';
import '@blocknote/react/style.css';
import '@blocknote/core/fonts/inter.css';

// Dark mode colors - Obsidian/Notion style
const c = {
  bg: 'bg-[#191919]',
  sidebar: 'bg-[#202020]',
  hover: 'hover:bg-[#2a2a2a]',
  text: 'text-[#e6e6e6]',
  gray: 'text-[#6b6b6b]',
  border: 'border-[#2f2f2f]',
  input: 'bg-transparent',
  placeholder: 'placeholder-[#4b5563]',
};

interface BlockNoteEditorProps {
  noteId: number;
  onBack: () => void;
  onUpdate?: (note: Note) => void;
  onDelete?: (id: number) => void;
}

// Custom theme for BlockNote dark mode
const customTheme = {
  colors: {
    editor: {
      text: '#e6e6e6',
      background: '#191919',
    },
    menu: {
      text: '#e6e6e6',
      background: '#202020',
    },
    toolbar: {
      text: '#e6e6e6',
      background: '#202020',
    },
    border: '#2f2f2f',
    sideMenu: '#6b6b6b',
    highlights: {
      text: {
        color: '#e6e6e6',
      },
      background: {
        color: '#2a2a2a',
      },
    },
  },
  borderRadius: 8,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

export function BlockNoteEditor({ noteId, onBack, onUpdate, onDelete }: BlockNoteEditorProps) {
  const { note, loading, error, updateNote } = useNote(noteId);
  const { folders } = useFolders();
  const { addRecentNote } = useRecentNotes();
  
  const [title, setTitle] = useState('');
  const [folderId, setFolderId] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const [showNoteMenu, setShowNoteMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Create BlockNote editor
  const editor = useCreateBlockNote({
    initialContent: [
      {
        type: 'paragraph',
        content: '',
      },
    ],
  });

  // Load note data
  useEffect(() => {
    if (note && editor) {
      setTitle(note.title);
      setFolderId(note.folder_id);
      addRecentNote(note);
      
      // Parse content into blocks
      try {
        const content = note.content || '';
        if (content.trim()) {
          // Convert plain text to blocks (simple conversion)
          const lines = content.split('\n');
          const blocks = lines.map((line: string) => {
            if (line.startsWith('# ')) {
              return { type: 'heading', props: { level: 1 }, content: line.replace('# ', '') };
            } else if (line.startsWith('## ')) {
              return { type: 'heading', props: { level: 2 }, content: line.replace('## ', '') };
            } else if (line.startsWith('### ')) {
              return { type: 'heading', props: { level: 3 }, content: line.replace('### ', '') };
            } else if (line.startsWith('- ') || line.startsWith('* ')) {
              return { type: 'bulletListItem', content: line.replace(/^[-*] /, '') };
            } else if (line.match(/^\d+\./)) {
              return { type: 'numberedListItem', content: line.replace(/^\d+\.\s*/, '') };
            } else if (line.startsWith('> ')) {
              return { type: 'quote', content: line.replace('> ', '') };
            } else {
              return { type: 'paragraph', content: line };
            }
          }).filter((b: any) => b.content || b.type !== 'paragraph');
          
          if (blocks.length > 0) {
            editor.replaceBlocks(editor.document, blocks as any);
          }
        }
      } catch (e) {
        console.error('Failed to parse content:', e);
      }
    }
  }, [note, editor, addRecentNote]);

  // Auto-save
  const save = useCallback(async () => {
    if (!note || !editor) return;
    
    // Get content as markdown/plain text
    const blocks = editor.document;
    const content = blocks.map((block: any) => {
      const text = block.content?.map((c: any) => c.text || '').join('') || '';
      switch (block.type) {
        case 'heading':
          return `${'#'.repeat(block.props?.level || 1)} ${text}`;
        case 'bulletListItem':
          return `- ${text}`;
        case 'numberedListItem':
          return `1. ${text}`;
        case 'quote':
          return `> ${text}`;
        default:
          return text;
      }
    }).join('\n');
    
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
  }, [note, editor, title, folderId, updateNote, onUpdate]);

  // Debounced auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      save();
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [title, folderId, editor?.document, save]);

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
        className="noteeditor flex items-center justify-center h-full bg-[#191919]"
      >
        <div className="noteeditor-loading animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error || !note) {
    return (
      <div 
        data-area-id="noteeditor"
        className={`noteeditor-error flex flex-col items-center justify-center h-full ${c.gray} bg-[#191919]`}
      >
        <p>Error loading note</p>
        <button 
          data-area-id="noteeditor-back-btn"
          onClick={onBack} 
          className="noteeditor-back-btn mt-4 text-blue-500 hover:underline"
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

        {/* Note Menu */}
        <div className="flex items-center gap-2">
          {/* Add Image Button */}
          <button
            onClick={() => {
              const url = prompt('Enter image URL:');
              if (url && editor) {
                editor.insertBlocks(
                  [{ type: 'image', props: { url } }],
                  editor.getTextCursorPosition().block,
                  'after'
                );
              }
            }}
            className={`p-2 ${c.hover} rounded-lg transition-colors ${c.gray}`}
            title="Add image"
          >
            <ImageIcon size={18} />
          </button>

          {/* Add Embed Button */}
          <button
            onClick={() => {
              const url = prompt('Enter URL to embed:');
              if (url && editor) {
                // Insert as paragraph
                editor.insertBlocks(
                  [{ type: 'paragraph', content: url }],
                  editor.getTextCursorPosition().block,
                  'after'
                );
              }
            }}
            className={`p-2 ${c.hover} rounded-lg transition-colors ${c.gray}`}
            title="Add link"
          >
            <LinkIcon size={18} />
          </button>

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
      </div>

      {/* Editor Content */}
      <div 
        data-area-id="noteeditor-content"
        className="noteeditor-content flex-1 overflow-y-auto"
      >
        <div className="max-w-3xl mx-auto px-8 py-8">
          {/* Title Input */}
          <input
            data-area-id="noteeditor-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
            className={`noteeditor-title w-full text-4xl font-bold bg-transparent outline-none ${c.placeholder} ${c.text} mb-6`}
          />
          
          {/* BlockNote Editor */}
          <div className="bn-container">
            {editor && (
              <BlockNoteView
                editor={editor}
                theme={customTheme as any}
                className="min-h-[400px]"
              />
            )}
          </div>
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
    </div>
  );
}
