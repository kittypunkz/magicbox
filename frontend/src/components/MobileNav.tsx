import { useState } from 'react';
import { Menu, X, Home, Plus } from 'lucide-react';

interface MobileNavProps {
  onShowAllNotes: () => void;
  onCreateNote: () => void;
  currentView: 'home' | 'folder' | 'note' | 'settings';
}

const c = {
  bg: 'bg-[#202020]',
  text: 'text-[#e6e6e6]',
  gray: 'text-[#6b6b6b]',
  border: 'border-[#2f2f2f]',
  primary: 'text-blue-500',
};

export function MobileNav({ onShowAllNotes, onCreateNote, currentView }: MobileNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleShowAllNotes = () => {
    onShowAllNotes();
    setIsMenuOpen(false);
  };

  const handleCreateNote = () => {
    onCreateNote();
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className={`lg:hidden fixed bottom-0 left-0 right-0 ${c.bg} border-t ${c.border} z-50`}>
        <div className="flex items-center justify-around px-4 py-2">
          <button
            onClick={handleShowAllNotes}
            className={`flex flex-col items-center gap-1 p-2 ${currentView === 'home' ? c.primary : c.gray}`}
          >
            <Home size={20} />
            <span className="text-xs">Home</span>
          </button>
          
          <button
            onClick={handleCreateNote}
            className="flex flex-col items-center gap-1 p-2"
          >
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <Plus size={24} className="text-white" />
            </div>
          </button>
          
          <button
            onClick={() => setIsMenuOpen(true)}
            className={`flex flex-col items-center gap-1 p-2 ${c.gray}`}
          >
            <Menu size={20} />
            <span className="text-xs">Menu</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className={`absolute bottom-0 left-0 right-0 ${c.bg} rounded-t-2xl p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${c.text}`}>Menu</h3>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className={`p-2 ${c.gray}`}
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-2">
              <button
                onClick={handleShowAllNotes}
                className={`w-full flex items-center gap-3 p-3 rounded-lg ${currentView === 'home' ? 'bg-blue-500/20 text-blue-400' : c.gray}`}
              >
                <Home size={20} />
                <span>All Notes</span>
              </button>
              <div className={`border-t ${c.border} my-2`} />
              <p className={`text-xs ${c.gray} px-3`}>Use the sidebar on desktop for folders</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
