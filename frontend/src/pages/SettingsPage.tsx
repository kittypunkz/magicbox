import { useState, useEffect } from 'react';
import { Settings, GitBranch, Calendar, Server, Info, Key, Bot, Loader2, CheckCircle, AlertCircle, Eye, EyeOff, FlaskConical } from 'lucide-react';
import { settingsAPI } from '../api/client';
import type { OpenRouterModel } from '../types';

const isDev = import.meta.env.DEV;
const API_BASE = import.meta.env.VITE_API_URL || (isDev ? 'http://localhost:8787' : '/api');

const c = {
  bg: 'bg-[#191919]',
  text: 'text-[#e6e6e6]',
  gray: 'text-[#6b6b6b]',
  border: 'border-[#2f2f2f]',
  input: 'bg-[#2a2a2a]',
};

const isDev = window.location.hostname.includes('develop') || window.location.hostname.includes('dev');
const environment = isDev ? 'Development' : 'Production';
const apiUrl = import.meta.env.VITE_API_URL || '/api';

export function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [preferredModel, setPreferredModel] = useState('');
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    settingsAPI.getAll().then(s => {
      if (s.openrouter_api_key) setApiKey(s.openrouter_api_key);
      if (s.preferred_model) setPreferredModel(s.preferred_model);
    }).catch(() => {});
  }, []);

  const fetchModels = async () => {
    setLoadingModels(true);
    setError(null);
    try {
      const list = await settingsAPI.getModels();
      setModels(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models');
    } finally {
      setLoadingModels(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await settingsAPI.update({
        openrouter_api_key: apiKey,
        preferred_model: preferredModel,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-area-id="settingspage" className={`settingspage h-full overflow-y-auto ${c.bg}`}>
      {/* Header */}
      <div className={`sticky top-0 bg-[#202020] border-b ${c.border} px-4 sm:px-8 py-4 sm:py-6 z-10`}>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#2a2a2a] rounded-xl flex items-center justify-center flex-shrink-0">
            <Settings size={24} className="text-[#6b6b6b]" />
          </div>
          <div>
            <h1 className={`text-lg sm:text-2xl font-bold ${c.text}`}>Settings</h1>
            <p className={`text-xs sm:text-sm ${c.gray}`}>API configuration and app info</p>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 py-4 sm:py-6 space-y-6">
        {/* OpenRouter Settings */}
        <form onSubmit={handleSave} className={`${c.input} border ${c.border} rounded-xl p-4 sm:p-5 space-y-4`}>
          <h2 className={`text-sm font-semibold ${c.text} flex items-center gap-2`}>
            <Key size={16} />
            OpenRouter
          </h2>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* API Key */}
          <div>
            <label className={`block text-xs font-medium ${c.gray} mb-1.5`}>API Key</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-or-..."
                className={`w-full px-3 py-2.5 pr-10 ${c.input} bg-[#1a1a1a] border ${c.border} rounded-lg ${c.text} placeholder-[#4b4b4b] text-sm focus:outline-none focus:border-blue-500 transition-colors`}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${c.gray} hover:text-[#e6e6e6]`}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Model Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`text-xs font-medium ${c.gray}`}>
                <Bot size={12} className="inline mr-1" />Preferred Model
              </label>
              <button
                type="button"
                onClick={fetchModels}
                disabled={loadingModels || !apiKey}
                className={`text-xs ${c.gray} hover:text-blue-400 disabled:opacity-40 transition-colors flex items-center gap-1`}
              >
                {loadingModels ? <Loader2 size={12} className="animate-spin" /> : null}
                {loadingModels ? 'Loading...' : 'Load models'}
              </button>
            </div>
            {models.length > 0 ? (
              <select
                value={preferredModel}
                onChange={e => setPreferredModel(e.target.value)}
                className={`w-full px-3 py-2.5 ${c.input} bg-[#1a1a1a] border ${c.border} rounded-lg ${c.text} text-sm focus:outline-none focus:border-blue-500 transition-colors`}
              >
                <option value="">— select a model —</option>
                {models.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={preferredModel}
                onChange={e => setPreferredModel(e.target.value)}
                placeholder="e.g. openai/gpt-4o-mini"
                className={`w-full px-3 py-2.5 ${c.input} bg-[#1a1a1a] border ${c.border} rounded-lg ${c.text} placeholder-[#4b4b4b] text-sm focus:outline-none focus:border-blue-500 transition-colors`}
              />
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {saving ? (
              <><Loader2 size={14} className="animate-spin" /> Saving...</>
            ) : saved ? (
              <><CheckCircle size={14} /> Saved</>
            ) : (
              'Save'
            )}
          </button>
        </form>

        {/* App Info */}
        <div className={`${c.input} border ${c.border} rounded-xl p-4 sm:p-5`}>
          <h2 className={`text-sm font-semibold ${c.text} mb-4 flex items-center gap-2`}>
            <Info size={16} />
            Application Info
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={`text-sm ${c.gray} flex items-center gap-2`}><GitBranch size={14} />Version</span>
              <span className={`text-sm font-mono ${c.text} bg-[#1a1a1a] px-3 py-1 rounded-lg`}>v{__APP_VERSION__}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${c.gray} flex items-center gap-2`}><Server size={14} />Environment</span>
              <span className={`text-sm font-medium px-3 py-1 rounded-lg ${isDev ? 'bg-yellow-900/30 text-yellow-400' : 'bg-green-900/30 text-green-400'}`}>
                {environment}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${c.gray} flex items-center gap-2`}><Calendar size={14} />Build Date</span>
              <span className={`text-sm font-mono ${c.text}`}>
                {new Date(__APP_BUILD_DATE__).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${c.gray} flex items-center gap-2`}><Server size={14} />API</span>
              <span className={`text-xs font-mono ${c.text} truncate max-w-[200px] sm:max-w-[300px]`}>{apiUrl}</span>
            </div>
          </div>
        </div>

        {/* Debug Panel */}
        <DebugPanel />

        <div className={`text-center py-4 ${c.gray} text-xs`}>
          MagicBox — A markdown note-taking app
        </div>
      </div>
    </div>
  );
}

function DebugPanel() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; log: string[]; reply?: string; error?: string } | null>(null);

  const run = async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/settings/debug`, { credentials: 'include' });
      const data = await res.json() as { ok: boolean; log: string[]; reply?: string; error?: string };
      setResult(data);
    } catch (err) {
      setResult({ ok: false, log: [], error: err instanceof Error ? err.message : 'Fetch failed' });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className={`bg-[#2a2a2a] border border-[#2f2f2f] rounded-xl p-4 sm:p-5`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className={`text-sm font-semibold text-[#e6e6e6] flex items-center gap-2`}>
          <FlaskConical size={16} />
          Connection Test
        </h2>
        <button
          onClick={run}
          disabled={running}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
        >
          {running ? <Loader2 size={12} className="animate-spin" /> : <FlaskConical size={12} />}
          {running ? 'Testing...' : 'Run Test'}
        </button>
      </div>

      {result && (
        <div className="space-y-2">
          <div className={`flex items-center gap-2 text-sm font-medium ${result.ok ? 'text-green-400' : 'text-red-400'}`}>
            {result.ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {result.ok ? `OpenRouter OK — replied: "${result.reply}"` : `Failed: ${result.error}`}
          </div>
          <pre className="text-xs text-[#6b6b6b] bg-[#191919] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {result.log.join('\n')}
          </pre>
        </div>
      )}
    </div>
  );
}
