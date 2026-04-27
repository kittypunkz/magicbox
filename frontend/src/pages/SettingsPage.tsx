import { useState, useEffect } from 'react';
import { Settings, GitBranch, Calendar, Server, Info, Key, Bot, Loader2, CheckCircle, AlertCircle, Eye, EyeOff, FlaskConical, Globe, Clock, Cpu, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { settingsAPI } from '../api/client';
import type { OpenRouterModel } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || (window.location.hostname.includes('localhost') ? 'http://localhost:8787' : '/api');

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
  // OpenRouter
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [preferredModel, setPreferredModel] = useState('');
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  // AI Behavior
  const [briefTemperature, setBriefTemperature] = useState(0.7);
  const [taskTemperature, setTaskTemperature] = useState(0.2);

  // Daily Brief Scope
  const [briefTimeWindow, setBriefTimeWindow] = useState(24);
  const [briefMaxNotes, setBriefMaxNotes] = useState(20);
  const [briefMaxTasks, setBriefMaxTasks] = useState(20);

  // App Preferences
  const [timezone, setTimezone] = useState('Asia/Bangkok');
  const [autosaveDelay, setAutosaveDelay] = useState('2000');

  // System Prompts
  const [promptChat, setPromptChat] = useState('');
  const [promptBrief, setPromptBrief] = useState('');
  const [promptTaskExtract, setPromptTaskExtract] = useState('');
  const [showPrompts, setShowPrompts] = useState(false);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    settingsAPI.getAll().then(s => {
      if (s.openrouter_api_key) setApiKey(s.openrouter_api_key);
      if (s.preferred_model) setPreferredModel(s.preferred_model);
      if (s.brief_temperature) setBriefTemperature(parseFloat(s.brief_temperature));
      if (s.task_temperature) setTaskTemperature(parseFloat(s.task_temperature));
      if (s.brief_time_window_hours) setBriefTimeWindow(parseInt(s.brief_time_window_hours, 10));
      if (s.brief_max_notes) setBriefMaxNotes(parseInt(s.brief_max_notes, 10));
      if (s.brief_max_tasks) setBriefMaxTasks(parseInt(s.brief_max_tasks, 10));
      if (s.timezone) setTimezone(s.timezone);
      if (s.autosave_delay_ms) setAutosaveDelay(s.autosave_delay_ms);
      if (s.prompt_chat) setPromptChat(s.prompt_chat);
      if (s.prompt_brief) setPromptBrief(s.prompt_brief);
      if (s.prompt_task_extract) setPromptTaskExtract(s.prompt_task_extract);
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
        brief_temperature: String(briefTemperature),
        task_temperature: String(taskTemperature),
        brief_time_window_hours: String(briefTimeWindow),
        brief_max_notes: String(briefMaxNotes),
        brief_max_tasks: String(briefMaxTasks),
        timezone,
        autosave_delay_ms: autosaveDelay,
        prompt_chat: promptChat,
        prompt_brief: promptBrief,
        prompt_task_extract: promptTaskExtract,
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

        {/* AI Behavior */}
        <form onSubmit={handleSave} className={`${c.input} border ${c.border} rounded-xl p-4 sm:p-5 space-y-4`}>
          <h2 className={`text-sm font-semibold ${c.text} flex items-center gap-2`}>
            <Cpu size={16} />
            AI Behavior
          </h2>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`text-xs font-medium ${c.gray}`}>Brief Tone</label>
              <span className={`text-xs font-mono ${c.text}`}>{briefTemperature.toFixed(1)}</span>
            </div>
            <input
              type="range" min="0" max="1" step="0.1"
              value={briefTemperature}
              onChange={e => setBriefTemperature(parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className={`flex justify-between text-xs ${c.gray} mt-0.5`}>
              <span>Precise</span><span>Creative</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`text-xs font-medium ${c.gray}`}>Task Extraction</label>
              <span className={`text-xs font-mono ${c.text}`}>{taskTemperature.toFixed(1)}</span>
            </div>
            <input
              type="range" min="0" max="0.5" step="0.1"
              value={taskTemperature}
              onChange={e => setTaskTemperature(parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className={`flex justify-between text-xs ${c.gray} mt-0.5`}>
              <span>Strict</span><span>Flexible</span>
            </div>
          </div>

          <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : saved ? <><CheckCircle size={14} /> Saved</> : 'Save'}
          </button>
        </form>

        {/* Daily Brief Scope */}
        <form onSubmit={handleSave} className={`${c.input} border ${c.border} rounded-xl p-4 sm:p-5 space-y-4`}>
          <h2 className={`text-sm font-semibold ${c.text} flex items-center gap-2`}>
            <Calendar size={16} />
            Daily Brief Scope
          </h2>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={`block text-xs font-medium ${c.gray} mb-1.5`}>Time Window (hrs)</label>
              <input
                type="number" min="1" max="168"
                value={briefTimeWindow}
                onChange={e => setBriefTimeWindow(parseInt(e.target.value, 10))}
                className={`w-full px-3 py-2.5 ${c.input} bg-[#1a1a1a] border ${c.border} rounded-lg ${c.text} text-sm focus:outline-none focus:border-blue-500 transition-colors`}
              />
            </div>
            <div>
              <label className={`block text-xs font-medium ${c.gray} mb-1.5`}>Max Notes</label>
              <input
                type="number" min="5" max="50"
                value={briefMaxNotes}
                onChange={e => setBriefMaxNotes(parseInt(e.target.value, 10))}
                className={`w-full px-3 py-2.5 ${c.input} bg-[#1a1a1a] border ${c.border} rounded-lg ${c.text} text-sm focus:outline-none focus:border-blue-500 transition-colors`}
              />
            </div>
            <div>
              <label className={`block text-xs font-medium ${c.gray} mb-1.5`}>Max Tasks</label>
              <input
                type="number" min="5" max="50"
                value={briefMaxTasks}
                onChange={e => setBriefMaxTasks(parseInt(e.target.value, 10))}
                className={`w-full px-3 py-2.5 ${c.input} bg-[#1a1a1a] border ${c.border} rounded-lg ${c.text} text-sm focus:outline-none focus:border-blue-500 transition-colors`}
              />
            </div>
          </div>

          <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : saved ? <><CheckCircle size={14} /> Saved</> : 'Save'}
          </button>
        </form>

        {/* App Preferences */}
        <form onSubmit={handleSave} className={`${c.input} border ${c.border} rounded-xl p-4 sm:p-5 space-y-4`}>
          <h2 className={`text-sm font-semibold ${c.text} flex items-center gap-2`}>
            <Globe size={16} />
            App Preferences
          </h2>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`text-xs font-medium ${c.gray} flex items-center gap-1`}><Globe size={12} />Timezone</label>
              <button
                type="button"
                onClick={() => setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)}
                className={`text-xs ${c.gray} hover:text-blue-400 transition-colors`}
              >
                Use browser timezone
              </button>
            </div>
            <input
              type="text"
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              placeholder="e.g. Asia/Bangkok"
              className={`w-full px-3 py-2.5 ${c.input} bg-[#1a1a1a] border ${c.border} rounded-lg ${c.text} placeholder-[#4b4b4b] text-sm focus:outline-none focus:border-blue-500 transition-colors`}
            />
          </div>

          <div>
            <label className={`block text-xs font-medium ${c.gray} mb-1.5 flex items-center gap-1`}><Clock size={12} />Auto-save Delay</label>
            <select
              value={autosaveDelay}
              onChange={e => setAutosaveDelay(e.target.value)}
              className={`w-full px-3 py-2.5 ${c.input} bg-[#1a1a1a] border ${c.border} rounded-lg ${c.text} text-sm focus:outline-none focus:border-blue-500 transition-colors`}
            >
              <option value="500">500 ms</option>
              <option value="1000">1 s</option>
              <option value="2000">2 s (default)</option>
              <option value="5000">5 s</option>
            </select>
          </div>

          <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : saved ? <><CheckCircle size={14} /> Saved</> : 'Save'}
          </button>
        </form>

        {/* System Prompts (Advanced) */}
        <div className={`${c.input} border ${c.border} rounded-xl overflow-hidden`}>
          <button
            type="button"
            onClick={() => setShowPrompts(v => !v)}
            className={`w-full flex items-center justify-between p-4 sm:p-5 ${c.text} hover:bg-[#222] transition-colors`}
          >
            <span className="text-sm font-semibold flex items-center gap-2">
              <FileText size={16} />
              System Prompts
              <span className={`text-xs font-normal ${c.gray} ml-1`}>Advanced</span>
            </span>
            {showPrompts ? <ChevronUp size={16} className={c.gray} /> : <ChevronDown size={16} className={c.gray} />}
          </button>

          {showPrompts && (
            <form onSubmit={handleSave} className="px-4 sm:px-5 pb-5 space-y-4 border-t border-[#2f2f2f]">
              <p className={`text-xs ${c.gray} pt-3`}>
                Override AI prompts. Use <code className="bg-[#1a1a1a] px-1 rounded text-xs">{'{{notes}}'}</code>, <code className="bg-[#1a1a1a] px-1 rounded text-xs">{'{{date}}'}</code>, <code className="bg-[#1a1a1a] px-1 rounded text-xs">{'{{tasks}}'}</code>, <code className="bg-[#1a1a1a] px-1 rounded text-xs">{'{{title}}'}</code>, <code className="bg-[#1a1a1a] px-1 rounded text-xs">{'{{content}}'}</code> as placeholders. Leave blank to use defaults.
              </p>

              {[
                { label: 'Chat Assistant', value: promptChat, set: setPromptChat, placeholder: 'You are a personal knowledge assistant...' },
                { label: 'Daily Brief', value: promptBrief, set: setPromptBrief, placeholder: 'Generate a brief daily summary for {{date}}...\n\nRecent notes:\n{{notes}}\n\nPending tasks:\n{{tasks}}' },
                { label: 'Task Extraction', value: promptTaskExtract, set: setPromptTaskExtract, placeholder: 'Extract tasks from:\nTitle: {{title}}\nContent: {{content}}{{exclusions}}' },
              ].map(({ label, value, set, placeholder }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={`text-xs font-medium ${c.gray}`}>{label}</label>
                    {value && (
                      <button type="button" onClick={() => set('')} className={`text-xs ${c.gray} hover:text-red-400 transition-colors`}>
                        Reset to default
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={4}
                    value={value}
                    onChange={e => set(e.target.value)}
                    placeholder={placeholder}
                    className={`w-full px-3 py-2.5 ${c.input} bg-[#1a1a1a] border ${c.border} rounded-lg ${c.text} placeholder-[#3a3a3a] text-xs font-mono resize-y focus:outline-none focus:border-blue-500 transition-colors`}
                  />
                </div>
              ))}

              <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : saved ? <><CheckCircle size={14} /> Saved</> : 'Save'}
              </button>
            </form>
          )}
        </div>

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
