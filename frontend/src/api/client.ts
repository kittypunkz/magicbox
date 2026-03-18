import type { Folder, FolderWithNotes, Note, CreateNoteRequest, UpdateNoteRequest, SearchResult } from '../types';

// API Base URL - Uses environment variable or localhost:8787 for development
const isDev = import.meta.env.DEV;
const API_BASE = import.meta.env.VITE_API_URL || (isDev ? 'http://localhost:8787' : '/api');

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  console.log(`API Request: ${options?.method || 'GET'} ${url}`, options?.body ? JSON.parse(options.body as string) : '');
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });
    
    console.log(`API Response: ${response.status} ${url}`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error(`API Error Details:`, error);
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    
    return response.json();
  } catch (err) {
    console.error(`Fetch error for ${url}:`, err);
    throw err;
  }
}

export const foldersAPI = {
  getAll: () => fetchAPI<Folder[]>('/folders'),
  getById: (id: number) => fetchAPI<FolderWithNotes>(`/folders/${id}`),
  create: (name: string) => fetchAPI<Folder>('/folders', {
    method: 'POST',
    body: JSON.stringify({ name }),
  }),
  update: (id: number, name: string) => fetchAPI<Folder>(`/folders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  }),
  delete: (id: number) => fetchAPI<{ success: boolean }>(`/folders/${id}`, {
    method: 'DELETE',
  }),
};

export const notesAPI = {
  getAll: (folderId?: number) => {
    const query = folderId ? `?folder_id=${folderId}` : '';
    return fetchAPI<Note[]>(`/notes${query}`);
  },
  getById: (id: number) => fetchAPI<Note>(`/notes/${id}`),
  create: (data: CreateNoteRequest) => fetchAPI<Note>('/notes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: UpdateNoteRequest) => fetchAPI<Note>(`/notes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetchAPI<{ success: boolean }>(`/notes/${id}`, {
    method: 'DELETE',
  }),
};

export const searchAPI = {
  search: (query: string) => fetchAPI<SearchResult>(`/search?q=${encodeURIComponent(query)}`),
};

export type { Folder, FolderWithNotes, Note, CreateNoteRequest, UpdateNoteRequest, SearchResult };
