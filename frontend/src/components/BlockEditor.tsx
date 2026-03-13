import { useEffect, useRef, useCallback, useState } from 'react';
import { ArrowLeft, MoreVertical, Trash2 } from 'lucide-react';
import { useNote } from '../hooks/useNotes';
import { useFolders } from '../hooks/useFolders';
import { useRecentNotes } from '../hooks/useRecentNotes';
import { ConfirmModal } from './ConfirmModal';
import type { Note } from '../types';

// EditorJS and tools
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Quote from '@editorjs/quote';
import Code from '@editorjs/code';
import Paragraph from '@editorjs/paragraph';

const c = {
  bg: 'bg-[#191919]',
  sidebar: 'bg-[#202020]',
  hover: 'hover:bg-[#2a2a2a]',
  text: 'text-[#e6e6e6]',
  gray: 'text-[#6b6b6b]',
  border: 'border-[#2f2f2f]',
  placeholder: 'placeholder-[#4b5563]',
};

interface BlockEditorProps {
  noteId: number;
  onBack: () => void;
  onUpdate?: (note: Note) => void;
  onDelete?: (id: number) => void;
}

// Convert markdown-like content to EditorJS blocks
function contentToBlocks(content: string): any[] {
  if (!content.trim()) {
    return [{ type: 'paragraph', data: { text: '' } }];
  }
  
  const lines = content.split('\n');
  const blocks: any[] = [];
  let currentList: any = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed) {
      // Empty line ends current list
      if (currentList) {
        blocks.push(currentList);
        currentList = null;
      }
      continue;
    }
    
    // Heading
    if (trimmed.startsWith('# ')) {
      if (currentList) {
        blocks.push(currentList);
        currentList = null;
      }
      blocks.push({ type: 'header', data: { text: trimmed.replace('# ', ''), level: 1 } });
    }
    else if (trimmed.startsWith('## ')) {
      if (currentList) {
        blocks.push(currentList);
        currentList = null;
      }
      blocks.push({ type: 'header', data: { text: trimmed.replace('## ', ''), level: 2 } });
    }
    else if (trimmed.startsWith('### ')) {
      if (currentList) {
        blocks.push(currentList);
        currentList = null;
      }
      blocks.push({ type: 'header', data: { text: trimmed.replace('### ', ''), level: 3 } });
    }
    // Quote
    else if (trimmed.startsWith('> ')) {
      if (currentList) {
        blocks.push(currentList);
        currentList = null;
      }
      blocks.push({ type: 'quote', data: { text: trimmed.replace('> ', ''), alignment: 'left' } });
    }
    // Code
    else if (trimmed.startsWith('```')) {
      if (currentList) {
        blocks.push(currentList);
        currentList = null;
      }
      // Simple code block handling
      blocks.push({ type: 'code', data: { code: trimmed.replace('```', '') } });
    }
    // Bullet list
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!currentList || currentList.type !== 'list' || currentList.data.style !== 'unordered') {
        if (currentList) blocks.push(currentList);
        currentList = { type: 'list', data: { style: 'unordered', items: [] } };
      }
      currentList.data.items.push(trimmed.replace(/^[-*] /, ''));
    }
    // Numbered list
    else if (/^\d+\./.test(trimmed)) {
      if (!currentList || currentList.type !== 'list' || currentList.data.style !== 'ordered') {
        if (currentList) blocks.push(currentList);
        currentList = { type: 'list', data: { style: 'ordered', items: [] } };
      }
      currentList.data.items.push(trimmed.replace(/^\d+\.\s*/, ''));
    }
    // Paragraph
    else {
      if (currentList) {
        blocks.push(currentList);
        currentList = null;
      }
      blocks.push({ type: 'paragraph', data: { text: trimmed } });
    }
  }
  
  // Don't forget last list
  if (currentList) {
    blocks.push(currentList);
  }
  
  return blocks.length > 0 ? blocks : [{ type: 'paragraph', data: { text: '' } }];
}

// Convert EditorJS blocks to markdown-like content
function blocksToContent(blocks: any[]): string {
  return blocks.map(block => {
    switch (block.type) {
      case 'header':
        return '#'.repeat(block.data.level) + ' ' + block.data.text;
      case 'paragraph':
        return block.data.text;
      case 'list':
        if (block.data.style === 'unordered') {
          return block.data.items.map((item: string) => `- ${item}`).join('\n');
        } else {
          return block.data.items.map((item: string, i: number) => `${i + 1}. ${item}`).join('\n');
        }
      case 'quote':
        return '> ' + block.data.text;
      case 'code':
        return '```\n' + block.data.code + '\n```';
      default:
        return '';
    }
  }).join('\n\n');
}

export function BlockEditor({ noteId, onBack, onUpdate, onDelete }: BlockEditorProps) {
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
  const [isReady, setIsReady] = useState(false);
  
  const editorRef = useRef<EditorJS | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load note data
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setFolderId(note.folder_id);
      addRecentNote(note);
    }
  }, [note, addRecentNote]);

  // Initialize EditorJS
  useEffect(() => {
    if (!containerRef.current || editorRef.current || !note) return;
    
    const blocks = contentToBlocks(note.content || '');
    
    const editor = new EditorJS({
      holder: containerRef.current,
      tools: {
        header: {
          class: Header as any,
          config: {
            levels: [1, 2, 3],
            defaultLevel: 2,
          },
        },
        list: {
          class: List as any,
          inlineToolbar: true,
        },
        quote: {
          class: Quote as any,
          inlineToolbar: true,
        },
        code: {
          class: Code as any,
        },
        paragraph: {
          class: Paragraph as any,
          inlineToolbar: true,
        },
      },
      data: {
        blocks,
      },
      placeholder: 'Type / for commands or start writing...',
      autofocus: false,
      onReady: () => {
        setIsReady(true);
      },
    });
    
    editorRef.current = editor;
    
    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, [note?.id]); // Only reinitialize when note ID changes

  // Auto-save
  const save = useCallback(async () => {
    if (!note || !editorRef.current || !isReady) return;
    
    try {
      const data = await editorRef.current.save();
      const content = blocksToContent(data.blocks);
      
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
    } catch (err) {
      console.error('Save error:', err);
      setSaving(false);
    }
  }, [note, title, folderId, updateNote, onUpdate, isReady]);

  // Debounced auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      save();
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [title, folderId, save]);

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
            onClick={() => { save(); onBack(); }}
            className={`p-2 ${c.hover} rounded-lg transition-colors ${c.text}`}
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowFolderMenu(!showFolderMenu)}
              className={`text-sm ${c.gray} hover:text-[#e6e6e6] transition-colors`}
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
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
            className={`w-full text-4xl font-bold bg-transparent outline-none ${c.placeholder} ${c.text} mb-6`}
          />
          
          {/* EditorJS Container */}
          <div 
            ref={containerRef}
            className="editorjs-container min-h-[400px]"
            style={{ 
              '--editor-bg': '#191919',
              '--editor-text': '#e6e6e6',
              '--editor-border': '#2f2f2f',
            } as React.CSSProperties}
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
