import { useState } from 'react';
import { Menu, X, Home, Plus, CheckSquare, Sparkles, FileText, Bookmark, Settings } from 'lucide-react';

interface MobileNavProps {
  onShowToday: () => void;
  onShowAllNotes: () => void;
  onCreateNote: () => void;
  onTasksClick: () => void;
  onAskClick: () => void;
  onBookmarksClick: () => void;
  onSettingsClick: () => void;
  currentView: 'today' | 'notes' | 'folder' | 'note' | 'settings' | 'tasks' | 'ask' | 'bookmarks';
}

const c = {
  bg: 'bg-[#1a1a1a]',
  text: 'text-[#e6e6e6]',
  gray: 'text-[#888888]',
  border: 'border-[#2a2a2a]',
  primary: 'text-[#faff69]',
  activeBg: 'bg-[#faff69]/10',
};

export function MobileNav({
  onShowToday,
  onShowAllNotes,
  onCreateNote,
  onTasksClick,
  onAskClick,
  onBookmarksClick,
  onSettingsClick,
  currentView,
}: MobileNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const nav = (fn: () => void) => () => { fn(); setIsMenuOpen(false); };

  const isActive = (view: string) => currentView === view;

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className={`lg:hidden fixed bottom-0 left-0 right-0 ${c.bg} border-t ${c.border} z-50`}>
        <div className="flex items-center justify-around px-2 py-2">
          <button
            onClick={nav(onShowToday)}
            className={`flex flex-col items-center gap-0.5 p-2 ${isActive('today') ? c.primary : c.gray}`}
          >
            <Home size={20} />
            <span className="text-xs">Today</span>
          </button>

          <button
            onClick={nav(onTasksClick)}
            className={`flex flex-col items-center gap-0.5 p-2 ${isActive('tasks') ? c.primary : c.gray}`}
          >
            <CheckSquare size={20} />
            <span className="text-xs">Tasks</span>
          </button>

          <button
            onClick={nav(onCreateNote)}
            className="flex flex-col items-center gap-0.5 p-2"
          >
            <div className="w-10 h-10 bg-[#faff69] rounded-full flex items-center justify-center">
              <Plus size={24} className="text-[#0a0a0a]" />
            </div>
          </button>

          <button
            onClick={nav(onShowAllNotes)}
            className={`flex flex-col items-center gap-0.5 p-2 ${isActive('notes') || isActive('folder') || isActive('note') ? c.primary : c.gray}`}
          >
            <FileText size={20} />
            <span className="text-xs">Notes</span>
          </button>

          <button
            onClick={nav(onAskClick)}
            className={`flex flex-col items-center gap-0.5 p-2 ${isActive('ask') ? c.primary : c.gray}`}
          >
            <Sparkles size={20} />
            <span className="text-xs">Ask</span>
          </button>

          <button
            onClick={() => setIsMenuOpen(true)}
            className={`flex flex-col items-center gap-0.5 p-2 ${isActive('bookmarks') || isActive('settings') ? c.primary : c.gray}`}
          >
            <Menu size={20} />
            <span className="text-xs">More</span>
          </button>
        </div>
      </div>

      {/* Mobile More Drawer */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className={`absolute bottom-0 left-0 right-0 ${c.bg} rounded-t-2xl p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${c.text}`}>More</h3>
              <button
                onClick={() => setIsMenuOpen(false)}
                className={`p-2 ${c.gray}`}
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-1">
              <button
                onClick={nav(onShowAllNotes)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg ${isActive('notes') || isActive('folder') || isActive('note') ? `${c.activeBg} text-[#faff69]` : c.gray}`}
              >
                <FileText size={20} />
                <span>Notes</span>
              </button>
              <button
                onClick={nav(onBookmarksClick)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg ${isActive('bookmarks') ? `${c.activeBg} text-[#faff69]` : c.gray}`}
              >
                <Bookmark size={20} />
                <span>Bookmarks</span>
              </button>
              <button
                onClick={nav(onSettingsClick)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg ${isActive('settings') ? `${c.activeBg} text-[#faff69]` : c.gray}`}
              >
                <Settings size={20} />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
