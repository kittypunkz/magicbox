import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Hash, Star, StarOff, Trash2 } from 'lucide-react';
import { useNotes } from '../hooks/useNotes';
import { apiClient } from '../api/client';
import type { Note } from '../types';

interface TagData {
  id: number;
  name: string;
  color: string;
  icon: string | null;
  pinned: number;
  note_count?: number;
}

interface TagPageProps {
  onNoteClick: (noteId: number) => void;
  onBack: () => void;
}

export function TagPage({ onNoteClick, onBack }: TagPageProps) {
  const { tagName } = useParams<{ tagName: string }>();
  const navigate = useNavigate();
  const { notes } = useNotes();
  const [tag, setTag] = useState<TagData | null>(null);
  const [tagNotes, setTagNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tagName) return;
    
    const fetchTagData = async () => {
      try {
        setLoading(true);
        
        // Get all notes and filter by tag
        const allNotes = notes.filter(n => {
          if (!n.tags) return false;
          try {
            const tags = typeof n.tags === 'string' ? JSON.parse(n.tags) : n.tags;
            return tags.includes(tagName);
          } catch {
            return false;
          }
        });
        
        setTagNotes(allNotes);
        
        // Fetch tag info
        try {
          const tagRes = await apiClient.get(`/tags/${tagName}`);
          if (tagRes.tag) {
            setTag(tagRes.tag);
          }
        } catch {
          // Tag might not exist yet, create basic info
          setTag({
            id: 0,
            name: tagName,
            color: '#3b82f6',
            icon: null,
            pinned: 0,
            note_count: allNotes.length
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tag');
      } finally {
        setLoading(false);
      }
    };

    fetchTagData();
  }, [tagName, notes]);

  const handleTogglePin = async () => {
    if (!tag || tag.id === 0) return;
    
    try {
      await apiClient.put(`/tags/${tag.id}`, { pinned: tag.pinned ? 0 : 1 });
      setTag({ ...tag, pinned: tag.pinned ? 0 : 1 });
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  };

  const handleDeleteTag = async () => {
    if (!tag || tag.id === 0) return;
    if (!confirm(`Delete tag "#${tag.name}"? Notes will not be deleted.`)) return;
    
    try {
      await apiClient.delete(`/tags/${tag.id}`);
      onBack();
    } catch (err) {
      console.error('Failed to delete tag:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
          {error}
        </div>
        <button 
          onClick={onBack}
          className="mt-4 flex items-center gap-2 text-[#6b6b6b] hover:text-[#e6e6e6]"
        >
          <ArrowLeft size={16} />
          Back
        </button>
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
          <div className="flex items-center gap-3">
            <Hash size={24} className="text-blue-500" />
            <h1 className="text-2xl font-bold text-[#e6e6e6]">{tagName}</h1>
          </div>
          <p className="text-sm text-[#6b6b6b] mt-1">
            {tagNotes.length} note{tagNotes.length !== 1 ? 's' : ''}
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
                  <div className="flex items-center gap-2 mt-2">
                    <span 
                      className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400"
                    >
                      #{tagName}
                    </span>
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