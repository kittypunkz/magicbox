import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Hash, Star, StarOff, Trash2 } from 'lucide-react';
import { tagsAPI } from '../api/client';
import type { Note, Tag } from '../types';

interface TagPageProps {
  onNoteClick: (noteId: number) => void;
  onBack: () => void;
}

export function TagPage({ onNoteClick, onBack }: TagPageProps) {
  const { tagName } = useParams<{ tagName: string }>();
  const [tag, setTag] = useState<Tag | null>(null);
  const [tagNotes, setTagNotes] = useState<Note[]>([]);
  const [descendantCount, setDescendantCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tagName) return;
    
    const fetchTagData = async () => {
      try {
        setLoading(true);
        
        // Fetch tag info and notes from API
        const result = await tagsAPI.getByName(tagName);
        setTag(result.tag);
        setTagNotes(result.notes);
        setDescendantCount((result as any).descendant_count ?? result.notes.length);
      } catch (err) {
        // Tag might not exist yet, create basic info
        setTag({
          id: 0,
          name: tagName,
          color: '#3b82f6',
          icon: null,
          pinned: 0,
          pin_order: 0,
          note_count: 0,
        });
        setTagNotes([]);
        setDescendantCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchTagData();
  }, [tagName]);

  const handleTogglePin = async () => {
    if (!tag || tag.id === 0) return;
    
    try {
      await tagsAPI.update(tag.id, { pinned: tag.pinned ? 0 : 1 });
      setTag({ ...tag, pinned: tag.pinned ? 0 : 1 });
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  };

  const handleDeleteTag = async () => {
    if (!tag || tag.id === 0) return;
    if (!confirm(`Delete tag "#${tag.name}"? Notes will not be deleted.`)) return;
    
    try {
      await tagsAPI.delete(tag.id);
      onBack();
    } catch (err) {
      console.error('Failed to delete tag:', err);
    }
  };

  // Build breadcrumb segments for nested tags
  const tagSegments = tagName ? tagName.split('/') : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 text-[#6b6b6b] hover:text-[#e6e6e6] transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="flex-1">
          {/* Breadcrumb for nested tags */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {tagSegments.map((segment, index) => {
              const isLast = index === tagSegments.length - 1;
              
              return (
                <span key={index} className="flex items-center gap-1.5">
                  {index > 0 && <span className="text-[#6b6b6b] text-sm">/</span>}
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm ${
                    isLast 
                      ? 'bg-blue-500/20 text-blue-400' 
                      : 'text-[#6b6b6b] hover:text-[#e6e6e6] cursor-pointer'
                  }`}>
                    <Hash size={12} style={{ color: isLast ? '#3b82f6' : '#6b6b6b' }} />
                    {segment}
                  </span>
                </span>
              );
            })}
          </div>
          
          <p className="text-sm text-[#6b6b6b] mt-2">
            {tagNotes.length} note{tagNotes.length !== 1 ? 's' : ''}
            {descendantCount > tagNotes.length && (
              <span className="text-[#4a4a4a]">
                {' '}(including {descendantCount - tagNotes.length} from child tags)
              </span>
            )}
          </p>
        </div>

        {tag && tag.id > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleTogglePin}
              className={`p-2 rounded-lg transition-colors ${
                tag.pinned ? 'text-yellow-500' : 'text-[#6b6b6b] hover:text-[#e6e6e6]'
              }`}
              title={tag.pinned ? 'Unpin' : 'Pin to sidebar'}
            >
              {tag.pinned ? <Star fill="currentColor" size={18} /> : <StarOff size={18} />}
            </button>
            <button
              onClick={handleDeleteTag}
              className="p-2 text-[#6b6b6b] hover:text-red-400 transition-colors"
              title="Delete tag"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Notes List */}
      {tagNotes.length === 0 ? (
        <div className="text-center py-12">
          <Hash size={48} className="mx-auto text-[#2f2f2f] mb-4" />
          <p className="text-[#6b6b6b]">No notes with this tag yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tagNotes.map((note) => (
            <button
              key={note.id}
              onClick={() => onNoteClick(note.id)}
              className="w-full text-left p-4 bg-[#202020] hover:bg-[#2a2a2a] rounded-lg transition-colors group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-[#e6e6e6] truncate">
                    {note.title || 'Untitled'}
                  </h3>
                  {note.content && (
                    <p className="text-sm text-[#6b6b6b] mt-1 line-clamp-2">
                      {note.content.slice(0, 150)}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {/* Show tags that match */}
                    {(Array.isArray(note.tags) ? note.tags : JSON.parse(note.tags || '[]'))
                      .filter((t: string) => t.startsWith(tagName + '/') || t === tagName)
                      .slice(0, 3)
                      .map((t: string, idx: number) => (
                        <span 
                          key={idx}
                          className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400"
                        >
                          #{t}
                        </span>
                      ))
                    }
                    {note.is_pinned === 1 && (
                      <Star size={12} className="text-yellow-500" fill="currentColor" />
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default TagPage;
