import { useEffect, useState, useCallback } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { CreateNoteModal } from './components/CreateNoteModal';
import { MobileNav } from './components/MobileNav';
import { FolderPage } from './pages/FolderPage';
import { NoteEditor } from './components/NoteEditor';
import { NotesPage } from './pages/NotesPage';
import { LoginPage } from './pages/LoginPage';
import { SetupPage } from './pages/SetupPage';
import { SettingsPage } from './pages/SettingsPage';
import { TasksPage } from './pages/TasksPage';
import { AskPage } from './pages/AskPage';
import { BriefPage } from './pages/BriefPage';
import { BookmarksPage } from './pages/BookmarksPage';
import { TodayPage } from './pages/TodayPage';
import { tasksAPI } from './api/client';
import { useNotes } from './hooks/useNotes';
import { useFolders } from './hooks/useFolders';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import type { Note, Folder } from './types';
import { useMinLoading } from './hooks/useMinLoading';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { SearchBar } from './components/SearchBar';
import './App.css';
import { Agentation } from 'agentation';
import { ErrorBoundary } from './components/ErrorBoundary';

type ViewType = 'today' | 'notes' | 'folder' | 'note' | 'settings' | 'tasks' | 'ask' | 'brief' | 'bookmarks';

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Test mode bypass — skip auth for E2E tests
  const isTestMode = import.meta.env.VITE_TEST_MODE === 'true';
  if (isTestMode) {
    return <>{children}</>;
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#faff69]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Auth redirect - if already logged in, redirect to home
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#faff69]" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Setup redirect - if already set up, redirect to login
function SetupRoute({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#faff69]" />
      </div>
    );
  }

  return <>{children}</>;
}


