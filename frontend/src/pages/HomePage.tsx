import { useState, useMemo } from 'react';
import { Plus, FileText, Trash2, Search, Hash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ConfirmModal } from '../components/ConfirmModal';
import { useNotes } from '../hooks/useNotes';
import { useTags } from '../hooks/useTags';
import { SkeletonNoteItem } from '../components/Skeleton';
import { useMinLoading } from '../hooks/useMinLoading';
import type { Folder as FolderType, Note } from '../types';

// Dark mode colors — Bear-style
const c = {
  bg: 'bg-[#191919]',
  surface: 'bg-[#202020]',
  hover: 'hover:bg-[#2a2a2a]',
  text: 'text-[#e6e6e6]',
  gray: 'text-[#6b6b6b]',
  border: 'border-[#2f2f2f]',
  input: 'bg-[#2a2a2a]',
};

// Consistent tag color palette (same as sidebar)
const TAG_COLORS = [
  { bg: 'bg-blue-500/20', text: 'text-blue-400', hover: 'hover:bg-blue-500/30' },
  { bg: 'bg-emerald-500/20', text: 'text-emerald-400', hover: 'hover:bg-emerald-500/30' },
  { bg: 'bg-purple-500/20', text: 'text-purple-400', hover: 'hover:bg-purple-500/30' },
  { bg: 'bg-amber-500/20', text: 'text-amber-400', hover: 'hover:bg-amber-500/30' },
  { bg: 'bg-rose-500/20', text: 'text-rose-400', hover: 'hover:bg-rose-500/30' },
  { bg: 'bg-cyan-500/20', text: 'text-cyan-400', hover: 'hover:bg-cyan-500/30' },
  { bg: 'bg-pink-500/20', text: 'text-pink-400', hover: 'hover:bg-pink-500/30' },
  { bg: 'bg-indigo-500/20', text: 'text-indigo-400', hover: 'hover:bg-indigo-500/30' },
  { bg: 'bg-orange-500/20', text: 'text-orange-400', hover: 'hover:bg-orange-500/30' },
  { bg: 'bg-teal-500/20', text: 'text-teal-400', hover: 'hover:bg-teal-500/30' },
];

