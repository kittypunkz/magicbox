// backend/src/middleware/auth.ts
import { createMiddleware } from 'hono/factory';
import { verify } from '@tsndr/cloudflare-worker-jwt';
import type { Env, UserContext } from '../types';

// JWT Bearer token auth (for API clients)
export const authMiddleware = createMiddleware<{ 
  Bindings: Env;
  Variables: { user: UserContext };
}>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized - No token provided' }, 401);
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  try {
    const isValid = await verify(token, c.env.JWT_SECRET);
    if (!isValid) {
      return c.json({ success: false, error: 'Unauthorized - Invalid token' }, 401);
    }
    
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    if (!payload.sub || !payload.username) {
      return c.json({ success: false, error: 'Unauthorized - Invalid token payload' }, 401);
    }
    
    c.set('user', {
      userId: parseInt(payload.sub, 10),
      username: payload.username,
    });
    
    await next();
  } catch (error) {
    return c.json({ success: false, error: 'Unauthorized - Token verification failed' }, 401);
  }
});

// Session cookie auth (for browser frontend)
export const sessionAuthMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: { user: UserContext };
}>(async (c, next) => {
  // Try JWT Bearer first
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    try {
      const isValid = await verify(token, c.env.JWT_SECRET);
      if (isValid) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.sub && payload.username) {
          c.set('user', {
            userId: parseInt(payload.sub, 10),
            username: payload.username,
          });
          await next();
          return;
        }
      }
    } catch {
      // Fall through to cookie check
    }
  }

  // Fall back to session cookie
  const sessionId = c.req.header('Cookie')?.match(/sessionId=([^;]+)/)?.[1];
  
  if (!sessionId) {
    return c.json({ success: false, error: 'Unauthorized - No session' }, 401);
  }

  const db = c.env.DB;
  const session = await db.prepare(
    'SELECT s.*, u.username FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = ? AND s.expires_at > datetime("now")'
  ).bind(sessionId).first<{ user_id: number; username: string }>();

  if (!session) {
    return c.json({ success: false, error: 'Unauthorized - Session expired' }, 401);
  }

  c.set('user', {
    userId: session.user_id,
    username: session.username,
  });

  await next();
});
