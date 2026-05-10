import { describe, test, expect, beforeEach } from 'vitest';
import { SELF, env } from 'cloudflare:test';
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
  test('returns today breakdown including added_today and carry_over', async () => {
    const backlogRes = await SELF.fetch(`${BASE}/tasks`, {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Backlog task', status: 'backlog' }),
    });
    const doingRes = await SELF.fetch(`${BASE}/tasks`, {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Doing task', status: 'doing' }),
    });
    const carryOverRes = await SELF.fetch(`${BASE}/tasks`, {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Carry over task', status: 'backlog' }),
    });

    const backlogTask = (await backlogRes.json() as { task: { id: number } }).task;
    const doingTask = (await doingRes.json() as { task: { id: number } }).task;
    const carryOverTask = (await carryOverRes.json() as { task: { id: number } }).task;

    await SELF.fetch(`${BASE}/tasks/${doingTask.id}`, {
      method: 'PATCH',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done' }),
    });

    const db = env.DB as D1Database;
    await db.prepare(
      `UPDATE tasks
       SET created_at = datetime(created_at, '-1 day')
       WHERE id = ?`
    ).bind(carryOverTask.id).run();

    const res = await SELF.fetch(`${BASE}/tasks/summary`, {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    const data = await res.json() as {
      backlog: Array<{ id: number }>;
      doing: Array<{ id: number }>;
      added_today: Array<{ id: number }>;
      carry_over: Array<{ id: number }>;
      done_today: Array<{ id: number }>;
      date: string;
    };
    expect(data.backlog).toHaveLength(2);
    expect(data.backlog.map(task => task.id).sort((a, b) => a - b)).toEqual(
      [backlogTask.id, carryOverTask.id].sort((a, b) => a - b)
    );
    expect(data.doing).toHaveLength(0);
    expect(data.done_today).toHaveLength(1);
    expect(data.done_today[0]?.id).toBe(doingTask.id);
    expect(data.added_today.map(task => task.id).sort((a, b) => a - b)).toEqual(
      [backlogTask.id, doingTask.id].sort((a, b) => a - b)
    );
    expect(data.carry_over).toHaveLength(1);
    expect(data.carry_over[0]?.id).toBe(carryOverTask.id);
    expect(data.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
