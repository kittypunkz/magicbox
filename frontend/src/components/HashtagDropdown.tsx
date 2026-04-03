import { useState, useEffect, useRef } from 'react';
import { Hash, Plus, Star } from 'lucide-react';
import { tagsAPI } from '../api/client';
import type { Tag } from '../types';

interface HashtagDropdownProps {
  position: { top: number; left: number };
  query: string;
  onSelect: (tagName: string) => void;
  onClose: () => void;
  onCreateTag?: (tagName: string) => void;
}

export function HashtagDropdown({
  position,
  query,
  onSelect,
  onClose,
  onCreateTag,
}: HashtagDropdownProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch tags based on query
  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      try {
        const result = query 
          ? await tagsAPI.search(query)
          : await tagsAPI.getAll();
        setTags(result);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Failed to fetch tags:', error);
        setTags([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchTags, 100);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (tags.length + 1)); // +1 for create option
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev === 0 ? tags.length : prev - 1));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (selectedIndex === tags.length) {
          // Create new tag
          onCreateTag?.(query);
        } else if (tags[selectedIndex]) {
          onSelect(tags[selectedIndex].name);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [tags, selectedIndex, query, onSelect, onClose, onCreateTag]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Check if query matches a tag exactly
  const exactMatch = tags.some((tag) => tag.name.toLowerCase() === query.toLowerCase());
  const showCreateOption = query.length > 0 && !exactMatch;

  if (tags.length === 0 && !showCreateOption && !loading) {
    return null;
  }

  return (
    <div
      ref={dropdownRef}
      className="hashtag-dropdown fixed z-50 min-w-[200px] max-w-[300px] max-h-[250px] overflow-y-auto bg-[#202020] border border-[#2f2f2f] rounded-lg shadow-xl"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {loading ? (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
        </div>
      ) : (
        <>
          {/* Tag List */}
          {tags.map((tag, index) => (
            <button
              key={tag.id}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                index === selectedIndex
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-[#e6e6e6] hover:bg-[#2f2f2f]'
              }`}
              onClick={() => onSelect(tag.name)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <Hash size={14} style={{ color: tag.color }} />
              <span className="flex-1 truncate">{tag.name}</span>
              {tag.pinned === 1 && (
                <Star size={12} className="text-yellow-500" fill="currentColor" />
              )}
              {tag.note_count !== undefined && (
                <span className="text-xs text-[#6b6b6b]">{tag.note_count}</span>
              )}
            </button>
          ))}

          {/* Create New Tag Option */}
          {showCreateOption && (
            <button
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors border-t border-[#2f2f2f] ${
                selectedIndex === tags.length
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-[#6b6b6b] hover:bg-[#2f2f2f] hover:text-[#e6e6e6]'
              }`}
              onClick={() => onCreateTag?.(query)}
              onMouseEnter={() => setSelectedIndex(tags.length)}
            >
              <Plus size={14} />
              <span className="flex-1">Create "#{query}"</span>
            </button>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Extract hashtags from text (supports nested tags like #work/client/apple)
 */
export function extractHashtags(text: string): string[] {
  const regex = /#([\w./-]+)/g;
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push(match[1]);
  }
  return [...new Set(matches)]; // Remove duplicates
}

/**
 * Parse tags from markdown content
 */
export function parseTagsFromContent(content: string): string[] {
  return extractHashtags(content);
}

/**
 * Render hashtags as clickable pills in content
 */
export function renderHashtags(
  content: string,
  onTagClick: (tagName: string) => void
): React.ReactNode[] {
  const regex = /#([\w./-]+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    // Add text before hashtag
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`}>{content.slice(lastIndex, match.index)}</span>
      );
    }

    // Add hashtag as clickable pill
    const tagName = match[1];
    parts.push(
      <button
        key={`tag-${match.index}`}
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full hover:bg-blue-500/30 transition-colors"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onTagClick(tagName);
        }}
      >
        #{tagName}
      </button>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(<span key={`text-${lastIndex}`}>{content.slice(lastIndex)}</span>);
  }

  return parts;
}
