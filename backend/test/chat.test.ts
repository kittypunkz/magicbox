import { describe, test, expect, beforeEach } from 'vitest';
import { SELF, env } from 'cloudflare:test';
import { getSessionCookie, BASE } from './helpers';

let cookie: string;

beforeEach(async () => {
  cookie = await getSessionCookie();
});

describe('POST /chat/feedback', () => {
  test('stores source feedback', async () => {
    const res = await SELF.fetch(`${BASE}/chat/feedback`, {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_type: 'note',
        source_id: 12,
        note_id: 12,
        scope: 'today',
        message: 'Wrong source',
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json() as { success: boolean };
    expect(data.success).toBe(true);

    const db = env.DB as D1Database;
    const row = await db.prepare(
      'SELECT source_type, source_id, note_id, scope, message FROM ai_source_feedback LIMIT 1'
    ).first<{ source_type: string; source_id: number; note_id: number; scope: string; message: string }>();

    expect(row?.source_type).toBe('note');
    expect(row?.source_id).toBe(12);
    expect(row?.note_id).toBe(12);
    expect(row?.scope).toBe('today');
    expect(row?.message).toBe('Wrong source');
  });

  test('rejects missing source payload', async () => {
    const res = await SELF.fetch(`${BASE}/chat/feedback`, {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
  });
});
