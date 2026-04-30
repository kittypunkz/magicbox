export type Section = 'notes' | 'tasks' | 'ask' | 'brief' | 'bookmarks' | 'settings';

export interface ShellRouteState {
  section: Section;
  noteId: number | null;
  folderId: number | null;
  taskId: number | null;
  bookmarkId: number | null;
  fullWidth: boolean;
}
