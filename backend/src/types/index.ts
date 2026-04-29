// backend/src/types/index.ts
// Single source of truth for shared types

export interface Folder {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: number;
  folder_id: number;
  title: string;
  content: string;
  bookmark_url: string | null;
  bookmark_title: string | null;
  is_pinned: number;  // 0 or 1 (SQLite boolean)
  created_at: string;
  updated_at: string;
}

export interface NoteWithFolder extends Note {
  folder_name: string;
}

export interface CreateFolderRequest {
  name: string;
}

export interface CreateNoteRequest {
  folder_id: number;
  title: string;
  content?: string;
  bookmark_url?: string;
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  folder_id?: number;
  is_pinned?: boolean;
  bookmark_url?: string | null;
}

export interface SearchResult {
  notes: NoteWithFolder[];
  folders: Folder[];
}

export interface User {
  id: number;
  username: string;
  password_hash: string | null;
  password_salt: string | null;
  created_at: string;
}

export interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;
  JWT_SECRET: string;
  OPENROUTER_API_KEY?: string;
  NODE_ENV?: string;
  [key: string]: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserContext {
  userId: number;
  username: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}
