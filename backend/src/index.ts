import { Hono } from 'hono';
import { cors } from 'hono/cors';
import folders from './routes/folders';
import notes from './routes/notes';
import search from './routes/search';
import type { Env } from './types';

const app = new Hono<{ Bindings: Env }>();

// CORS - Allow magicbox subdomain and local dev
app.use('*', cors({
  origin: (origin) => {
    if (!origin) return 'http://localhost:3000';
    if (
      origin.includes('localhost') || 
      origin.includes('magicbox.bankapirak.com')
    ) {
      return origin;
    }
    return 'http://localhost:3000';
  },
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  credentials: true,
}));

// Health check
app.get('/', (c) => {
  return c.json({ 
    name: 'MagicBox API',
    version: '1.7.0',
    status: 'running',
    domain: 'magicbox.bankapirak.com'
  });
});

// Routes
app.route('/folders', folders);
app.route('/notes', notes);
app.route('/search', search);

export default app;
