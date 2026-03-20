// backend/src/middleware/auth.ts
import { createMiddleware } from 'hono/factory';
import { verify } from '@tsndr/cloudflare-worker-jwt';
import type { Env, UserContext } from '../types';  // Import from centralized types

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
