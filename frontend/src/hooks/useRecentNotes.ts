import { useState, useEffect, useCallback } from 'react';
import type { Note } from '../types';

const STORAGE_KEY = 'magicbox-recent-notes';
const MAX_RECENT_NOTES = 5;

interface RecentNote {
  id: number;
  title: string;
  folder_id: number;
  folder_name: string;
  is_pinned?: number;
  bookmark_url?: string | null;
  viewedAt: string;
}

export function useRecentNotes() {
  const [recentNotes, setRecentNotes] = useState<RecentNote[]>(() => {
    if (typeof window === 'undefined') return [];
    
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Persist to localStorage whenever recentNotes changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recentNotes));
  }, [recentNotes]);

  const addRecentNote = useCallback((note: Note) => {
    setRecentNotes((prev) => {
      // Remove if already exists (will be re-added at top)
      const filtered = prev.filter((n) => n.id !== note.id);
      
      // Create new recent note entry
      const newRecent: RecentNote = {
        id: note.id,
        title: note.title,
        folder_id: note.folder_id,
        folder_name: note.folder_name || 'Inbox',
        is_pinned: note.is_pinned,
        bookmark_url: note.bookmark_url,
        viewedAt: new Date().toISOString(),
      };
      
      // Add to beginning and limit to MAX_RECENT_NOTES
      return [newRecent, ...filtered].slice(0, MAX_RECENT_NOTES);
    });
  }, []);

  const clearRecentNotes = useCallback(() => {
    setRecentNotes([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    recentNotes,
    addRecentNote,
    clearRecentNotes,
  };
}
