import type { Env } from '../types';

export interface AIConfig {
  apiKey: string;
  model: string;
}

export interface UserPrefs {
  briefTemperature: number;
  taskTemperature: number;
  briefTimeWindowHours: number;
  briefMaxNotes: number;
  briefMaxTasks: number;
  timezone: string;
  autosaveDelayMs: number;
  promptChat: string | null;
  promptBrief: string | null;
  promptTaskExtract: string | null;
}

export async function getAIConfig(env: Env): Promise<AIConfig | null> {
  const db = env.DB as D1Database;

  // API key: env secret takes priority over DB setting
  let apiKey = env.OPENROUTER_API_KEY || '';

  let model = 'openai/gpt-4o-mini';

  if (!apiKey) {
    const rows = await db.prepare(
      "SELECT key, value FROM settings WHERE key IN ('openrouter_api_key', 'preferred_model')"
    ).all<{ key: string; value: string }>();
    const cfg: Record<string, string> = {};
    for (const r of rows.results ?? []) cfg[r.key] = r.value;
    apiKey = cfg.openrouter_api_key || '';
    if (cfg.preferred_model) model = cfg.preferred_model;
  } else {
    // Still check DB for preferred_model
    const row = await db.prepare("SELECT value FROM settings WHERE key = 'preferred_model'")
      .first<{ value: string }>();
    if (row?.value) model = row.value;
  }

  if (!apiKey) return null;
  return { apiKey, model };
}

export async function getUserPrefs(env: Env): Promise<UserPrefs> {
  const db = env.DB as D1Database;
  const rows = await db.prepare(
    "SELECT key, value FROM settings WHERE key IN ('brief_temperature','task_temperature','brief_time_window_hours','brief_max_notes','brief_max_tasks','timezone','autosave_delay_ms','prompt_chat','prompt_brief','prompt_task_extract')"
  ).all<{ key: string; value: string }>();
  const cfg: Record<string, string> = {};
  for (const r of rows.results ?? []) cfg[r.key] = r.value;
  return {
    briefTemperature: cfg.brief_temperature ? parseFloat(cfg.brief_temperature) : 0.7,
    taskTemperature: cfg.task_temperature ? parseFloat(cfg.task_temperature) : 0.2,
    briefTimeWindowHours: cfg.brief_time_window_hours ? parseInt(cfg.brief_time_window_hours, 10) : 24,
    briefMaxNotes: cfg.brief_max_notes ? parseInt(cfg.brief_max_notes, 10) : 20,
    briefMaxTasks: cfg.brief_max_tasks ? parseInt(cfg.brief_max_tasks, 10) : 20,
    timezone: cfg.timezone || 'Asia/Bangkok',
    autosaveDelayMs: cfg.autosave_delay_ms ? parseInt(cfg.autosave_delay_ms, 10) : 2000,
    promptChat: cfg.prompt_chat || null,
    promptBrief: cfg.prompt_brief || null,
    promptTaskExtract: cfg.prompt_task_extract || null,
  };
}
