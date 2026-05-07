import { useState, useEffect, useCallback, useRef } from 'react';
import { notesAPI } from '../api/client';
import type { Note, CreateNoteRequest, UpdateNoteRequest } from '../types';

export function useNotes(folderId?: number) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchNotes = useCallback(async () => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    try {
      setLoading(true);
      const data = await notesAPI.getAll(folderId, { signal: controller.signal });
      
      // Only update if not aborted
      if (!controller.signal.aborted) {
        setNotes(data);
        setError(null);
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError' && !controller.signal.aborted) {
        setError(err instanceof Error ? err.message : 'Failed to load notes');
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [folderId]);

  useEffect(() => {
    fetchNotes();
    
    // Cleanup on unmount or folderId change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchNotes]);

  const createNote = async (data: CreateNoteRequest) => {
    const note = await notesAPI.create(data);
    setNotes((prev) => [note, ...prev]);
    return note;
  };

  const updateNote = async (id: number, data: UpdateNoteRequest) => {
    const note = await notesAPI.update(id, data);
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...note } : n)));
    return note;
  };

  const deleteNote = async (id: number) => {
    await notesAPI.delete(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return {
    notes,
    loading,
    error,
    refetch: fetchNotes,
    createNote,
    updateNote,
    deleteNote,
  };
}

export function useNote(id: number | null) {
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!id) {
      setNote(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const fetchNote = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await notesAPI.getById(id, { signal: controller.signal });
        
        if (!controller.signal.aborted) {
          setNote(data);
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError' && !controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Failed to load note');
          setNote(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchNote();

    return () => {
      controller.abort();
    };
  }, [id]);

  const updateNote = async (data: UpdateNoteRequest) => {
    if (!id) return;
    const updated = await notesAPI.update(id, data);
    setNote(updated);
    return updated;
  };

  return { note, loading, error, updateNote };
}
