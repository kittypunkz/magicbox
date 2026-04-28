import { useState, useEffect, useCallback } from 'react';
import { tasksAPI } from '../api/client';
import type { Task } from '../types';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await tasksAPI.getAll();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createTask = useCallback(async (title: string, status: Task['status'] = 'backlog', note_id?: number) => {
    const task = await tasksAPI.create(title, note_id, status);
    setTasks(prev => [task, ...prev]);
    return task;
  }, []);

  const mergeTask = (prev: Task[], id: number, updated: Task) =>
    prev.map(t => t.id === id ? { subtasks: t.subtasks, ...updated } : t);

  const moveTask = useCallback(async (id: number, status: Task['status']) => {
    // Optimistic update — move immediately so the user sees instant feedback
    let original: Task | undefined;
    setTasks(prev => {
      original = prev.find(t => t.id === id);
      return prev.map(t =>
        t.id === id
          ? { ...t, status, completed_at: status !== 'done' ? null : t.completed_at }
          : t
      );
    });

    try {
      const updated = await tasksAPI.update(id, { status });
      // Confirm with server value (picks up server-set completed_at), preserve subtasks
      setTasks(prev => mergeTask(prev, id, updated));
      return updated;
    } catch (err) {
      // Revert to original on failure
      if (original) {
        setTasks(prev => prev.map(t => t.id === id ? original! : t));
      }
      setError(err instanceof Error ? err.message : 'Failed to move task');
      throw err;
    }
  }, []);

  const renameTask = useCallback(async (id: number, title: string) => {
    const updated = await tasksAPI.update(id, { title });
    setTasks(prev => mergeTask(prev, id, updated));
    return updated;
  }, []);

  const deleteTask = useCallback(async (id: number) => {
    await tasksAPI.delete(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const linkNote = useCallback(async (id: number, note_id: number | null) => {
    const updated = await tasksAPI.update(id, { note_id });
    setTasks(prev => mergeTask(prev, id, updated));
    return updated;
  }, []);

  const patchTask = useCallback((updated: Task) => {
    setTasks(prev => mergeTask(prev, updated.id, updated));
  }, []);

  return { tasks, loading, error, createTask, moveTask, renameTask, deleteTask, linkNote, patchTask, refetch: load };
}
