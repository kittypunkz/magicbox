import { Hono } from 'hono';
import { server } from '@passwordless-id/webauthn';
import type { Env, Credential } from '../types';

const app = new Hono<{ Bindings: Env }>();

const SESSION_DURATION_DAYS = 7;

// Helper: Generate random session ID
function generateSessionId(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Helper: Get session expiration date
function getSessionExpiry(): string {
  const date = new Date();
  date.setDate(date.getDate() + SESSION_DURATION_DAYS);
  return date.toISOString();
}

// GET /auth/status - Check if setup is complete and session status
app.get('/status', async (c) => {
  const db = c.env.DB as D1Database;
  
  // Check if any credentials exist
  const credentials = await db.prepare('SELECT COUNT(*) as count FROM credentials').first<{ count: number }>();
  const isSetup = credentials && credentials.count > 0;
  
  // Check session cookie
  const sessionId = c.req.header('Cookie')?.match(/sessionId=([^;]+)/)?.[1];
  let isAuthenticated = false;
  
  if (sessionId) {
    const session = await db.prepare(
      'SELECT * FROM sessions WHERE id = ? AND expires_at > datetime("now")'
    ).bind(sessionId).first();
    isAuthenticated = !!session;
  }
  
  return c.json({ isSetup, isAuthenticated });
});

// GET /auth/register/challenge - Get registration challenge
app.get('/register/challenge', async (c) => {
  const challenge = server.randomChallenge();
  
  // Store challenge temporarily (5 minutes)
  const db = c.env.DB as D1Database;
  await db.prepare(
    'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, 1, datetime("now", "+5 minutes"))'
  ).bind(`challenge:${challenge}`).run();
  
  return c.json({ challenge });
});

// POST /auth/register - Complete registration
app.post('/register', async (c) => {
  const body = await c.req.json();
  const registration = body.registration;
  const challenge = body.challenge;
  
  const db = c.env.DB as D1Database;
  
  // Verify challenge exists and is valid
  const storedChallenge = await db.prepare(
    'SELECT * FROM sessions WHERE id = ? AND expires_at > datetime("now")'
  ).bind(`challenge:${challenge}`).first();
  
  if (!storedChallenge) {
    return c.json({ error: 'Invalid or expired challenge' }, 400);
  }
  
  // Get origin from request
  const origin = c.req.header('Origin') || '';
  
  try {
    // Verify registration
    const expected = {
      challenge,
      origin,
    };
    
    const parsed = await server.verifyRegistration(registration, expected);
    
    // Store credential
    await db.prepare(
      `INSERT INTO credentials (id, user_id, public_key, algorithm, counter) 
       VALUES (?, 1, ?, ?, 0)`
    ).bind(
      parsed.credential.id, 
      parsed.credential.publicKey, 
      parsed.credential.algorithm
    ).run();
    
    // Clean up challenge
    await db.prepare('DELETE FROM sessions WHERE id = ?').bind(`challenge:${challenge}`).run();
    
    // Create session
    const sessionId = generateSessionId();
    await db.prepare(
      'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, 1, ?)'
    ).bind(sessionId, getSessionExpiry()).run();
    
    return c.json({ 
      success: true,
      credentialId: parsed.credential.id 
    }, 200, {
      'Set-Cookie': `sessionId=${sessionId}; HttpOnly; Secure; SameSite=None; Max-Age=${SESSION_DURATION_DAYS * 24 * 60 * 60}; Path=/`
    });
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ error: 'Registration failed' }, 400);
  }
});

// GET /auth/login/challenge - Get authentication challenge
app.get('/login/challenge', async (c) => {
  const db = c.env.DB as D1Database;
  
  // Check if setup is complete
  const credentials = await db.prepare('SELECT COUNT(*) as count FROM credentials').first<{ count: number }>();
  if (!credentials || credentials.count === 0) {
    return c.json({ error: 'Setup required' }, 400);
  }
  
  const challenge = server.randomChallenge();
  
  // Store challenge temporarily (5 minutes)
  await db.prepare(
    'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, 1, datetime("now", "+5 minutes"))'
  ).bind(`challenge:${challenge}`).run();
  
  return c.json({ challenge });
});

