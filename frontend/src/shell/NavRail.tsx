import { Bookmark, CheckSquare, FileText, MessageSquare, Settings, Sparkles } from 'lucide-react';
import type React from 'react';
import type { Section } from './types';

interface NavRailProps {
  section: Section;
  onNavigate: (section: Section) => void;
}

const items: { section: Section; label: string; icon: React.ElementType }[] = [
  { section: 'notes', label: 'Notes', icon: FileText },
  { section: 'tasks', label: 'Tasks', icon: CheckSquare },
  { section: 'ask', label: 'Ask', icon: MessageSquare },
  { section: 'brief', label: 'Brief', icon: Sparkles },
  { section: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
];

export function NavRail({ section, onNavigate }: NavRailProps) {
  return (
    <nav className="hidden lg:flex w-12 shrink-0 flex-col items-center border-r border-mb-border bg-mb-surface py-3">
      <div className="flex flex-col items-center gap-2">
        {items.map(({ section: itemSection, label, icon: Icon }) => {
          const active = section === itemSection;
          return (
            <button
              key={itemSection}
              type="button"
              onClick={() => onNavigate(itemSection)}
              title={label}
              aria-label={label}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                active
                  ? 'bg-mb-accent text-white'
                  : 'text-mb-muted hover:bg-mb-hover hover:text-mb-primary'
              }`}
            >
              <Icon size={17} />
            </button>
          );
        })}
      </div>
      <div className="flex-1" />
      <button
        type="button"
        onClick={() => onNavigate('settings')}
        title="Settings"
        aria-label="Settings"
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
          section === 'settings'
            ? 'bg-mb-accent text-white'
            : 'text-mb-muted hover:bg-mb-hover hover:text-mb-primary'
        }`}
      >
        <Settings size={17} />
      </button>
    </nav>
  );
}
