import { env } from 'cloudflare:test';
import { inject } from 'vitest';

type D1Migration = { name: string; queries: string[] };

// Apply migrations once per test file (provided by global.setup.ts).
beforeAll(async () => {
  const migrations = inject('d1Migrations') as D1Migration[];
  const db = env.DB as D1Database;
  for (const migration of migrations) {
    for (const query of migration.queries) {
      if (query.trim()) await db.prepare(query).run();
    }
  }
});

// Reset mutable state after each test. Run statements individually so a
// single failure doesn't silently skip the rest of the cleanup.
afterEach(async () => {
  const db = env.DB as D1Database;
  const tables = ['sessions', 'credentials', 'tasks', 'notes', 'daily_briefs', 'settings'];
  for (const t of tables) {
    await db.prepare(`DELETE FROM ${t}`).run();
  }
  // Keep folder id=1 (Inbox) but delete user-created folders
  await db.prepare('DELETE FROM folders WHERE id != 1').run();
  // Reset user password so isSetup returns false in next test
  await db.prepare('UPDATE users SET password_hash = NULL, password_salt = NULL WHERE id = 1').run();
});
