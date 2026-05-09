import { useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark, CheckSquare, FileText, Globe, Sparkles, X } from 'lucide-react';
import type { Folder } from '../types';
import { bookmarksAPI } from '../api/client';
import { isURL } from '../utils/isURL';

const c = {
  overlay: 'bg-black/60',
  modal: 'bg-[#1a1a1a]',
  input: 'bg-[#242424]',
  text: 'text-[#e6e6e6]',
  gray: 'text-[#888888]',
  border: 'border-[#2a2a2a]',
  hover: 'hover:bg-[#3a3a3a]',
  primary: 'bg-[#faff69] hover:bg-[#e6eb52]',
  secondary: 'bg-[#242424] hover:bg-[#3a3a3a]',
};

type CaptureType = 'note' | 'task' | 'bookmark';

interface CreateNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: Folder[];
  onCreateNote: (title: string, content: string, folderName: string | null, bookmarkUrl?: string, bookmarkTitle?: string) => void | Promise<void>;
  onCreateTask?: (title: string, description?: string) => void | Promise<void>;
  defaultFolderName?: string;
}

function detectCaptureType(title: string, content: string): CaptureType {
  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();
  const combined = `${trimmedTitle}\n${trimmedContent}`.trim();

  if (trimmedTitle && isURL(trimmedTitle)) return 'bookmark';
  if (!combined) return 'note';
  if (combined.includes('\n') || combined.length > 120 || trimmedContent.length > 40) return 'note';
  return 'task';
}

function firstLine(text: string): string {
  return text.split('\n').find(line => line.trim())?.trim() ?? '';
}

function localMeetingStamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function CreateNoteModal({
  isOpen,
  onClose,
  folders,
  onCreateNote,
  onCreateTask,
  defaultFolderName,
}: CreateNoteModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [folderName, setFolderName] = useState(defaultFolderName ?? '');
  const [manualType, setManualType] = useState<CaptureType | null>(null);
  const [bookmarkTitle, setBookmarkTitle] = useState<string | null>(null);
  const [isFetchingTitle, setIsFetchingTitle] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTitle('');
    setContent('');
    setFolderName(defaultFolderName ?? '');
    setManualType(null);
    setBookmarkTitle(null);
    setIsFetchingTitle(false);
    setIsSubmitting(false);
    setTimeout(() => titleInputRef.current?.focus(), 50);
  }, [isOpen, defaultFolderName]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const detectedType = useMemo(() => detectCaptureType(title, content), [title, content]);
  const captureType = manualType ?? detectedType;
  const taskEnabled = Boolean(onCreateTask);
  const availableTypes: CaptureType[] = taskEnabled ? ['note', 'task', 'bookmark'] : ['note', 'bookmark'];

  useEffect(() => {
    if (captureType !== 'bookmark' || !isURL(title.trim())) {
      setBookmarkTitle(null);
      setIsFetchingTitle(false);
      return;
    }

    let active = true;
    setIsFetchingTitle(true);
    setBookmarkTitle(null);

    const timer = setTimeout(() => {
      bookmarksAPI.getMetadata(title.trim())
        .then(data => {
          if (active) setBookmarkTitle(data.title);
        })
        .catch(() => {
          if (active) setBookmarkTitle(null);
        })
        .finally(() => {
          if (active) setIsFetchingTitle(false);
        });
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [captureType, title]);

  const resolvedFolderName = folderName || defaultFolderName || folders[0]?.name || null;
  const canSubmit = title.trim().length > 0 || content.trim().length > 0;

  const typeCopy: Record<CaptureType, { label: string; description: string }> = {
    note: {
      label: 'Note',
      description: 'Longer context, meetings, and working notes.',
    },
    task: {
      label: 'Task',
      description: 'Short action-oriented capture for something to do.',
    },
    bookmark: {
      label: 'Bookmark',
      description: 'Save a URL with optional context for later.',
    },
  };

  const applyMeetingPreset = () => {
    setManualType('note');
    setTitle(`Meeting — ${localMeetingStamp()}`);
    setContent('## Notes\n\n## Decisions\n\n## Action Items\n');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);

    try {
      if (captureType === 'task' && onCreateTask) {
        const taskTitle = title.trim() || firstLine(content) || 'Untitled task';
        const description = content.trim() || undefined;
        await onCreateTask(taskTitle, description);
        onClose();
        return;
      }

      const noteTitle = title.trim() || firstLine(content) || 'Untitled';

      if (captureType === 'bookmark') {
        const bookmarkUrl = title.trim();
        await onCreateNote(bookmarkTitle || noteTitle, content.trim(), resolvedFolderName, bookmarkUrl, bookmarkTitle || undefined);
        onClose();
        return;
      }

      await onCreateNote(noteTitle, content.trim(), resolvedFolderName);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      data-area-id="create-note-modal"
      className={`fixed inset-0 z-50 flex items-center justify-center ${c.overlay} backdrop-blur-sm`}
      onClick={handleBackdropClick}
    >
      <div className={`w-full max-w-2xl ${c.modal} rounded-2xl shadow-2xl border ${c.border} overflow-hidden`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b ${c.border}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#242424] flex items-center justify-center">
              {captureType === 'note' && <FileText size={18} className="text-[#faff69]" />}
              {captureType === 'task' && <CheckSquare size={18} className="text-[#faff69]" />}
              {captureType === 'bookmark' && <Bookmark size={18} className="text-emerald-400" />}
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${c.text}`}>Quick Capture</h2>
              <p className={`text-xs ${c.gray}`}>Capture a note, task, or bookmark from one place.</p>
            </div>
          </div>
          <button
            data-area-id="create-note-modal-close"
            onClick={onClose}
            className={`p-2 rounded-lg ${c.hover} transition-colors`}
          >
            <X size={18} className={c.gray} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            {availableTypes.map(type => {
              const active = captureType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setManualType(type)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                    active
                      ? 'bg-[#faff69] text-[#0a0a0a] border-[#faff69]'
                      : `border-[#2a2a2a] ${c.gray} hover:text-[#e6e6e6] hover:border-[#444]`
                  }`}
                >
                  {typeCopy[type].label}
                </button>
              );
            })}
            <span className={`text-xs ${c.gray} ml-auto`}>
              {manualType ? `Manual: ${typeCopy[captureType].label}` : `Auto-detected: ${typeCopy[captureType].label}`}
            </span>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${c.gray} mb-2`}>
                  {captureType === 'bookmark' ? 'URL' : captureType === 'task' ? 'Task title' : 'Title'}
                </label>
                <input
                  ref={titleInputRef}
                  type="text"
                  value={title}
                  onChange={event => setTitle(event.target.value)}
                  placeholder={
                    captureType === 'bookmark'
                      ? 'https://example.com'
                      : captureType === 'task'
                        ? 'Follow up with design team'
                        : 'Meeting title or note heading'
                  }
                  className={`w-full px-4 py-2.5 ${c.input} border ${c.border} rounded-lg outline-none focus:ring-2 focus:ring-[#faff69] focus:border-transparent transition-all ${c.text}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${c.gray} mb-2`}>
                  {captureType === 'task' ? 'Details' : captureType === 'bookmark' ? 'Context' : 'Content'}
                </label>
                <textarea
                  value={content}
                  onChange={event => setContent(event.target.value)}
                  placeholder={
                    captureType === 'task'
                      ? 'Optional description'
                      : captureType === 'bookmark'
                        ? 'Why this link matters'
                        : 'Write your note here'
                  }
                  rows={captureType === 'note' ? 8 : 5}
                  className={`w-full px-4 py-2.5 ${c.input} border ${c.border} rounded-lg outline-none focus:ring-2 focus:ring-[#faff69] focus:border-transparent transition-all ${c.text} resize-none`}
                />
              </div>

              {captureType === 'bookmark' && (
                <div className="flex flex-col gap-1.5 px-3 py-2.5 bg-emerald-900/20 border border-emerald-800/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Globe size={14} className="text-emerald-500" />
                    <span className="text-xs text-emerald-400">URL capture mode</span>
                  </div>
                  {isFetchingTitle ? (
                    <span className="text-xs text-emerald-500/70">Fetching website title...</span>
                  ) : bookmarkTitle ? (
                    <span className="text-xs text-emerald-300 truncate">{bookmarkTitle}</span>
                  ) : (
                    <span className="text-xs text-emerald-500/60">Paste a valid URL to save a bookmark.</span>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className={`rounded-xl border ${c.border} bg-[#151515] p-4`}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className={`text-sm font-medium ${c.text}`}>Preset</p>
                    <p className={`text-xs mt-1 ${c.gray}`}>Start faster for meetings and quick working notes.</p>
                  </div>
                  <button
                    type="button"
                    onClick={applyMeetingPreset}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#2a2a2a] px-3 py-1.5 text-xs text-[#faff69] hover:border-[#4a4a2a] hover:bg-[#202015] transition-colors"
                  >
                    <Sparkles size={12} />
                    Meeting Note
                  </button>
                </div>
              </div>

              {captureType !== 'task' && (
                <div>
                  <label className={`block text-sm font-medium ${c.gray} mb-2`}>Folder</label>
                  <select
                    value={folderName}
                    onChange={event => setFolderName(event.target.value)}
                    className={`w-full px-4 py-2.5 ${c.input} border ${c.border} rounded-lg outline-none focus:ring-2 focus:ring-[#faff69] focus:border-transparent transition-all ${c.text}`}
                  >
                    {folders.map(folder => (
                      <option key={folder.id} value={folder.name}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className={`rounded-xl border ${c.border} bg-[#151515] p-4`}>
                <p className={`text-sm font-medium ${c.text}`}>{typeCopy[captureType].label}</p>
                <p className={`text-xs mt-1 ${c.gray}`}>{typeCopy[captureType].description}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2a2a2a]">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-sm font-medium ${c.gray} ${c.secondary} rounded-lg transition-colors`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting || (captureType === 'bookmark' && !isURL(title.trim()))}
              className={`px-4 py-2 text-sm font-medium text-[#0a0a0a] ${captureType === 'bookmark' ? 'bg-emerald-400 hover:bg-emerald-300' : c.primary} rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSubmitting
                ? 'Saving...'
                : captureType === 'task'
                  ? 'Create Task'
                  : captureType === 'bookmark'
                    ? 'Save Bookmark'
                    : 'Create Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
