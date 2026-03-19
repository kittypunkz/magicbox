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
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  folder_id?: number;
}

export interface SearchResult {
  notes: NoteWithFolder[];
  folders: Folder[];
}

export interface User {
  id: number;
  username: string;
  created_at: string;
}

export interface Credential {
  id: string;
  user_id: number;
  public_key: string;
  algorithm: string;
  counter: number;
  created_at: string;
  last_used_at: string | null;
}

export interface Env {
  DB: D1Database;
  [key: string]: unknown;
}
