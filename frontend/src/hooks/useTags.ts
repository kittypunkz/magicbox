import { useState, useEffect, useCallback, useRef } from 'react';
import { tagsAPI } from '../api/client';
import type { Tag } from '../types';

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [pinnedTags, setPinnedTags] = useState<Tag[]>([]);
  const [recentTags, setRecentTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchTags = useCallback(async () => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    try {
      setLoading(true);
      
      // Fetch all tags, pinned tags, and recent tags in parallel
      const [allTags, pinned, recent] = await Promise.all([
        tagsAPI.getAll(),
        tagsAPI.getPinned(),
        tagsAPI.getRecent(),
      ]);
      
      // Only update if not aborted
      if (!controller.signal.aborted) {
        setTags(allTags);
        setPinnedTags(pinned);
        setRecentTags(recent);
        setError(null);
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError' && !controller.signal.aborted) {
        setError(err instanceof Error ? err.message : 'Failed to load tags');
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchTags();
    
    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchTags]);

  const createTag = async (name: string, color?: string, icon?: string) => {
    const result = await tagsAPI.create({ name, color, icon });
    await fetchTags(); // Refresh list
    return result;
  };

  const togglePin = async (id: number, pinned: boolean) => {
    await tagsAPI.update(id, { pinned: pinned ? 1 : 0 });
    await fetchTags(); // Refresh list
  };

  const renameTag = async (id: number, newName: string): Promise<void> => {
    await tagsAPI.rename(id, newName);
    await fetchTags(); // Refresh list
  };

  const deleteTag = async (id: number) => {
    await tagsAPI.delete(id);
    await fetchTags(); // Refresh list
  };

  const searchTags = async (query: string) => {
    if (!query) return tags;
    return await tagsAPI.search(query);
  };

  const reorderPinned = async (tagIds: number[]) => {
    await tagsAPI.reorderPinned(tagIds);
    // Update local state optimistically
    setPinnedTags((prev) => {
      const reordered = tagIds
        .map((id) => prev.find((t) => t.id === id))
        .filter(Boolean) as Tag[];
      return reordered;
    });
  };

  return {
    tags,
    pinnedTags,
    recentTags,
    loading,
    error,
    refetch: fetchTags,
    createTag,
    togglePin,
    renameTag,
    deleteTag,
    searchTags,
    reorderPinned,
  };
}