function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { folderId, noteId } = useParams<{ folderId?: string; noteId?: string }>();
  // View state
  const [view, setView] = useState<ViewType>('today');
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | undefined>(undefined);

  // UI state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);

  const [noteDropdownOpen, setNoteDropdownOpen] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { notes, deleteNote, createNote, refetch: refetchNotes, loading: notesLoading } = useNotes();
  const { folders, createFolder, updateFolder, deleteFolder, loading: foldersLoading } = useFolders();

  const loading = notesLoading || foldersLoading;
  const showLoading = useMinLoading(loading);

  // Check mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar on route change on mobile
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  // URL sync - update state when URL changes
  useEffect(() => {
    if (noteId) {
      const id = parseInt(noteId);
      if (!isNaN(id)) {
        setView('note');
        setSelectedNoteId(id);
      }
    } else if (folderId) {
      const id = parseInt(folderId);
      if (!isNaN(id)) {
        setView('folder');
        setSelectedFolderId(id);
      }
    } else if (location.pathname === '/tasks') {
        setView('tasks');
        setSelectedFolderId(null);
        setSelectedNoteId(null);
    } else if (location.pathname === '/ask') {
      setView('ask');
      setSelectedFolderId(null);
      setSelectedNoteId(null);
    } else if (location.pathname === '/brief') {
      setView('brief');
      setSelectedFolderId(null);
      setSelectedNoteId(null);
    } else if (location.pathname === '/bookmarks') {
      setView('bookmarks');
      setSelectedFolderId(null);
      setSelectedNoteId(null);
    } else if (location.pathname === '/settings') {
      setView('settings');
      setSelectedFolderId(null);
      setSelectedNoteId(null);
    } else if (location.pathname === '/notes') {
      setView('notes');
      setSelectedFolderId(null);
      setSelectedNoteId(null);
    } else if (location.pathname === '/') {
      setView('today');
      setSelectedFolderId(null);
      setSelectedNoteId(null);
    }
  }, [noteId, folderId, location.pathname]);

  // Update selectedNote when selectedNoteId changes
  useEffect(() => {
    if (selectedNoteId) {
      const note = notes.find(n => n.id === selectedNoteId);
      setSelectedNote(note);
    } else {
      setSelectedNote(undefined);
    }
  }, [selectedNoteId, notes]);

  // Navigation handlers — only call navigate(); URL-sync effect drives view state
  const showToday = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const showAllNotes = useCallback(() => {
    navigate('/notes');
  }, [navigate]);

  const showSettings = useCallback(() => {
    navigate('/settings');
  }, [navigate]);

  const showTasks = useCallback(() => {
    navigate('/tasks');
  }, [navigate]);

  const showAsk = useCallback(() => {
    navigate('/ask');
  }, [navigate]);

  const showBrief = useCallback(() => {
    navigate('/brief');
  }, [navigate]);

  const showBookmarks = useCallback(() => {
    navigate('/bookmarks');
  }, [navigate]);

  const showFolder = useCallback((folderId: number) => {
    navigate(`/folder/${folderId}`);
  }, [navigate]);

  const showNote = useCallback((noteId: number) => {
    navigate(`/note/${noteId}`);
  }, [navigate]);

  const handleNoteClick = useCallback((note: Note) => {
    showNote(note.id);
  }, [showNote]);

  const handleNoteDeleted = useCallback((noteId: number) => {
    deleteNote(noteId);
    if (selectedNoteId === noteId) {
      showAllNotes();
    }
  }, [deleteNote, selectedNoteId, showAllNotes]);

  // Folder handlers
  const handleCreateFolder = useCallback(async (name: string) => {
    return await createFolder(name);
  }, [createFolder]);

  const handleFolderEdit = useCallback((folder: Folder) => {
    setEditingFolder(folder);
  }, []);

  const handleFolderUpdate = useCallback((id: number, name: string) => {
    updateFolder(id, name);
    setEditingFolder(null);
  }, [updateFolder]);

  const handleFolderDeleted = useCallback((folderId: number) => {
    deleteFolder(folderId);
    if (selectedFolderId === folderId) {
      showAllNotes();
    }
  }, [deleteFolder, selectedFolderId, showAllNotes]);

  // Modal handlers
  const handleCreateNote = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  const handleCreateNoteSubmit = useCallback(async (title: string, content: string, folderId: number, bookmarkUrl?: string) => {
    const newNote = await createNote({ title, content: content || '', folder_id: folderId, bookmark_url: bookmarkUrl });
    await refetchNotes();
    setIsCreateModalOpen(false);
    if (newNote?.id) {
      showNote(newNote.id);
    }
  }, [createNote, refetchNotes, showNote]);

  const handleCloseModal = useCallback(() => {
    setIsCreateModalOpen(false);
  }, []);

  const handleCreateTaskSubmit = useCallback(async (title: string, description?: string) => {
    await tasksAPI.create(title, undefined, 'backlog', description);
    setIsCreateModalOpen(false);
    showTasks();
  }, [showTasks]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        setIsCreateModalOpen(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const getFolderName = useCallback((folderId: number | null) => {
    if (!folderId) return 'Notes';
    const folder = folders.find(f => f.id === folderId);
    return folder?.name ?? 'Unknown Folder';
  }, [folders]);

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          ${isMobile ? 'fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 w-[280px]' : 'relative flex-shrink-0'}
          ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
        `}
      >
        <Sidebar
          folders={folders}
          recentNotes={notes.slice(0, 5)}
          onFolderClick={showFolder}
          onNoteClick={handleNoteClick}
          onCreateNote={handleCreateNote}
          onCreateFolder={handleCreateFolder}
          onFolderEdit={handleFolderEdit}
          onFolderDelete={handleFolderDeleted}
          editingFolder={editingFolder}
          onFolderUpdate={handleFolderUpdate}
          onCancelEdit={() => setEditingFolder(null)}
          loading={showLoading}
          currentView={view}
          selectedFolderId={selectedFolderId}
          onCloseMobile={() => setSidebarOpen(false)}
          isMobile={isMobile}
          onTodayClick={showToday}
          onNotesClick={showAllNotes}
          onSettingsClick={showSettings}
          onTasksClick={showTasks}
          onAskClick={showAsk}
          onBriefClick={showBrief}
          onBookmarksClick={showBookmarks}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 lg:px-6 py-3 border-b border-[#2a2a2a] bg-[#1a1a1a]/50 backdrop-blur-sm sticky top-0 z-30">
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-[#888888] hover:text-[#e6e6e6] active:scale-95 transition-all"
              aria-label="Open menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}

          {view === 'note' && (
            <button
              onClick={handleBack}
              className="p-2 -ml-2 text-[#888888] hover:text-[#e6e6e6] active:scale-95 transition-all"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
          )}

          <h1 className="text-lg font-semibold text-[#e6e6e6] truncate">
            {view === 'today' && 'Today'}
            {view === 'notes' && 'Notes'}
            {view === 'folder' && getFolderName(selectedFolderId)}
            {view === 'note' && (selectedNote?.title || 'Untitled')}
            {view === 'settings' && 'Settings'}
            {view === 'tasks' && 'Tasks'}
            {view === 'ask' && 'Ask'}
            {view === 'brief' && 'Daily Brief'}
            {view === 'bookmarks' && 'Bookmarks'}
          </h1>

          <div className="flex-1" />

          <SearchBar onNoteClick={showNote} onFolderClick={showFolder} />

          {view === 'note' && selectedNote && (
            <div className="relative">
              <button
                onClick={() => setNoteDropdownOpen(noteDropdownOpen === selectedNote.id ? null : selectedNote.id)}
                className="p-2 text-[#888888] hover:text-[#e6e6e6] active:scale-95 transition-all"
              >
                <MoreVertical size={20} />
              </button>
              {noteDropdownOpen === selectedNote.id && (
                <div className="absolute right-0 mt-1 w-48 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-lg py-1 z-50">
                  <button
                    onClick={() => {
                      handleNoteDeleted(selectedNote.id);
                      setNoteDropdownOpen(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-[#242424]"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          {view === 'today' && (
            <TodayPage
              onCreateNote={handleCreateNote}
              onSelectNote={handleNoteClick}
            />
          )}

          {view === 'notes' && (
            <NotesPage
              folders={folders}
              onSelectNote={handleNoteClick}
              onCreateNote={handleCreateNote}
            />
          )}

          {view === 'folder' && selectedFolderId && (
            <FolderPage
              folderId={selectedFolderId}
              folders={folders}
              onSelectNote={handleNoteClick}
              onCreateNote={handleCreateNoteSubmit}
            />
          )}

          {view === 'note' && selectedNoteId && (
            <NoteEditor
              noteId={selectedNoteId}
              onBack={handleBack}
              onDelete={(id) => {
                deleteNote(id);
                showAllNotes();
              }}
            />
          )}

          {view === 'settings' && (
            <SettingsPage />
          )}

          {view === 'tasks' && (
            <TasksPage onNoteClick={showNote} />
          )}

          {view === 'ask' && (
            <AskPage onNoteClick={showNote} />
          )}

          {view === 'brief' && (
            <BriefPage />
          )}

          {view === 'bookmarks' && (
            <BookmarksPage onSelectNote={handleNoteClick} onCreateNote={handleCreateNote} />
          )}
        </main>

        {/* Mobile Navigation */}
        <MobileNav
          onShowToday={showToday}
          onShowAllNotes={showAllNotes}
          onCreateNote={handleCreateNote}
          onTasksClick={showTasks}
          onAskClick={showAsk}
          onBriefClick={showBrief}
          onBookmarksClick={showBookmarks}
          onSettingsClick={showSettings}
          currentView={view}
        />
      </div>

      {/* Modals */}
      <CreateNoteModal
        isOpen={isCreateModalOpen}
        folders={folders}
        onClose={handleCloseModal}
        onCreateNote={async (title, content, folderName, bookmarkUrl) => {
          // Find or create folder
          let folder = folders.find(f => f.name === folderName);
          if (!folder && folderName) {
            folder = await createFolder(folderName);
          }
          const folderId = folder?.id || 1;

          // Create note (with optional bookmark_url)
          const newNote = await createNote({ title, content: content || '', folder_id: folderId, bookmark_url: bookmarkUrl });
          await refetchNotes();
          handleCloseModal();

          // Redirect to the new note
          if (newNote?.id) {
            showNote(newNote.id);
          }
        }}
        defaultFolderName={selectedFolderId ? folders.find(f => f.id === selectedFolderId)?.name : undefined}
        onCreateTask={handleCreateTaskSubmit}
      />

    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
      <Route path="/setup" element={<SetupRoute><SetupPage /></SetupRoute>} />
      <Route element={<ProtectedRoute><AppContent /></ProtectedRoute>}>
        <Route path="/" />
        <Route path="/notes" />
        <Route path="/folder/:folderId" />
        <Route path="/note/:noteId" />
        <Route path="/tasks" />
        <Route path="/ask" />
        <Route path="/brief" />
        <Route path="/bookmarks" />
        <Route path="/settings" />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  const isDev = import.meta.env.VITE_AGENTATION === 'true';

  return (
    <AuthProvider>
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
      {isDev && <Agentation />}
    </AuthProvider>
  );
}

export default App;
