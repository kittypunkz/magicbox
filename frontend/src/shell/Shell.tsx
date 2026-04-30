import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreateNoteModal } from '../components/CreateNoteModal';
import { MobileNav } from '../components/MobileNav';
import { AskPage } from '../pages/AskPage';
import { BriefPage } from '../pages/BriefPage';
import { SettingsPage } from '../pages/SettingsPage';
import { useFolders } from '../hooks/useFolders';
import { useNotes } from '../hooks/useNotes';
import { useTasks } from '../hooks/useTasks';
import { BookmarkDetail } from '../panels/bookmarks/BookmarkDetail';
import { BookmarksList } from '../panels/bookmarks/BookmarksList';
import { NoteDetail } from '../panels/notes/NoteDetail';
import { NotesList } from '../panels/notes/NotesList';
import { TaskDetail } from '../panels/tasks/TaskDetail';
import { TasksList } from '../panels/tasks/TasksList';
import type { Note } from '../types';
import { DetailPanel } from './DetailPanel';
import { ListPanel } from './ListPanel';
import { NavRail } from './NavRail';
import type { Section, ShellRouteState } from './types';

export function Shell() {
  const navigate = useNavigate();
  const location = useLocation();
  const route = useMemo(() => getRouteState(location.pathname), [location.pathname]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { notes, loading: notesLoading, error: notesError, createNote, deleteNote, refetch } = useNotes();
  const { folders, createFolder } = useFolders();
  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    createTask,
    moveTask,
    renameTask,
    deleteTask,
    patchTask,
  } = useTasks();

  const selectedBookmark = route.bookmarkId
    ? notes.find(note => note.id === route.bookmarkId && note.bookmark_url)
    : null;

  const navigateSection = useCallback((section: Section) => {
    const pathBySection: Record<Section, string> = {
      notes: '/',
      tasks: '/tasks',
      ask: '/ask',
      brief: '/brief',
      bookmarks: '/bookmarks',
      settings: '/settings',
    };
    navigate(pathBySection[section]);
  }, [navigate]);

  const openNote = useCallback((id: number) => navigate(`/note/${id}`), [navigate]);
  const openTask = useCallback((id: number) => navigate(`/tasks/${id}`), [navigate]);
  const openBookmark = useCallback((id: number) => navigate(`/bookmarks/${id}`), [navigate]);

  const handleCreateNote = async (title: string, content: string, folderName: string | null, bookmarkUrl?: string) => {
    let folder = folderName ? folders.find(item => item.name === folderName) : undefined;
    if (!folder && folderName) {
      folder = await createFolder(folderName);
    }
    const note = await createNote({
      title,
      content: content || '',
      folder_id: folder?.id || route.folderId || 1,
      bookmark_url: bookmarkUrl,
    });
    await refetch();
    if (note?.id) navigate(bookmarkUrl ? `/bookmarks/${note.id}` : `/note/${note.id}`);
  };

  const handleDeleteNote = async (id: number) => {
    await deleteNote(id);
    await refetch();
    navigate('/');
  };

  const currentView = route.section === 'notes'
    ? route.noteId ? 'note' : route.folderId ? 'folder' : 'home'
    : route.section;

  return (
    <div className="flex h-screen overflow-hidden bg-mb-base text-mb-primary">
      <NavRail section={route.section} onNavigate={navigateSection} />

      <div className="flex min-w-0 flex-1 flex-col lg:flex-row">
        {renderMainPanels({
          route,
          notes,
          folders,
          notesLoading,
          notesError,
          selectedBookmark,
          tasks,
          tasksLoading,
          tasksError,
          openNote,
          openTask,
          openBookmark,
          navigate,
          setIsCreateModalOpen,
          handleDeleteNote,
          createTask,
          moveTask,
          renameTask,
          deleteTask,
          patchTask,
        })}
      </div>

      <MobileNav
        onShowAllNotes={() => navigate('/')}
        onCreateNote={() => setIsCreateModalOpen(true)}
        onTasksClick={() => navigate('/tasks')}
        onAskClick={() => navigate('/ask')}
        onBriefClick={() => navigate('/brief')}
        onBookmarksClick={() => navigate('/bookmarks')}
        onSettingsClick={() => navigate('/settings')}
        currentView={currentView}
      />

      <CreateNoteModal
        isOpen={isCreateModalOpen}
        folders={folders}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateNote={handleCreateNote}
        defaultFolderName={route.folderId ? folders.find(folder => folder.id === route.folderId)?.name : undefined}
      />
    </div>
  );
}

