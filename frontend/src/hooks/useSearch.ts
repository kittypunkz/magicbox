import { useState, useEffect } from 'react';
import { searchAPI } from '../api/client';
import { useDebounce } from './useDebounce';
import type { SearchResult } from '../types';

export function useSearch(query: string, delay: number = 1000) {
  const debouncedQuery = useDebounce(query, delay);
  const [result, setResult] = useState<SearchResult>({ notes: [], folders: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResult({ notes: [], folders: [] });
      return;
    }

    const search = async () => {
      try {
        setLoading(true);
        const data = await searchAPI.search(debouncedQuery);
        setResult(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        setLoading(false);
      }
    };

    search();
  }, [debouncedQuery]);

  return { result, loading, error };
}
