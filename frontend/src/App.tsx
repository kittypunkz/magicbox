import { useEffect, useState, useCallback } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { CreateNoteModal } from './components/CreateNoteModal';
import { MobileNav } from './components/MobileNav';
import { FolderPage } from './pages/FolderPage';
import { NoteEditor } from './components/NoteEditor';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { SetupPage } from './pages/SetupPage';
import { useNotes } from './hooks/useNotes';
import { useFolders } from './hooks/useFolders';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import type { Note, Folder } from './types';
import { useMinLoading } from './hooks/useMinLoading';
import { Search, ArrowLeft, MoreVertical, LogOut, Shield, Plus } from 'lucide-react';
import './App.css';
import { Agentation } from 'agentation';

type ViewType = 'home' | 'folder' | 'note';

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#191919] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
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
      <div className="min-h-screen bg-[#191919] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
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
      <div className="min-h-screen bg-[#191919] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return <>{children}</>;
}

function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { credentials, addDevice, removeCredential, refreshCredentials, logout } = useAuth();
  const [isAddingDevice, setIsAddingDevice] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      refreshCredentials();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddDevice = async () => {
    setIsAddingDevice(true);
    setError(null);
    try {
      await addDevice();
      await refreshCredentials();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add device');
    } finally {
      setIsAddingDevice(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Are you sure you want to remove this device?')) return;
    try {
      await removeCredential(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove device');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#202020] border border-[#2f2f2f] rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[#2f2f2f]">
          <h2 className="text-lg font-semibold text-[#e6e6e6]">Settings</h2>
          <button
            onClick={onClose}
            className="text-[#6b6b6b] hover:text-[#e6e6e6] transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div className="mb-6">
            <h3 className="text-sm font-medium text-[#6b6b6b] mb-3 uppercase tracking-wider">
              Passkeys ({credentials.length})
            </h3>
            
            {credentials.map((cred) => (
              <div
                key={cred.id}
                className="flex items-center justify-between p-3 bg-[#191919] rounded-lg mb-2"
              >
                <div>
                  <p className="text-sm text-[#e6e6e6] font-mono">
                    {cred.id.slice(0, 16)}...
                  </p>
                  <p className="text-xs text-[#6b6b6b]">
                    Added: {new Date(cred.created_at).toLocaleDateString()}
                    {cred.last_used_at && ` • Last used: ${new Date(cred.last_used_at).toLocaleDateString()}`}
                  </p>
                </div>
                {credentials.length > 1 && (
                  <button
                    onClick={() => handleRemove(cred.id)}
                    className="text-red-400 hover:text-red-300 text-sm px-2 py-1"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}

            <button
              onClick={handleAddDevice}
              disabled={isAddingDevice}
              className="w-full flex items-center justify-center gap-2 p-3 border border-dashed border-[#2f2f2f] rounded-lg text-[#6b6b6b] hover:text-[#e6e6e6] hover:border-[#6b6b6b] transition-colors"
            >
              {isAddingDevice ? (
                <span>Adding...</span>
              ) : (
                <>
                  <Plus size={16} />
                  <span>Add New Device</span>
                </>
              )}
            </button>

            {error && (
              <p className="text-sm text-red-400 mt-2">{error}</p>
            )}
          </div>

          <div className="border-t border-[#2f2f2f] pt-4">
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 p-3 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { folderId, noteId } = useParams<{ folderId?: string; noteId?: string }>();
  // Logout is available via useAuth in SettingsModal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // View state
  const [view, setView] = useState<ViewType>('home');
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | undefined>(undefined);

  // UI state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
    } else if (location.pathname === '/') {
      setView('home');
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

  const updateURL = useCallback((view: ViewType, folderId?: number | null, noteId?: number | null) => {
    if (view === 'note' && noteId) {
      navigate(`/note/${noteId}`, { replace: true });
    } else if (view === 'folder' && folderId) {
      navigate(`/folder/${folderId}`, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  // Navigation handlers
  const showAllNotes = useCallback(() => {
    setView('home');
    setSelectedFolderId(null);
    setSelectedNoteId(null);
    updateURL('home');
  }, [updateURL]);

  const showFolder = useCallback((folderId: number) => {
    setView('folder');
    setSelectedFolderId(folderId);
    setSelectedNoteId(null);
    updateURL('folder', folderId);
  }, [updateURL]);

  const showNote = useCallback((noteId: number) => {
    setView('note');
    setSelectedNoteId(noteId);
    updateURL('note', selectedFolderId, noteId);
  }, [selectedFolderId, updateURL]);

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

  const handleCloseModal = useCallback(() => {
    setIsCreateModalOpen(false);
  }, []);

  const handleBack = useCallback(() => {
    if (selectedFolderId) {
      showFolder(selectedFolderId);
    } else {
      showAllNotes();
    }
  }, [selectedFolderId, showFolder, showAllNotes]);

  const getFolderName = useCallback((folderId: number | null) => {
    if (!folderId) return 'All Notes';
    const folder = folders.find(f => f.id === folderId);
    return folder?.name ?? 'Unknown Folder';
  }, [folders]);

  const SearchBar = () => (
    <div className="relative">
      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b6b]" />
      <input
        type="text"
        placeholder="Search notes..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full lg:w-64 bg-[#202020] text-[#e6e6e6] text-sm rounded-lg pl-10 pr-4 py-2.5 border border-[#2f2f2f] placeholder-[#6b6b6b] focus:outline-none focus:border-blue-500"
      />
    </div>
  );

  return (
    <div className="flex h-screen bg-[#191919] overflow-hidden">
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
          ${isMobile ? 'fixed inset-y-0 left-0 z-50 transform transition-transform duration-300' : 'relative'}
          ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
          w-[280px] flex-shrink-0
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
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 lg:px-6 py-3 border-b border-[#2f2f2f] bg-[#202020]/50 backdrop-blur-sm sticky top-0 z-30">
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-[#6b6b6b] hover:text-[#e6e6e6] active:scale-95 transition-all"
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
              className="p-2 -ml-2 text-[#6b6b6b] hover:text-[#e6e6e6] active:scale-95 transition-all lg:hidden"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          
          <h1 className="text-lg font-semibold text-[#e6e6e6] truncate">
            {view === 'home' && 'All Notes'}
            {view === 'folder' && getFolderName(selectedFolderId)}
            {view === 'note' && (selectedNote?.title || 'Untitled')}
          </h1>
          
          <div className="flex-1" />
          
          <SearchBar />

          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-[#6b6b6b] hover:text-[#e6e6e6] active:scale-95 transition-all"
            aria-label="Settings"
          >
            <Shield size={20} />
          </button>
          
          {view === 'note' && selectedNote && (
            <div className="relative">
              <button
                onClick={() => setNoteDropdownOpen(noteDropdownOpen === selectedNote.id ? null : selectedNote.id)}
                className="p-2 text-[#6b6b6b] hover:text-[#e6e6e6] active:scale-95 transition-all"
              >
                <MoreVertical size={20} />
              </button>
              {noteDropdownOpen === selectedNote.id && (
                <div className="absolute right-0 mt-1 w-48 bg-[#202020] border border-[#2f2f2f] rounded-lg shadow-lg py-1 z-50">
                  <button
                    onClick={() => {
                      handleNoteDeleted(selectedNote.id);
                      setNoteDropdownOpen(null);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-[#2f2f2f]"
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
          {view === 'home' && (
            <HomePage
              folders={folders}
              onSelectNote={handleNoteClick}
              onCreateNote={() => {
                setIsCreateModalOpen(true);
              }}
            />
          )}
          
          {view === 'folder' && selectedFolderId && (
            <FolderPage
              folderId={selectedFolderId}
              folders={folders}
              onSelectNote={handleNoteClick}
              onCreateNote={() => {
                setIsCreateModalOpen(true);
              }}
            />
          )}
          
          {view === 'note' && selectedNoteId && (
            <NoteEditor
              noteId={selectedNoteId}
              onBack={handleBack}
              onUpdate={() => {
                // Note will be updated via the hook
              }}
              onDelete={(id) => {
                deleteNote(id);
                showAllNotes();
              }}
            />
          )}
        </main>

        {/* Mobile Navigation */}
        <MobileNav
          onShowAllNotes={showAllNotes}
          onCreateNote={handleCreateNote}
          currentView={view}
        />
      </div>

      {/* Modals */}
      <CreateNoteModal
        isOpen={isCreateModalOpen}
        folders={folders}
        onClose={handleCloseModal}
        onCreateNote={async (title, content, folderName) => {
          // Find or create folder
          let folder = folders.find(f => f.name === folderName);
          if (!folder && folderName) {
            folder = await createFolder(folderName);
          }
          const folderId = folder?.id || 1;
          
          // Create note
          const newNote = await createNote({ title, content, folder_id: folderId });
          await refetchNotes();
          handleCloseModal();
          
          // Redirect to the new note
          if (newNote?.id) {
            showNote(newNote.id);
          }
        }}
        defaultFolderName={selectedFolderId ? folders.find(f => f.id === selectedFolderId)?.name : undefined}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={
        <AuthRoute>
          <LoginPage />
        </AuthRoute>
      } />
      <Route path="/setup" element={
        <SetupRoute>
          <SetupPage />
        </SetupRoute>
      } />
      <Route path="/" element={
        <ProtectedRoute>
          <AppContent />
        </ProtectedRoute>
      } />
      <Route path="/folder/:folderId" element={
        <ProtectedRoute>
          <AppContent />
        </ProtectedRoute>
      } />
      <Route path="/note/:noteId" element={
        <ProtectedRoute>
          <AppContent />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  const isDev = import.meta.env.DEV;
  
  return (
    <AuthProvider>
      <AppRoutes />
      {isDev && <Agentation />}
    </AuthProvider>
  );
}

export default App;