function getTagColor(tagName: string, tagColor?: string): { bg: string; text: string; hover: string } {
  if (tagColor) {
    return { bg: `bg-[${tagColor}]/20`, text: `text-[${tagColor}]`, hover: `hover:bg-[${tagColor}]/30` };
  }
  // Deterministic color based on tag name
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

interface HomePageProps {
  folders: FolderType[];
  onSelectNote: (note: Note) => void;
  onCreateNote?: () => void;
  onTagClick?: (tagName: string) => void;
}

export function HomePage({ folders: _folders, onSelectNote, onCreateNote, onTagClick }: HomePageProps) {
  const navigate = useNavigate();
  const { notes, loading: notesLoading, refetch: refetchNotes, deleteNote } = useNotes();
  const { tags: _tags } = useTags();
  const showLoading = useMinLoading(notesLoading, 500);

  // State
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [isDeletingNote, setIsDeletingNote] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Collect all unique tags from notes
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach(note => {
      note.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [notes]);

  // Filter notes by search and tag
  const filteredNotes = useMemo(() => {
    let result = notes;

    // Filter by selected tag
    if (selectedTag) {
      result = result.filter(note => note.tags?.includes(selectedTag));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(note =>
        note.title.toLowerCase().includes(query) ||
        note.content?.toLowerCase().includes(query) ||
        note.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return result;
  }, [notes, selectedTag, searchQuery]);

  // Delete handlers
  const handleDeleteClick = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    setNoteToDelete(note);
  };

  const handleConfirmDelete = async () => {
    if (!noteToDelete) return;
    setIsDeletingNote(true);
    try {
      await deleteNote(noteToDelete.id);
      await refetchNotes();
    } finally {
      setIsDeletingNote(false);
      setNoteToDelete(null);
    }
  };

  const handleCloseDeleteModal = () => {
    if (isDeletingNote) return;
    setNoteToDelete(null);
  };

  // Tag click handler
  const handleTagClick = (e: React.MouseEvent, tagName: string) => {
    e.stopPropagation();
    if (onTagClick) {
      onTagClick(tagName);
    } else {
      navigate(`/tags/${tagName}`);
    }
  };

  // FAB click handler
  const handleFabClick = () => {
    if (onCreateNote) {
      onCreateNote();
    }
  };

  // Clear tag filter
  const handleClearTagFilter = () => {
    setSelectedTag(null);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Strip markdown for preview
  const getPreview = (content: string | undefined) => {
    if (!content) return 'No content';
    return content
      .replace(/[#*_`~\[\]()>|\\-]/g, '')
      .replace(/\n+/g, ' ')
      .trim()
      .slice(0, 100);
  };

  return (
    <div
      data-area-id="homepage"
      className={`homepage flex flex-col h-full overflow-y-auto ${c.bg}`}
    >
      {/* Tag Filter Bar */}
      <div
        data-area-id="homepage-tag-filter"
        className="homepage-tag-filter sticky top-0 z-20 px-4 lg:px-6 py-3 border-b border-[#2f2f2f] bg-[#191919]/95 backdrop-blur-sm"
      >
        {/* Search */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b6b]" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#2a2a2a] border border-[#2f2f2f] rounded-lg text-sm text-[#e6e6e6] placeholder-[#6b6b6b] focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-colors"
            data-area-id="homepage-search"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b6b] hover:text-[#e6e6e6] text-sm"
            >
              ✕
            </button>
          )}
        </div>

        {/* Tag Pills */}
        {allTags.length > 0 && (
          <div className="homepage-tag-pills flex flex-wrap gap-1.5 items-center">
            <button
              onClick={handleClearTagFilter}
              data-area-id="homepage-tag-all"
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full transition-colors ${
                selectedTag === null
                  ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30'
                  : 'bg-[#2a2a2a] text-[#6b6b6b] hover:text-[#e6e6e6]'
              }`}
            >
              All
            </button>
            {allTags.map((tag) => {
              const colors = getTagColor(tag);
              const isSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTag(isSelected ? null : tag);
                  }}
                  data-area-id={`homepage-tag-${tag}`}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full transition-colors ${
                    isSelected
                      ? `${colors.bg} ${colors.text} ring-1 ring-current/30`
                      : `bg-[#2a2a2a] text-[#6b6b6b] hover:text-[#e6e6e6]`
                  }`}
                >
                  <Hash size={10} />
                  {tag}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Note List — Bear-style simple list */}
      <div className="flex-1 overflow-y-auto">
        {showLoading ? (
          <div
            data-area-id="homepage-note-list"
            className="homepage-note-list max-w-4xl mx-auto w-full px-4 lg:px-6 py-4 space-y-1"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonNoteItem key={i} />
            ))}
          </div>
        ) : filteredNotes.length === 0 ? (
          <div
            data-area-id="homepage-empty-state"
            className="homepage-empty-state max-w-4xl mx-auto w-full px-4 lg:px-6 py-16 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#2a2a2a] flex items-center justify-center">
              <FileText size={28} className="text-[#6b6b6b]" />
            </div>
            {searchQuery || selectedTag ? (
              <>
                <h3 className="text-base font-semibold text-[#e6e6e6] mb-2">No matching notes</h3>
                <p className="text-sm text-[#6b6b6b] mb-4">
                  Try adjusting your search or tag filter
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedTag(null); }}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <h3 className="text-base font-semibold text-[#e6e6e6] mb-2">No notes yet</h3>
                <p className="text-sm text-[#6b6b6b] mb-4">Create your first note to get started</p>
              </>
            )}
          </div>
        ) : (
          <div
            data-area-id="homepage-note-list"
            className="homepage-note-list max-w-4xl mx-auto w-full px-4 lg:px-6 py-2"
          >
            {/* Note count */}
            <p className="text-xs text-[#6b6b6b] mb-3 px-1">
              {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''}
              {selectedTag && ` tagged #${selectedTag}`}
              {searchQuery && ` matching "${searchQuery}"`}
            </p>

            {/* Notes */}
            <div className="space-y-0.5">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  data-area-id={`homepage-note-${note.id}`}
                  onClick={() => onSelectNote(note)}
                  className={`homepage-note-item group relative flex items-start gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${c.hover} active:bg-[#333333] touch-manipulation`}
                >
                  {/* Icon */}
                  {note.bookmark_url ? (
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${(() => { try { return new URL(note.bookmark_url).hostname; } catch { return ''; } })()}&sz=32`}
                      alt=""
                      className="w-4 h-4 flex-shrink-0 mt-1 opacity-60"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <FileText size={16} className={`${c.gray} flex-shrink-0 mt-1 opacity-40`} />
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Title + date row */}
                    <div className="flex items-baseline gap-2">
                      <h3 className={`homepage-note-title font-medium ${c.text} truncate text-sm`}>
                        {note.title || 'Untitled'}
                      </h3>
                      <span className={`homepage-note-date text-xs ${c.gray} flex-shrink-0`}>
                        {formatDate(note.updated_at)}
                      </span>
                    </div>

                    {/* Preview */}
                    <p className={`homepage-note-preview text-xs ${c.gray} mt-0.5 line-clamp-1`}>
                      {note.bookmark_url
                        ? (note.bookmark_title || (() => { try { return new URL(note.bookmark_url!).hostname; } catch { return note.bookmark_url; } })())
                        : getPreview(note.content)
                      }
                    </p>

                    {/* Tags */}
                    {note.tags && note.tags.length > 0 && (
                      <div className="homepage-note-tags flex flex-wrap gap-1 mt-1.5">
                        {note.tags.map((tag) => {
                          const colors = getTagColor(tag);
                          return (
                            <span
                              key={tag}
                              onClick={(e) => handleTagClick(e, tag)}
                              className={`homepage-note-tag inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] rounded-full ${colors.bg} ${colors.text} ${colors.hover} transition-colors cursor-pointer`}
                            >
                              <Hash size={8} />
                              {tag}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Pin indicator */}
                  {note.is_pinned === 1 && (
                    <span className="text-yellow-500 text-xs flex-shrink-0 mt-0.5">📌</span>
                  )}

                  {/* Delete button */}
                  <div
                    className="homepage-note-delete absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      data-area-id={`homepage-note-delete-${note.id}`}
                      onClick={(e) => handleDeleteClick(e, note)}
                      disabled={isDeletingNote}
                      className={`p-1.5 ${c.gray} hover:text-red-400 hover:bg-red-900/20 rounded-md transition-colors`}
                      title="Delete note"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button — New Note */}
      <button
        data-area-id="homepage-fab-new-note"
        onClick={handleFabClick}
        className="homepage-fab fixed bottom-24 lg:bottom-6 right-6 z-30 w-14 h-14 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-full shadow-lg shadow-blue-500/25 flex items-center justify-center transition-all hover:shadow-xl hover:shadow-blue-500/30 active:scale-95"
        title="New Note"
      >
        <Plus size={24} />
      </button>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={noteToDelete !== null}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Note"
        message={`Are you sure you want to delete "${noteToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeletingNote}
        variant="danger"
      />
    </div>
  );
}
