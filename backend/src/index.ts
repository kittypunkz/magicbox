import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { errorHandler } from './middleware/errorHandler';
import folders from './routes/folders';
import notes from './routes/notes';
import search from './routes/search';
import auth from './routes/auth';
import bookmarks from './routes/bookmarks';
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
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
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
    version: '1.4.0',
    status: 'running',
  });
});

// Routes
app.route('/auth', auth);
app.route('/folders', folders);
app.route('/notes', notes);
app.route('/search', search);
app.route('/bookmarks', bookmarks);

export default app;
