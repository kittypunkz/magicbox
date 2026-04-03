import { Hono } from 'hono';
import type { Env } from '../types';

const app = new Hono<{ Bindings: Env }>();

// GET /feedback - Get all feedback (admin only - but for now, any authenticated user)
app.get('/', async (c) => {
  const db = c.env.DB as D1Database;
  
  const feedback = await db.prepare(`
    SELECT f.id, f.user_id, f.rating, f.comment, f.created_at, u.username
    FROM feedback f
    JOIN users u ON f.user_id = u.id
    ORDER BY f.created_at DESC
  `).all();
  
  return c.json({ success: true, data: feedback.results });
});

// POST /feedback - Submit feedback
app.post('/', async (c) => {
  const db = c.env.DB as D1Database;
  const body = await c.req.json();
  
  const { rating, comment } = body;
  
  // Validate rating
  if (!rating || rating < 1 || rating > 5) {
    return c.json({ error: 'Rating must be between 1 and 5' }, 400);
  }
  
  // For now, user_id is always 1 (single user app)
  const userId = 1;
  
  const result = await db.prepare(`
    INSERT INTO feedback (user_id, rating, comment)
    VALUES (?, ?, ?)
  `).bind(userId, rating, comment || '').run();
  
  return c.json({ 
    success: true, 
    data: { 
      id: result.lastInsertRowid,
      user_id: userId,
      rating,
      comment: comment || '',
      created_at: new Date().toISOString()
    }
  });
});

export default app;
