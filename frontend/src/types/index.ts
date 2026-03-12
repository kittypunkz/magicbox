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
  folder_name?: string;
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
  notes: Note[];
  folders: Folder[];
}
