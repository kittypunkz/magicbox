import { useState, useEffect, useCallback } from 'react';
import { tasksAPI } from '../api/client';
import type { Task } from '../types';

export function useTasks(statusFilter?: 'pending' | 'done') {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await tasksAPI.getAll(statusFilter);
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const createTask = useCallback(async (title: string, note_id?: number) => {
    const task = await tasksAPI.create(title, note_id);
    setTasks(prev => [task, ...prev]);
    return task;
  }, []);

  const toggleTask = useCallback(async (id: number, currentStatus: 'pending' | 'done') => {
    const newStatus = currentStatus === 'done' ? 'pending' : 'done';
    const updated = await tasksAPI.update(id, { status: newStatus });
    setTasks(prev => prev.map(t => t.id === id ? updated : t));
    return updated;
  }, []);

  const renameTask = useCallback(async (id: number, title: string) => {
    const updated = await tasksAPI.update(id, { title });
    setTasks(prev => prev.map(t => t.id === id ? updated : t));
    return updated;
  }, []);

  const deleteTask = useCallback(async (id: number) => {
    await tasksAPI.delete(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  return { tasks, loading, error, createTask, toggleTask, renameTask, deleteTask, refetch: load };
}
