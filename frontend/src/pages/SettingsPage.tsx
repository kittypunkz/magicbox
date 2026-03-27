import { Settings, GitBranch, Calendar, Server, Info } from 'lucide-react';

// Dark mode colors (matching app theme)
const c = {
  bg: 'bg-[#191919]',
  hover: 'hover:bg-[#2a2a2a]',
  text: 'text-[#e6e6e6]',
  gray: 'text-[#6b6b6b]',
  border: 'border-[#2f2f2f]',
  input: 'bg-[#2a2a2a]',
};

// Environment detection by deployment URL
const isDev = window.location.hostname.includes('develop') || window.location.hostname.includes('dev');
const environment = isDev ? 'Development' : 'Production';
const apiUrl = import.meta.env.VITE_API_URL || '/api';

export function SettingsPage() {
  return (
    <div
      data-area-id="settingspage"
      className={`settingspage h-full overflow-y-auto ${c.bg}`}
    >
      {/* Header */}
      <div
        data-area-id="settingspage-header"
        className={`settingspage-header sticky top-0 bg-[#202020] border-b ${c.border} px-4 sm:px-8 py-4 sm:py-6 z-10`}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#2a2a2a] rounded-xl flex items-center justify-center flex-shrink-0">
            <Settings size={20} className="text-[#6b6b6b] sm:hidden" />
            <Settings size={24} className="text-[#6b6b6b] hidden sm:block" />
          </div>
          <div>
            <h1 className={`text-lg sm:text-2xl font-bold ${c.text}`}>Settings</h1>
            <p className={`text-xs sm:text-sm ${c.gray}`}>App information and configuration</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-8 py-4 sm:py-6 space-y-6">
        {/* Version Card */}
        <div className={`${c.input} border ${c.border} rounded-xl p-4 sm:p-5`}>
          <h2 className={`text-sm font-semibold ${c.text} mb-4 flex items-center gap-2`}>
            <Info size={16} />
            Application Info
          </h2>

          <div className="space-y-3">
            {/* Version */}
            <div className="flex items-center justify-between">
              <span className={`text-sm ${c.gray} flex items-center gap-2`}>
                <GitBranch size={14} />
                Version
              </span>
              <span
                data-area-id="settingspage-version"
                className={`settingspage-version text-sm font-mono ${c.text} bg-[#1a1a1a] px-3 py-1 rounded-lg`}
              >
                v{__APP_VERSION__}
              </span>
            </div>

            {/* Environment */}
            <div className="flex items-center justify-between">
              <span className={`text-sm ${c.gray} flex items-center gap-2`}>
                <Server size={14} />
                Environment
              </span>
              <span
                data-area-id="settingspage-env"
                className={`settingspage-env text-sm font-medium px-3 py-1 rounded-lg ${
                  isDev
                    ? 'bg-yellow-900/30 text-yellow-400'
                    : 'bg-green-900/30 text-green-400'
                }`}
              >
                {environment}
              </span>
            </div>

            {/* Build Date */}
            <div className="flex items-center justify-between">
              <span className={`text-sm ${c.gray} flex items-center gap-2`}>
                <Calendar size={14} />
                Build Date
              </span>
              <span
                data-area-id="settingspage-build-date"
                className={`settingspage-build-date text-sm font-mono ${c.text}`}
              >
                {new Date(__APP_BUILD_DATE__).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            {/* API Endpoint */}
            <div className="flex items-center justify-between">
              <span className={`text-sm ${c.gray} flex items-center gap-2`}>
                <Server size={14} />
                API
              </span>
              <span className={`text-xs font-mono ${c.text} truncate max-w-[200px] sm:max-w-[300px]`}>
                {apiUrl}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`text-center py-4 ${c.gray} text-xs`}>
          MagicBox — A markdown note-taking app
        </div>
      </div>
    </div>
  );
}
