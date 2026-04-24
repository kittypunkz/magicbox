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
  created_at: string;
  updated_at: string;
  folder_name?: string;
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
  is_pinned?: boolean;  // NEW
  bookmark_url?: string | null;
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

export interface Task {
  id: number;
  note_id: number | null;
  title: string;
  status: 'backlog' | 'doing' | 'done';
  created_at: string;
  completed_at: string | null;
}

export interface TaskSummary {
  date: string;
  backlog: Task[];
  doing: Task[];
  done_today: Task[];
}

export interface OpenRouterModel {
  id: string;
  name: string;
}

export interface Settings {
  openrouter_api_key?: string;
  preferred_model?: string;
}
