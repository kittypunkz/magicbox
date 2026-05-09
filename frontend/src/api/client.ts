import type { Folder, FolderWithNotes, Note, CreateNoteRequest, UpdateNoteRequest, SearchResult, PaginatedResponse, Settings, OpenRouterModel, Task, TaskSummary, Subtask } from '../types';

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
  note: (id: number) => fetchAPI<{ tasks: { title: string; subtasks?: string[] }[]; note_id: number }>(`/process/notes/${id}`, {
    method: 'POST',
  }),
  recent: () => fetchAPI<{ results: { note_id: number; note_title: string; tasks: { title: string; subtasks?: string[] }[] }[] }>('/process/recent', {
    method: 'POST',
  }),
};

export const tasksAPI = {
  getSummary: (params?: { from?: string; to?: string }) => {
    const query = new URLSearchParams();
    if (params?.from) query.set('from', params.from);
    if (params?.to)   query.set('to',   params.to);
    const qs = query.toString() ? `?${query}` : '';
    return fetchAPI<TaskSummary>(`/tasks/summary${qs}`);
  },
  getAll: (params?: { status?: Task['status']; note_id?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.note_id) query.set('note_id', String(params.note_id));
    const qs = query.toString() ? `?${query}` : '';
    return fetchAPI<{ tasks: Task[] }>(`/tasks${qs}`).then(r => r.tasks);
  },
  create: (title: string, note_id?: number, status?: Task['status'], description?: string) => fetchAPI<{ task: Task }>('/tasks', {
    method: 'POST',
    body: JSON.stringify({ title, note_id, status, description }),
  }).then(r => r.task),
  getById: (id: number) =>
    fetchAPI<{ task: Task & { subtasks: Subtask[] } }>(`/tasks/${id}`).then(r => r.task),
  update: (id: number, data: { title?: string; status?: Task['status']; note_id?: number | null; description?: string | null }) =>
    fetchAPI<{ task: Task }>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }).then(r => r.task),
  delete: (id: number) => fetchAPI<{ success: boolean }>(`/tasks/${id}`, { method: 'DELETE' }),
};

export const subtasksAPI = {
  create: (taskId: number, title: string) =>
    fetchAPI<{ subtask: Subtask }>(`/tasks/${taskId}/subtasks`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    }).then(r => r.subtask),
  update: (taskId: number, subId: number, data: { title?: string; done?: boolean }) =>
    fetchAPI<{ subtask: Subtask }>(`/tasks/${taskId}/subtasks/${subId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }).then(r => r.subtask),
  delete: (taskId: number, subId: number) =>
    fetchAPI<{ success: boolean }>(`/tasks/${taskId}/subtasks/${subId}`, { method: 'DELETE' }),
};

export const uploadsAPI = {
  upload: async (file: File, noteId: number): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE}/uploads?note_id=${noteId}`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || `HTTP ${response.status}`);
    }
    const result: { success: boolean; data: { url: string; key: string } } = await response.json();
    return result.data.url;
  },
};

export const settingsAPI = {
  getAll: () => fetchAPI<{ settings: Settings }>('/settings').then(r => r.settings),
  update: (data: Partial<Settings>) => fetchAPI<{ success: boolean }>('/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  getModels: () => fetchAPI<{ models: OpenRouterModel[] }>('/settings/models').then(r => r.models),
};

export type { Folder, FolderWithNotes, Note, CreateNoteRequest, UpdateNoteRequest, SearchResult, Settings, OpenRouterModel, Task, Subtask };
