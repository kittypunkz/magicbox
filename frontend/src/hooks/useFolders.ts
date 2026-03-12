import { useState, useEffect, useCallback } from 'react';
import { foldersAPI } from '../api/client';
import type { Folder, FolderWithNotes } from '../types';

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to add a new folder locally (for instant UI update)
  const addFolderLocally = useCallback((newFolder: Folder) => {
    setFolders((prev) => [...prev, newFolder].sort((a, b) => a.name.localeCompare(b.name)));
  }, []);

  const fetchFolders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await foldersAPI.getAll();
      setFolders(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const createFolder = async (name: string) => {
    const folder = await foldersAPI.create(name);
    setFolders((prev) => [...prev, folder].sort((a, b) => a.name.localeCompare(b.name)));
    return folder;
  };

  const updateFolder = async (id: number, name: string) => {
    const folder = await foldersAPI.update(id, name);
    setFolders((prev) => prev.map((f) => (f.id === id ? folder : f)).sort((a, b) => a.name.localeCompare(b.name)));
    return folder;
  };

  const deleteFolder = async (id: number) => {
    await foldersAPI.delete(id);
    setFolders((prev) => prev.filter((f) => f.id !== id));
  };

  return {
    folders,
    loading,
    error,
    refetch: fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    addFolderLocally,
  };
}

export function useFolder(id: number | null) {
  const [folder, setFolder] = useState<FolderWithNotes | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setFolder(null);
      return;
    }

    const fetchFolder = async () => {
      try {
        setLoading(true);
        const data = await foldersAPI.getById(id);
        setFolder(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load folder');
      } finally {
        setLoading(false);
      }
    };

    fetchFolder();
  }, [id]);

  return { folder, loading, error };
}