function renderMainPanels({
  route,
  notes,
  folders,
  notesLoading,
  notesError,
  selectedBookmark,
  tasks,
  tasksLoading,
  tasksError,
  openNote,
  openTask,
  openBookmark,
  navigate,
  setIsCreateModalOpen,
  handleDeleteNote,
  createTask,
  moveTask,
  renameTask,
  deleteTask,
  patchTask,
}: {
  route: ShellRouteState;
  notes: Note[];
  folders: ReturnType<typeof useFolders>['folders'];
  notesLoading: boolean;
  notesError: string | null;
  selectedBookmark: Note | null;
  tasks: ReturnType<typeof useTasks>['tasks'];
  tasksLoading: boolean;
  tasksError: string | null;
  openNote: (id: number) => void;
  openTask: (id: number) => void;
  openBookmark: (id: number) => void;
  navigate: ReturnType<typeof useNavigate>;
  setIsCreateModalOpen: (open: boolean) => void;
  handleDeleteNote: (id: number) => Promise<void>;
  createTask: ReturnType<typeof useTasks>['createTask'];
  moveTask: ReturnType<typeof useTasks>['moveTask'];
  renameTask: ReturnType<typeof useTasks>['renameTask'];
  deleteTask: ReturnType<typeof useTasks>['deleteTask'];
  patchTask: ReturnType<typeof useTasks>['patchTask'];
}) {
  if (route.section === 'ask') {
    return <DetailPanel fullWidth><AskPage onNoteClick={openNote} /></DetailPanel>;
  }
  if (route.section === 'brief') {
    return <DetailPanel fullWidth><BriefPage /></DetailPanel>;
  }
  if (route.section === 'settings') {
    return <DetailPanel fullWidth><SettingsPage /></DetailPanel>;
  }
  if (route.section === 'tasks') {
    return (
      <>
        <DetailPanel fullWidth={route.taskId === null} showOnMobile={route.taskId === null}>
          <TasksList
            tasks={tasks}
            loading={tasksLoading}
            error={tasksError}
            selectedTaskId={route.taskId}
            onSelectTask={openTask}
            onCreateTask={async (title, status) => { await createTask(title, status); }}
            onMoveTask={moveTask}
            onRenameTask={renameTask}
            onNoteClick={openNote}
          />
        </DetailPanel>
        {route.taskId !== null && (
          <TaskDetail
            taskId={route.taskId}
            onClose={() => navigate('/tasks')}
            onTaskUpdated={patchTask}
            onDelete={async id => {
              await deleteTask(id);
              navigate('/tasks');
            }}
            onNoteClick={openNote}
          />
        )}
      </>
    );
  }
  if (route.section === 'bookmarks') {
    return (
      <>
        <ListPanel hidden={route.bookmarkId !== null}>
          <BookmarksList
            notes={notes}
            loading={notesLoading}
            error={notesError}
            selectedBookmarkId={route.bookmarkId}
            onSelectBookmark={openBookmark}
          />
        </ListPanel>
        <DetailPanel showOnMobile={route.bookmarkId !== null}>
          <BookmarkDetail bookmark={selectedBookmark} onViewNote={openNote} />
        </DetailPanel>
      </>
    );
  }

  return (
    <>
      <ListPanel hidden={route.noteId !== null}>
        <NotesList
          notes={notes}
          folders={folders}
          loading={notesLoading}
          error={notesError}
          selectedNoteId={route.noteId}
          selectedFolderId={route.folderId}
          onSelectNote={openNote}
          onSelectFolder={id => navigate(id ? `/folder/${id}` : '/')}
          onCreateNote={() => setIsCreateModalOpen(true)}
        />
      </ListPanel>
      <DetailPanel showOnMobile={route.noteId !== null}>
        <NoteDetail
          noteId={route.noteId}
          onBack={() => navigate(route.folderId ? `/folder/${route.folderId}` : '/')}
          onDelete={handleDeleteNote}
        />
      </DetailPanel>
    </>
  );
}

function getRouteState(pathname: string): ShellRouteState {
  const parts = pathname.split('/').filter(Boolean);
  const [first, second] = parts;
  const numeric = second ? Number(second) : null;
  const id = numeric !== null && !Number.isNaN(numeric) ? numeric : null;

  if (first === 'note') return { section: 'notes', noteId: id, folderId: null, taskId: null, bookmarkId: null, fullWidth: false };
  if (first === 'folder') return { section: 'notes', noteId: null, folderId: id, taskId: null, bookmarkId: null, fullWidth: false };
  if (first === 'tasks') return { section: 'tasks', noteId: null, folderId: null, taskId: id, bookmarkId: null, fullWidth: false };
  if (first === 'ask') return { section: 'ask', noteId: null, folderId: null, taskId: null, bookmarkId: null, fullWidth: true };
  if (first === 'brief') return { section: 'brief', noteId: null, folderId: null, taskId: null, bookmarkId: null, fullWidth: true };
  if (first === 'bookmarks') return { section: 'bookmarks', noteId: null, folderId: null, taskId: null, bookmarkId: id, fullWidth: false };
  if (first === 'settings') return { section: 'settings', noteId: null, folderId: null, taskId: null, bookmarkId: null, fullWidth: true };
  return { section: 'notes', noteId: null, folderId: null, taskId: null, bookmarkId: null, fullWidth: false };
}
