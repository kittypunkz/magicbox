export interface Folder {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface FolderWithNotes extends Folder {
  notes: NoteSummary[];
}

export interface NoteSummary {
  id: number;
  title: string;
  content?: string;
  bookmark_url?: string | null;
  bookmark_title?: string | null;
  folder_name?: string;
  is_pinned: number;
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
  is_pinned: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  folder_name?: string;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
  icon: string | null;
  pinned: number;
  pin_order: number;
  note_count?: number;
}

export interface CreateFolderRequest {
  name: string;
}

export interface CreateNoteRequest {
  folder_id: number;
  title: string;
  content?: string;
  bookmark_url?: string;
  tags?: string[];
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  folder_id?: number;
  is_pinned?: boolean;
  bookmark_url?: string | null;
  tags?: string[];
}

export interface SearchResult {
  notes: Note[];
  folders: Folder[];
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

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}
