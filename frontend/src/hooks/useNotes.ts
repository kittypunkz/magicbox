import { useState, useEffect, useCallback } from 'react';
import { notesAPI } from '../api/client';
import type { Note, CreateNoteRequest, UpdateNoteRequest } from '../types';

export function useNotes(folderId?: number) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await notesAPI.getAll(folderId);
      setNotes(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    fetchNotes();
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

  useEffect(() => {
    if (!id) {
      setNote(null);
      return;
    }

    const fetchNote = async () => {
      try {
        setLoading(true);
        const data = await notesAPI.getById(id);
        setNote(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load note');
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [id]);

  const updateNote = async (data: UpdateNoteRequest) => {
    if (!id) return;
    const updated = await notesAPI.update(id, data);
    setNote(updated);
    return updated;
  };

  return { note, loading, error, updateNote };
}
