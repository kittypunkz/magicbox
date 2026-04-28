import { useState, useEffect, useCallback } from 'react';
import { tasksAPI } from '../api/client';
import type { TaskSummary } from '../types';

export interface DateRange {
  from: string;
  to: string;
}

export function useSummary(range?: DateRange) {
  const [summary, setSummary] = useState<TaskSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await tasksAPI.getSummary(range);
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load summary');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range?.from, range?.to]);

  useEffect(() => { load(); }, [load]);

  return { summary, loading, error, refetch: load };
}
