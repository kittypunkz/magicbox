import { Github, GitCommit } from 'lucide-react';

// Version info - updated manually or via CI/CD
const APP_VERSION = 'v1.0.0';
const GIT_COMMIT = import.meta.env.VITE_GIT_COMMIT?.slice(0, 7) || 'dev';

export function Footer() {
  return (
    <footer className="px-4 py-3 border-t border-notion-border dark:border-notion-dark-border bg-notion-sidebar dark:bg-notion-dark-sidebar">
      <div className="flex items-center justify-between text-xs text-notion-gray dark:text-notion-dark-gray">
        <div className="flex items-center gap-3">
          <span className="font-medium">MagicBox</span>
          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
            {APP_VERSION}
          </span>
          {GIT_COMMIT !== 'dev' && (
            <span className="flex items-center gap-1 font-mono opacity-70">
              <GitCommit size={12} />
              {GIT_COMMIT}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <a 
            href="https://github.com/kittypunkz/magicbox" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-blue-500 transition-colors"
          >
            <Github size={14} />
            <span>GitHub</span>
          </a>
          <span>•</span>
          <span>{new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}
