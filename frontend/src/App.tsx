import { useState, useCallback, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { SearchBar } from './components/SearchBar';
import { BlockEditor } from './components/BlockEditor';
import { HomePage } from './pages/HomePage';
import { FolderPage } from './pages/FolderPage';
import { useFolders } from './hooks/useFolders';
import { useNotes } from './hooks/useNotes';
import { Toast, type ToastType } from './components/Toast';
import type { Note } from './types';

// Agentation - Visual annotation tool for AI agents (dev only)
import { Agentation } from 'agentation';

// Dark mode colors
const colors = {
  bg: 'bg-[#191919]',
  sidebar: 'bg-[#202020]',
  hover: 'hover:bg-[#2a2a2a]',
  text: 'text-[#e6e6e6]',
  gray: 'text-[#6b6b6b]',
  border: 'border-[#2f2f2f]',
};

// Main App Content with Router
function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [view, setView] = useState<'home' | 'folder' | 'note'>('home');
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [, setSelectedNoteId] = useState<number | null>(null);
  
  // Toast state
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  }, []);

  // Shared folders state for both Sidebar and HomePage
  const { 
    folders, 
    loading, 
    createFolder, 
    updateFolder, 
    deleteFolder
  } = useFolders();
  
  // For note creation and deletion
  const { createNote, deleteNote } = useNotes();

  // Handle URL changes - sync URL with state
  useEffect(() => {
    const path = location.pathname;
    
    if (path.startsWith('/note/')) {
      const id = parseInt(path.split('/')[2]);
      if (!isNaN(id)) {
        setSelectedNoteId(id);
        setView('note');
      }
    } else if (path.startsWith('/folder/')) {
      const id = parseInt(path.split('/')[2]);
      if (!isNaN(id)) {
        setSelectedFolderId(id);
        setView('folder');
      }
    } else if (path === '/') {
      setView('home');
      setSelectedFolderId(null);
      setSelectedNoteId(null);
    }
  }, [location.pathname]);

  // Wrapper functions that also handle UI updates
  const handleCreateFolder = useCallback(async (name: string) => {
    const newFolder = await createFolder(name);
    return newFolder;
  }, [createFolder]);

  const handleUpdateFolder = useCallback(async (id: number, name: string) => {
    await updateFolder(id, name);
  }, [updateFolder]);

  const handleDeleteFolder = useCallback(async (id: number) => {
    await deleteFolder(id);
  }, [deleteFolder]);

  const handleShowAllNotes = () => {
    navigate('/');
    setView('home');
    setSelectedFolderId(null);
    setSelectedNoteId(null);
  };

  const handleSelectFolder = (id: number | null) => {
    if (id === null) {
      handleShowAllNotes();
      return;
    }
    navigate(`/folder/${id}`);
    setSelectedFolderId(id);
    setView('folder');
    setSelectedNoteId(null);
  };

  const handleSelectNote = (note: Note) => {
    navigate(`/note/${note.id}`);
    setView('note');
    if (note.folder_id) {
      setSelectedFolderId(note.folder_id);
    }
  };

  const handleSelectNoteById = (id: number) => {
    navigate(`/note/${id}`);
    setView('note');
  };

  const handleBackFromEditor = () => {
    if (selectedFolderId) {
      navigate(`/folder/${selectedFolderId}`);
      setView('folder');
    } else {
      navigate('/');
      setView('home');
    }
  };

  const handleCreateNote = useCallback(async (title: string, content: string, folderId: number) => {
    const note = await createNote({ title, content, folder_id: folderId });
    // Navigate to the newly created note
    handleSelectNote(note);
    showToast('Note created successfully');
  }, [createNote, showToast]);

  return (
    <div 
      data-area-id="app-root"
      className={`app-container flex h-screen ${colors.bg}`}
    >
      <Sidebar
        folders={folders}
        loading={loading}
        selectedFolderId={selectedFolderId}
        onSelectFolder={handleSelectFolder}
        onShowAllNotes={handleShowAllNotes}
        onSelectNote={handleSelectNote}
        onCreateFolder={handleCreateFolder}
        onUpdateFolder={handleUpdateFolder}
        onDeleteFolder={handleDeleteFolder}
        onCreateNote={handleCreateNote}
      />

      <div 
        data-area-id="main-layout"
        className="main-layout flex-1 flex flex-col min-w-0"
      >
        {/* Top Bar */}
        <header 
          data-area-id="top-bar"
          className={`top-bar flex items-center justify-between px-6 py-3 border-b ${colors.border} bg-[#202020]`}
        >
          <div className="flex items-center gap-2">
            <h2 className={`text-lg font-semibold ${colors.text}`}>
              {view === 'home' && 'Home'}
              {view === 'folder' && 'Folder'}
              {view === 'note' && 'Note'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <SearchBar
              onSelectNote={handleSelectNoteById}
              onSelectFolder={handleSelectFolder}
            />
          </div>
        </header>

        {/* Main Content */}
        <main 
          data-area-id="main-content"
          className="main-content flex-1 overflow-hidden"
        >
          <Routes>
            <Route path="/" element={
              <HomePage 
                folders={folders}
                onSelectNote={handleSelectNote}
                onCreateNote={handleCreateNote}
              />
            } />
            <Route path="/folder/:folderId" element={
              <FolderPageWrapper 
                folders={folders}
                onSelectNote={handleSelectNote}
                onCreateNote={handleCreateNote}
              />
            } />
            <Route path="/note/:noteId" element={
              <BlockEditorWrapper 
                onBack={handleBackFromEditor}
                onDelete={deleteNote}
              />
            } />
          </Routes>
        </main>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Agentation - Visual annotation tool (dev only) */}
      {import.meta.env.DEV && <Agentation />}
    </div>
  );
}

// Wrapper components to handle URL params
function FolderPageWrapper({ 
  folders, 
  onSelectNote, 
  onCreateNote 
}: { 
  folders: any[]; 
  onSelectNote: (note: Note) => void; 
  onCreateNote: (title: string, content: string, folderId: number) => void;
}) {
  const { folderId } = useParams();
  const id = parseInt(folderId || '0');
  
  if (!id) return null;
  
  return (
    <FolderPage 
      folderId={id}
      folders={folders}
      onSelectNote={onSelectNote}
      onCreateNote={onCreateNote}
    />
  );
}

function BlockEditorWrapper({ 
  onBack, 
  onDelete 
}: { 
  onBack: () => void; 
  onDelete: (id: number) => void;
}) {
  const { noteId } = useParams();
  const id = parseInt(noteId || '0');
  
  if (!id) return null;
  
  return (
    <BlockEditor
      noteId={id}
      onBack={onBack}
      onUpdate={() => {
        // Update local state if needed
      }}
      onDelete={onDelete}
    />
  );
}

function App() {
  return <AppContent />;
}

export default App;
