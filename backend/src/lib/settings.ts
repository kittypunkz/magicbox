import type { Env } from '../types';

export interface AIConfig {
  apiKey: string;
  model: string;
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
