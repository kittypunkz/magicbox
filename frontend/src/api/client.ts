import type { Folder, FolderWithNotes, Note, CreateNoteRequest, UpdateNoteRequest, SearchResult, PaginatedResponse, Settings, OpenRouterModel, Task } from '../types';

// API Base URL - Uses environment variable or localhost:8787 for development
const isDev = import.meta.env.DEV;
const API_BASE = import.meta.env.VITE_API_URL || (isDev ? 'http://localhost:8787' : '/api');

async function fetchAPI<T>(
  path: string, 
  options?: RequestInit & { timeout?: number }
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options?.timeout || 10000);
  
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    
    return response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if ((err as Error).name === 'AbortError') {
      throw new Error('Request timeout - please try again');
    }
    throw err;
  }
}

export const foldersAPI = {
  getAll: () => fetchAPI<PaginatedResponse<Folder>>('/folders').then(r => r.data),
  getById: (id: number) => fetchAPI<{ data: FolderWithNotes }>(`/folders/${id}`).then(r => r.data),
  create: (name: string) => fetchAPI<{ data: Folder }>('/folders', {
    method: 'POST',
    body: JSON.stringify({ name }),
  }).then(r => r.data),
  update: (id: number, name: string) => fetchAPI<{ data: Folder }>(`/folders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  }).then(r => r.data),
  delete: (id: number) => fetchAPI<{ success: boolean }>(`/folders/${id}`, {
    method: 'DELETE',
  }),
};

export const notesAPI = {
  getAll: (folderId?: number, options?: { signal?: AbortSignal }) => {
    const query = folderId ? `?folder_id=${folderId}` : '';
    return fetchAPI<PaginatedResponse<Note>>(`/notes${query}`, options).then(r => r.data);
  },
  getById: (id: number, options?: { signal?: AbortSignal }) => 
    fetchAPI<{ data: Note }>(`/notes/${id}`, options).then(r => r.data),
  create: (data: CreateNoteRequest) => fetchAPI<{ data: Note }>('/notes', {
    method: 'POST',
    body: JSON.stringify(data),
  }).then(r => r.data),
  update: (id: number, data: UpdateNoteRequest) => fetchAPI<{ data: Note }>(`/notes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }).then(r => r.data),
  delete: (id: number) => fetchAPI<{ success: boolean }>(`/notes/${id}`, {
    method: 'DELETE',
  }),
};

export const searchAPI = {
  search: (query: string) => 
    fetchAPI<SearchResult & PaginatedResponse<Note>>(`/search?q=${encodeURIComponent(query)}`),
};

export const bookmarksAPI = {
  getMetadata: (url: string) => fetchAPI<{ success: boolean; data: { title: string | null; hostname: string } }>(
    `/bookmarks/metadata?url=${encodeURIComponent(url)}`,
    { timeout: 8000 }
  ).then(r => r.data),
};

export const briefAPI = {
  getToday: () => fetchAPI<{ brief: { id: number; date: string; content: string; created_at: string } }>('/brief'),
  getAll: () => fetchAPI<{ briefs: { id: number; date: string; created_at: string; preview: string }[] }>('/brief/all'),
};

export const processAPI = {
  note: (id: number) => fetchAPI<{ tasks: { title: string }[]; note_id: number }>(`/process/notes/${id}`, {
    method: 'POST',
  }),
  recent: () => fetchAPI<{ results: { note_id: number; note_title: string; tasks: { title: string }[] }[] }>('/process/recent', {
    method: 'POST',
  }),
};

export const tasksAPI = {
  getAll: (status?: 'pending' | 'done') => {
    const query = status ? `?status=${status}` : '';
    return fetchAPI<{ tasks: Task[] }>(`/tasks${query}`).then(r => r.tasks);
  },
  create: (title: string, note_id?: number) => fetchAPI<{ task: Task }>('/tasks', {
    method: 'POST',
    body: JSON.stringify({ title, note_id }),
  }).then(r => r.task),
  update: (id: number, data: { title?: string; status?: 'pending' | 'done' }) =>
    fetchAPI<{ task: Task }>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }).then(r => r.task),
  delete: (id: number) => fetchAPI<{ success: boolean }>(`/tasks/${id}`, { method: 'DELETE' }),
};

export const settingsAPI = {
  getAll: () => fetchAPI<{ settings: Settings }>('/settings').then(r => r.settings),
  update: (data: Partial<Settings>) => fetchAPI<{ success: boolean }>('/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  getModels: () => fetchAPI<{ models: OpenRouterModel[] }>('/settings/models').then(r => r.models),
};

export type { Folder, FolderWithNotes, Note, CreateNoteRequest, UpdateNoteRequest, SearchResult, Settings, OpenRouterModel, Task };
