import { describe, test, expect, beforeEach } from 'vitest';
import { SELF } from 'cloudflare:test';
import { getSessionCookie, BASE } from './helpers';

let cookie: string;

beforeEach(async () => {
  cookie = await getSessionCookie();
});

describe('GET /tasks', () => {
  test('returns empty list initially', async () => {
    const res = await SELF.fetch(`${BASE}/tasks`, {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    const data = await res.json() as { tasks: unknown[] };
    expect(Array.isArray(data.tasks)).toBe(true);
    expect(data.tasks).toHaveLength(0);
  });

  test('rejects unauthenticated request', async () => {
    const res = await SELF.fetch(`${BASE}/tasks`);
    expect(res.status).toBe(401);
  });
});

describe('POST /tasks', () => {
  test('creates a task', async () => {
    const res = await SELF.fetch(`${BASE}/tasks`, {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Buy groceries' }),
    });
    expect(res.status).toBe(201);
    const data = await res.json() as { task: { id: number; title: string; status: string } };
    expect(data.task.title).toBe('Buy groceries');
    expect(data.task.status).toBe('backlog');
    expect(typeof data.task.id).toBe('number');
  });

  test('creates a task with explicit status', async () => {
    const res = await SELF.fetch(`${BASE}/tasks`, {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'In progress task', status: 'doing' }),
    });
    expect(res.status).toBe(201);
    const data = await res.json() as { task: { status: string } };
    expect(data.task.status).toBe('doing');
  });

  test('rejects task with missing title', async () => {
    const res = await SELF.fetch(`${BASE}/tasks`, {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /tasks/:id', () => {
  test('updates task status to done', async () => {
    const createRes = await SELF.fetch(`${BASE}/tasks`, {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Finish report' }),
    });
    const { task } = await createRes.json() as { task: { id: number } };

    const res = await SELF.fetch(`${BASE}/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done' }),
    });
    expect(res.status).toBe(200);
    const data = await res.json() as { task: { status: string; completed_at: string } };
    expect(data.task.status).toBe('done');
    expect(data.task.completed_at).not.toBeNull();
  });

  test('returns 404 for non-existent task', async () => {
    const res = await SELF.fetch(`${BASE}/tasks/99999`, {
      method: 'PATCH',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done' }),
    });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /tasks/:id', () => {
  test('deletes a task', async () => {
    const createRes = await SELF.fetch(`${BASE}/tasks`, {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Delete me' }),
    });
    const { task } = await createRes.json() as { task: { id: number } };

    const res = await SELF.fetch(`${BASE}/tasks/${task.id}`, {
      method: 'DELETE',
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
  });

  test('returns 404 when deleting non-existent task', async () => {
    const res = await SELF.fetch(`${BASE}/tasks/99999`, {
      method: 'DELETE',
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(404);
  });
});

describe('GET /tasks/summary', () => {
  test('returns backlog/doing/done_today breakdown', async () => {
    await SELF.fetch(`${BASE}/tasks`, {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Backlog task', status: 'backlog' }),
    });
    await SELF.fetch(`${BASE}/tasks`, {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Doing task', status: 'doing' }),
    });

    const res = await SELF.fetch(`${BASE}/tasks/summary`, {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    const data = await res.json() as { backlog: unknown[]; doing: unknown[]; done_today: unknown[]; date: string };
    expect(data.backlog).toHaveLength(1);
    expect(data.doing).toHaveLength(1);
    expect(Array.isArray(data.done_today)).toBe(true);
    expect(data.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