// POST /auth/login - Complete authentication
app.post('/login', async (c) => {
  const body = await c.req.json();
  const authentication = body.authentication;
  const challenge = body.challenge;
  
  const db = c.env.DB as D1Database;
  
  // Verify challenge exists and is valid
  const storedChallenge = await db.prepare(
    'SELECT * FROM sessions WHERE id = ? AND expires_at > datetime("now")'
  ).bind(`challenge:${challenge}`).first();
  
  if (!storedChallenge) {
    return c.json({ error: 'Invalid or expired challenge' }, 400);
  }
  
  // Get credential from database
  const credential = await db.prepare(
    'SELECT * FROM credentials WHERE id = ?'
  ).bind(authentication.id).first<Credential>();
  
  if (!credential) {
    return c.json({ error: 'Credential not found' }, 400);
  }
  
  const origin = c.req.header('Origin') || '';
  
  try {
    // Verify authentication
    const expected = {
      challenge,
      origin,
      userVerified: true,
      counter: credential.counter,
    };
    
    const credentialKey = {
      id: credential.id,
      publicKey: credential.public_key,
      algorithm: credential.algorithm as 'ES256' | 'RS256' | 'EdDSA',
      transports: [] as string[],
    };
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed = await server.verifyAuthentication(authentication, credentialKey as any, expected);
    
    // Update counter
    await db.prepare(
      'UPDATE credentials SET counter = ?, last_used_at = datetime("now") WHERE id = ?'
    ).bind(parsed.counter, credential.id).run();
    
    // Clean up challenge
    await db.prepare('DELETE FROM sessions WHERE id = ?').bind(`challenge:${challenge}`).run();
    
    // Create session
    const sessionId = generateSessionId();
    await db.prepare(
      'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, 1, ?)'
    ).bind(sessionId, getSessionExpiry()).run();
    
    return c.json({ success: true }, 200, {
      'Set-Cookie': `sessionId=${sessionId}; HttpOnly; Secure; SameSite=None; Max-Age=${SESSION_DURATION_DAYS * 24 * 60 * 60}; Path=/`
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return c.json({ error: 'Authentication failed' }, 400);
  }
});

// POST /auth/logout - Logout
app.post('/logout', async (c) => {
  const db = c.env.DB as D1Database;
  const sessionId = c.req.header('Cookie')?.match(/sessionId=([^;]+)/)?.[1];
  
  if (sessionId) {
    await db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
  }
  
  return c.json({ success: true }, 200, {
    'Set-Cookie': `sessionId=; HttpOnly; Secure; SameSite=None; Max-Age=0; Path=/`
  });
});

// GET /auth/me - Get current user (for session validation)
app.get('/me', async (c) => {
  const db = c.env.DB as D1Database;
  const sessionId = c.req.header('Cookie')?.match(/sessionId=([^;]+)/)?.[1];
  
  if (!sessionId) {
    return c.json({ error: 'Not authenticated' }, 401);
  }
  
  const session = await db.prepare(
    'SELECT s.*, u.username FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = ? AND s.expires_at > datetime("now")'
  ).bind(sessionId).first<{ username: string; expires_at: string }>();
  
  if (!session) {
    return c.json({ error: 'Session expired' }, 401);
  }
  
  return c.json({ 
    username: session.username,
    expiresAt: session.expires_at 
  });
});

// GET /auth/credentials - List registered credentials (for management)
app.get('/credentials', async (c) => {
  const db = c.env.DB as D1Database;
  
  // Verify session
  const sessionId = c.req.header('Cookie')?.match(/sessionId=([^;]+)/)?.[1];
  if (!sessionId) {
    return c.json({ error: 'Not authenticated' }, 401);
  }
  
  const session = await db.prepare(
    'SELECT * FROM sessions WHERE id = ? AND expires_at > datetime("now")'
  ).bind(sessionId).first();
  
  if (!session) {
    return c.json({ error: 'Session expired' }, 401);
  }
  
  const credentials = await db.prepare(
    'SELECT id, created_at, last_used_at FROM credentials WHERE user_id = 1 ORDER BY created_at DESC'
  ).all<{ id: string; created_at: string; last_used_at: string | null }>();
  
  return c.json({ credentials: credentials.results || [] });
});

// DELETE /auth/credentials/:id - Remove a credential
app.delete('/credentials/:id', async (c) => {
  const db = c.env.DB as D1Database;
  const credentialId = c.req.param('id');
  
  // Verify session
  const sessionId = c.req.header('Cookie')?.match(/sessionId=([^;]+)/)?.[1];
  if (!sessionId) {
    return c.json({ error: 'Not authenticated' }, 401);
  }
  
  const session = await db.prepare(
    'SELECT * FROM sessions WHERE id = ? AND expires_at > datetime("now")'
  ).bind(sessionId).first();
  
  if (!session) {
    return c.json({ error: 'Session expired' }, 401);
  }
  
  // Don't allow deleting the last credential (prevent lockout)
  const count = await db.prepare('SELECT COUNT(*) as count FROM credentials').first<{ count: number }>();
  if (count && count.count <= 1) {
    return c.json({ error: 'Cannot delete the last credential' }, 400);
  }
  
  await db.prepare('DELETE FROM credentials WHERE id = ? AND user_id = 1').bind(credentialId).run();
  
  return c.json({ success: true });
});

export default app;
