import { useState, useEffect, useRef } from 'react';

/**
 * Hook to enforce minimum loading time (default 500ms)
 * This ensures skeleton loaders are visible for at least the minimum time
 * to prevent flickering and improve perceived performance
 */
export function useMinLoading(
  isLoading: boolean,
  minDuration: number = 500
): boolean {
  const [showLoading, setShowLoading] = useState(isLoading);
  const loadingStartTime = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (isLoading) {
      // Start loading - record start time and show loading immediately
      loadingStartTime.current = Date.now();
      setShowLoading(true);
    } else {
      // Loading finished - check if minimum duration has passed
      if (loadingStartTime.current) {
        const elapsed = Date.now() - loadingStartTime.current;
        const remaining = Math.max(0, minDuration - elapsed);

        if (remaining > 0) {
          // Wait for remaining time before hiding loading
          timeoutRef.current = setTimeout(() => {
            setShowLoading(false);
            loadingStartTime.current = null;
          }, remaining);
        } else {
          // Minimum duration already passed, hide immediately
          setShowLoading(false);
          loadingStartTime.current = null;
        }
      } else {
        setShowLoading(false);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, minDuration]);

  return showLoading;
}

/**
 * Hook that combines data fetching with minimum loading time
 * Usage: const { data, loading } = useMinLoadingData(fetchFunction);
 */
export function useMinLoadingData<T>(
  fetchFunction: () => Promise<T>,
  minDuration: number = 500
): { data: T | null; loading: boolean; error: Error | null; refetch: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const startTimeRef = useRef<number>(0);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    startTimeRef.current = Date.now();

    try {
      const result = await fetchFunction();
      
      // Calculate remaining time to meet minimum duration
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, minDuration - elapsed);

      if (remaining > 0) {
        await new Promise(resolve => setTimeout(resolve, remaining));
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, loading, error, refetch: fetchData };
}
