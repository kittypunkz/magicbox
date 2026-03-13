import { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { SearchBar } from './components/SearchBar';
import { NoteEditor } from './components/NoteEditor';
import { HomePage } from './pages/HomePage';
import { FolderPage } from './pages/FolderPage';
import { useFolders } from './hooks/useFolders';
import { useNotes } from './hooks/useNotes';
import type { Note } from './types';

type ViewType = 'home' | 'folder' | 'note';

// Dark mode colors
const colors = {
  bg: 'bg-[#191919]',
  sidebar: 'bg-[#202020]',
  hover: 'hover:bg-[#2a2a2a]',
  text: 'text-[#e6e6e6]',
  gray: 'text-[#6b6b6b]',
  border: 'border-[#2f2f2f]',
};

function App() {
  const [view, setView] = useState<ViewType>('home');
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  
  // Shared folders state for both Sidebar and HomePage
  const { 
    folders, 
    loading, 
    createFolder, 
    updateFolder, 
    deleteFolder, 
    addFolderLocally 
  } = useFolders();
  
  // For note deletion from editor
  const { deleteNote } = useNotes();

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
    setView('home');
    setSelectedFolderId(null);
    setSelectedNoteId(null);
  };

  const handleSelectFolder = (id: number | null) => {
    if (id === null) {
      handleShowAllNotes();
      return;
    }
    setSelectedFolderId(id);
    setView('folder');
    setSelectedNoteId(null);
  };

  const handleSelectNote = (note: Note) => {
    setSelectedNoteId(note.id);
    setView('note');
    if (note.folder_id) {
      setSelectedFolderId(note.folder_id);
    }
  };

  const handleSelectNoteById = (id: number) => {
    setSelectedNoteId(id);
    setView('note');
  };

  const handleBackFromEditor = () => {
    if (selectedFolderId) {
      setView('folder');
    } else {
      setView('home');
    }
    setSelectedNoteId(null);
  };

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
          {view === 'home' && (
            <HomePage 
              folders={folders}
              addFolderLocally={addFolderLocally}
              onSelectNote={handleSelectNote} 
            />
          )}
          {view === 'folder' && selectedFolderId && (
            <FolderPage folderId={selectedFolderId} onSelectNote={handleSelectNote} />
          )}
          {view === 'note' && selectedNoteId && (
            <NoteEditor
              noteId={selectedNoteId}
              onBack={handleBackFromEditor}
              onUpdate={() => {
                // Update local state if needed
              }}
              onDelete={deleteNote}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
