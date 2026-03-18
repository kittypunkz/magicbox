import { useEffect, useState, useCallback } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';

import { CreateNoteModal } from './components/CreateNoteModal';

import { MobileNav } from './components/MobileNav';
import { FolderPage } from './pages/FolderPage';
import { NoteEditor } from './components/NoteEditor';
import { HomePage } from './pages/HomePage';
import { useNotes } from './hooks/useNotes';
import { useFolders } from './hooks/useFolders';
import type { Note, Folder } from './types';
import { useMinLoading } from './hooks/useMinLoading';
import { Search, ArrowLeft, MoreVertical } from 'lucide-react';
import './App.css';

type ViewType = 'home' | 'folder' | 'note';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { folderId, noteId } = useParams<{ folderId?: string; noteId?: string }>();

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

  const { notes, deleteNote, loading: notesLoading } = useNotes();
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
                // TODO: Create note with provided details
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
                // TODO: Create note with provided details
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
        onCreateNote={() => {
          // TODO: Implement note creation
          handleCloseModal();
        }}
        defaultFolderName={selectedFolderId ? folders.find(f => f.id === selectedFolderId)?.name : undefined}
      />


    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppContent />} />
      <Route path="/folder/:folderId" element={<AppContent />} />
      <Route path="/note/:noteId" element={<AppContent />} />
    </Routes>
  );
}

export default App;
