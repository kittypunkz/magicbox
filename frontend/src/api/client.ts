import type { Folder, FolderWithNotes, Note, CreateNoteRequest, UpdateNoteRequest, SearchResult, PaginatedResponse } from '../types';

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

export type { Folder, FolderWithNotes, Note, CreateNoteRequest, UpdateNoteRequest, SearchResult };
