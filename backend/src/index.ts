import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { errorHandler } from './middleware/errorHandler';
import folders from './routes/folders';
import notes from './routes/notes';
import search from './routes/search';
import auth from './routes/auth';
import bookmarks from './routes/bookmarks';
import settings from './routes/settings';
import tasks from './routes/tasks';
import process from './routes/process';
import chat from './routes/chat';
import brief, { generateBrief } from './routes/brief';
import type { Env } from './types';

const app = new Hono<{ Bindings: Env }>();

// CORS configuration
app.use('*', cors({
  origin: (origin) => {
    if (!origin) return 'http://localhost:3000';
    if (origin.includes('localhost') || origin.includes('magicbox.bankapirak.com') || origin.includes('magicbox-app.pages.dev')) {
      return origin;
    }
    return 'http://localhost:3000';
  },
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposeHeaders: ['Set-Cookie'],
  credentials: true,
}));

// Error handling
app.onError(errorHandler);

// Health check
app.get('/', (c) => {
  return c.json({
    success: true,
    name: 'MagicBox API',
    version: '2.3.0',
    status: 'running',
  });
});

// Routes
app.route('/auth', auth);
app.route('/folders', folders);
app.route('/notes', notes);
app.route('/search', search);
app.route('/bookmarks', bookmarks);
app.route('/settings', settings);
app.route('/tasks', tasks);
app.route('/process', process);
app.route('/chat', chat);
app.route('/brief', brief);

// Cloudflare Cron trigger — nightly brief generation at midnight UTC
export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext) {
    const db = env.DB as D1Database;
    const today = new Date().toISOString().slice(0, 10);

    // Skip if already generated today
    const existing = await db.prepare('SELECT id FROM daily_briefs WHERE date = ?').bind(today).first();
    if (existing) return;

    const { getAIConfig } = await import('./lib/settings');
    const aiCfg = await getAIConfig(env);
    if (!aiCfg) return;
    const { model } = aiCfg;

    try {
      const content = await generateBrief(db, aiCfg.apiKey, model, today);
      await db.prepare(
        'INSERT OR IGNORE INTO daily_briefs (date, content) VALUES (?, ?)'
      ).bind(today, content).run();
    } catch (err) {
      console.error('Cron brief generation failed:', err);
    }
  },
};
