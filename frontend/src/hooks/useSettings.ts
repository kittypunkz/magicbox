import { useState, useEffect } from 'react';
import { settingsAPI } from '../api/client';

export interface ResolvedSettings {
  timezone: string;
  autosaveDelayMs: number;
  briefTemperature: number;
  taskTemperature: number;
  briefTimeWindowHours: number;
  briefMaxNotes: number;
  briefMaxTasks: number;
  promptChat: string;
  promptBrief: string;
  promptTaskExtract: string;
}

const DEFAULTS: ResolvedSettings = {
  timezone: 'Asia/Bangkok',
  autosaveDelayMs: 2000,
  briefTemperature: 0.7,
  taskTemperature: 0.2,
  briefTimeWindowHours: 24,
  briefMaxNotes: 20,
  briefMaxTasks: 20,
  promptChat: '',
  promptBrief: '',
  promptTaskExtract: '',
};

export function useSettings() {
  const [settings, setSettings] = useState<ResolvedSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    settingsAPI.getAll().then(s => {
      setSettings({
        timezone: s.timezone || DEFAULTS.timezone,
        autosaveDelayMs: s.autosave_delay_ms ? parseInt(s.autosave_delay_ms, 10) : DEFAULTS.autosaveDelayMs,
        briefTemperature: s.brief_temperature ? parseFloat(s.brief_temperature) : DEFAULTS.briefTemperature,
        taskTemperature: s.task_temperature ? parseFloat(s.task_temperature) : DEFAULTS.taskTemperature,
        briefTimeWindowHours: s.brief_time_window_hours ? parseInt(s.brief_time_window_hours, 10) : DEFAULTS.briefTimeWindowHours,
        briefMaxNotes: s.brief_max_notes ? parseInt(s.brief_max_notes, 10) : DEFAULTS.briefMaxNotes,
        briefMaxTasks: s.brief_max_tasks ? parseInt(s.brief_max_tasks, 10) : DEFAULTS.briefMaxTasks,
        promptChat: s.prompt_chat || '',
        promptBrief: s.prompt_brief || '',
        promptTaskExtract: s.prompt_task_extract || '',
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return { settings, loading };
}
