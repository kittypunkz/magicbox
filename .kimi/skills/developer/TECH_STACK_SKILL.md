# 🛠️ MagicBox Tech Stack - Best Practices Guide

Complete best practices for MagicBox's technology stack based on 2024-2025 industry standards.

---

## Tech Stack Overview

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Backend** | Cloudflare Workers + Hono |
| **Database** | Cloudflare D1 (SQLite) |
| **Testing** | Vitest + React Testing Library |
| **Styling** | Tailwind CSS |

---

## ⚛️ React + TypeScript Best Practices

### Component Patterns (2025 Standards)

#### 1. Function Components (Required)
```typescript
// ✅ GOOD: Function component with explicit props
interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

export function UserProfile({ userId, onUpdate }: UserProfileProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUser(userId)
      .then(data => setUser(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!user) return <NotFound />;

  return (
    <div className="user-profile">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}

// ❌ BAD: Class components (deprecated pattern)
class UserProfile extends React.Component {
  // Don't use this
}
```

#### 2. Custom Hooks for Reusable Logic
```typescript
// ✅ GOOD: Custom hook for data fetching
function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        setLoading(true);
        const data = await fetchUser(userId);
        if (!cancelled) setUser(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadUser();

    return () => { cancelled = true; };
  }, [userId]);

  return { user, loading, error, refetch: () => loadUser() };
}

// Usage
function UserProfile({ userId }: { userId: string }) {
  const { user, loading, error } = useUser(userId);
  // ...
}
```

#### 3. Type-Safe Props with Generics
```typescript
// ✅ GOOD: Generic components for reusability
interface SelectProps<T> {
  items: T[];
  selectedItem: T | null;
  onSelect: (item: T) => void;
  getDisplayText: (item: T) => string;
  getItemKey: (item: T) => string | number;
}

function Select<T>({
  items,
  selectedItem,
  onSelect,
  getDisplayText,
  getItemKey
}: SelectProps<T>) {
  return (
    <select
      value={selectedItem ? getItemKey(selectedItem) : ''}
      onChange={(e) => {
        const item = items.find(i => getItemKey(i) === e.target.value);
        if (item) onSelect(item);
      }}
    >
      {items.map(item => (
        <option key={getItemKey(item)} value={getItemKey(item)}>
          {getDisplayText(item)}
        </option>
      ))}
    </select>
  );
}
```

### Hooks Best Practices

#### Rules of Hooks
```typescript
// ✅ GOOD: Hooks at top level, unconditional
function Component() {
  const [state, setState] = useState(0);
  const ref = useRef(null);
  
  useEffect(() => {
    // effect logic
  }, [dependency]);

  if (condition) { // Conditional rendering AFTER hooks
    return null;
  }

  return <div />;
}

// ❌ BAD: Conditional hooks
function Component() {
  if (condition) {
    const [state, setState] = useState(0); // ❌ Never do this
  }
}
```

#### useEffect Dependencies
```typescript
// ✅ GOOD: Complete dependency array
useEffect(() => {
  fetchData(userId, filters);
}, [userId, filters]); // All dependencies listed

// ✅ GOOD: Empty array for mount-only
useEffect(() => {
  initializeAnalytics();
}, []); // Only runs once

// ✅ GOOD: Cleanup functions
useEffect(() => {
  const subscription = subscribeToUpdates();
  return () => subscription.unsubscribe();
}, []);

// ❌ BAD: Missing dependencies
useEffect(() => {
  fetchData(userId); // userId not in deps
}, []); // Missing dependency!
```

#### useCallback / useMemo
```typescript
// ✅ GOOD: useCallback for event handlers passed to children
const handleSubmit = useCallback((data: FormData) => {
  submitForm(data);
}, []); // Empty if no dependencies

// ✅ GOOD: useMemo for expensive computations
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.priority - b.priority);
}, [items]);

// ❌ BAD: Unnecessary useCallback
const handleClick = useCallback(() => { // Not passed to child
  setCount(c => c + 1);
}, []);
```

### State Management

#### Local State (useState)
```typescript
// ✅ GOOD: Simple state with useState
const [count, setCount] = useState(0);
const [user, setUser] = useState<User | null>(null);

// ✅ GOOD: Functional updates for dependent state
setCount(prev => prev + 1);

// ✅ GOOD: Multiple related state → useReducer for complex state
interface State {
  loading: boolean;
  data: Data | null;
  error: Error | null;
}

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Data }
  | { type: 'FETCH_ERROR'; payload: Error };

const [state, dispatch] = useReducer(reducer, initialState);
```

#### Form Handling
```typescript
// ✅ GOOD: Controlled components
function Form() {
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    await submitForm(values);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="email"
        value={values.email}
        onChange={handleChange}
        aria-invalid={!!errors.email}
      />
      {errors.email && <span role="alert">{errors.email}</span>}
    </form>
  );
}
```

---

## ☁️ Cloudflare Workers Best Practices

### Architecture Patterns

#### 1. Keep Compatibility Date Current
```toml
# wrangler.toml
name = "magicbox-api"
main = "src/index.ts"
compatibility_date = "2026-03-20"  # Use current date
compatibility_flags = ["nodejs_compat"]
```

#### 2. Use Bindings, Not REST APIs
```typescript
// ✅ GOOD: Use D1 binding directly
export default {
  async fetch(request: Request, env: Env) {
    const result = await env.DB.prepare(
      'SELECT * FROM notes WHERE id = ?'
    ).bind(id).first();
    return Response.json(result);
  }
};

// ❌ BAD: Calling REST API from Worker
const response = await fetch(
  'https://api.cloudflare.com/client/v4/...',
  { headers: { Authorization: `Bearer ${token}` } }
);
```

#### 3. Stream Request/Response Bodies
```typescript
// ✅ GOOD: Stream large responses
export default {
  async fetch(request: Request) {
    const { readable, writable } = new TransformStream();
    
    // Process in background
    request.body?.pipeTo(writable);
    
    return new Response(readable);
  }
};

// ❌ BAD: Buffer large payloads
const body = await request.json(); // Can exceed memory limit
```

#### 4. No Global Mutable State
```typescript
// ❌ BAD: Global mutable state
let requestCount = 0; // Shared across requests!

export default {
  async fetch(request: Request) {
    requestCount++; // ❌ Dangerous!
    return new Response(`Count: ${requestCount}`);
  }
};

// ✅ GOOD: Use request context
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // Store in D1/KV if persistence needed
    await env.DB.prepare('UPDATE stats SET count = count + 1').run();
    return new Response('OK');
  }
};
```

#### 5. Always Await Promises
```typescript
// ✅ GOOD: Await or waitUntil
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // Wait for result
    const result = await processRequest(request);
    
    // Or use waitUntil for background work
    ctx.waitUntil(logAnalytics(request));
    
    return Response.json(result);
  }
};

// ❌ BAD: Floating promise
export default {
  async fetch(request: Request) {
    processRequest(request); // ❌ Not awaited! Promise lost.
    return new Response('OK');
  }
};
```

### Security Best Practices

#### Web Crypto for Security Operations
```typescript
// ✅ GOOD: Use Web Crypto API
const token = crypto.randomUUID(); // Secure random

// ✅ GOOD: Password hashing with PBKDF2
async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

// ❌ BAD: Math.random for security
const token = Math.random().toString(36); // ❌ Predictable!
```

---

## 🔥 Hono Framework Best Practices

### Routing Patterns

#### Direct Route Handlers (Preferred)
```typescript
// ✅ GOOD: Direct handlers with type inference
const app = new Hono<{ Bindings: Env }>();

app.get('/api/notes/:id', async (c) => {
  const id = c.req.param('id'); // Type: string (inferred!)
  const note = await c.env.DB.prepare('SELECT * FROM notes WHERE id = ?')
    .bind(id)
    .first();
  
  if (!note) {
    return c.json({ success: false, error: 'Not found' }, 404);
  }
  
  return c.json({ success: true, data: note });
});

// ❌ BAD: Separate controllers (loses type inference)
const getNote = (c: Context) => {
  const id = c.req.param('id'); // Type: string | undefined (not inferred)
};
app.get('/api/notes/:id', getNote);
```

### Middleware Patterns

#### Onion Model Execution
```typescript
// Middleware executes in "onion" pattern:
// 1. Before handler (outer → inner)
// 2. Handler
// 3. After handler (inner → outer)

app.use(async (c, next) => {
  console.log('1. Before (first)');
  await next();
  console.log('6. After (first)');
});

app.use(async (c, next) => {
  console.log('2. Before (second)');
  await next();
  console.log('5. After (second)');
});

app.get('/', (c) => {
  console.log('3. Handler');
  return c.text('Hello');
});
// Output: 1, 2, 3, 5, 6
```

#### Middleware Order Best Practices
```typescript
const app = new Hono();

// 1. Request ID (first - for tracking)
app.use(requestId());

// 2. Logger (early - to log all requests)
app.use(logger());

// 3. Security headers
app.use(secureHeaders());

// 4. CORS (before auth - for preflight)
app.use('/api/*', cors());

// 5. Compression
app.use(compress());

// 6. Rate limiting
app.use('/api/*', rateLimiter({ max: 100, window: 60000 }));

// 7. Authentication
app.use('/api/*', bearerAuth({ verifyToken }));

// 8. Routes
app.route('/api', apiRoutes);

// 9. Error handling (last)
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ success: false, error: 'Internal server error' }, 500);
});
```

#### Custom Middleware with Types
```typescript
// ✅ GOOD: Typed middleware with createMiddleware
import { createMiddleware } from 'hono/factory';

interface Variables {
  user: { id: string; email: string };
  requestId: string;
}

const authMiddleware = createMiddleware<{ Variables: Variables }>(
  async (c, next) => {
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    try {
      const user = await verifyToken(token);
      c.set('user', user);
      await next();
    } catch {
      return c.json({ success: false, error: 'Invalid token' }, 401);
    }
  }
);

// Usage with typed context
app.get('/api/me', authMiddleware, (c) => {
  const user = c.get('user'); // Type: { id: string; email: string }
  return c.json({ success: true, data: user });
});
```

### Error Handling

#### Centralized Error Handler
```typescript
import { HTTPException } from 'hono/http-exception';

app.onError((err, c) => {
  // Handle HTTP exceptions
  if (err instanceof HTTPException) {
    return c.json({ 
      success: false, 
      error: err.message 
    }, err.status);
  }
  
  // Log unexpected errors
  console.error('Unexpected error:', err);
  
  // Generic error response
  return c.json({ 
    success: false, 
    error: 'Internal server error' 
  }, 500);
});

// Usage: throw HTTPException for expected errors
app.delete('/api/notes/:id', async (c) => {
  const note = await getNote(c.req.param('id'));
  
  if (!note) {
    throw new HTTPException(404, { message: 'Note not found' });
  }
  
  if (note.userId !== c.get('user').id) {
    throw new HTTPException(403, { message: 'Not authorized' });
  }
  
  await deleteNote(note.id);
  return c.json({ success: true });
});
```

### Validation

#### Zod Integration
```typescript
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const createNoteSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().optional(),
  folderId: z.string().optional(),
});

app.post(
  '/api/notes',
  zValidator('json', createNoteSchema),
  async (c) => {
    const data = c.req.valid('json'); // Type-safe validated data
    
    const result = await c.env.DB.prepare(`
      INSERT INTO notes (title, content, folder_id, user_id, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(data.title, data.content || '', data.folderId || null, c.get('user').id)
      .run();
    
    return c.json({ 
      success: true, 
      data: { id: result.meta.last_row_id } 
    }, 201);
  }
);
```

---

## 🗄️ D1 Database Best Practices

### Query Patterns

#### Always Use Prepared Statements
```typescript
// ✅ GOOD: Prepared statement with parameter binding
const stmt = env.DB.prepare('SELECT * FROM notes WHERE id = ?');
const note = await stmt.bind(noteId).first();

// ✅ GOOD: Reuse prepared statements
const insertNote = env.DB.prepare(`
  INSERT INTO notes (title, content, user_id) VALUES (?, ?, ?)
`);

for (const note of notes) {
  await insertNote.bind(note.title, note.content, userId).run();
}

// ❌ BAD: String concatenation (SQL injection risk!)
const query = `SELECT * FROM notes WHERE title = '${userInput}'`; // ❌ NEVER!
```

#### Batch Operations for Transactions
```typescript
// ✅ GOOD: Batch for atomic operations
await env.DB.batch([
  env.DB.prepare('INSERT INTO notes (title) VALUES (?)').bind('Note 1'),
  env.DB.prepare('INSERT INTO notes (title) VALUES (?)').bind('Note 2'),
  env.DB.prepare('UPDATE folders SET note_count = note_count + 1 WHERE id = ?').bind(folderId),
]);

// ❌ BAD: Sequential queries (not atomic)
await env.DB.prepare('INSERT...').run();
await env.DB.prepare('INSERT...').run(); // If this fails, first insert remains
```

#### Use RETURNING Clause
```typescript
// ✅ GOOD: RETURNING avoids second query
const result = await env.DB.prepare(`
  INSERT INTO notes (title, content, user_id) 
  VALUES (?, ?, ?)
  RETURNING *
`).bind(title, content, userId).first<Note>();

// Returns the created note with ID, timestamps, etc.
return c.json({ success: true, data: result });

// ❌ BAD: Two queries to get created record
await env.DB.prepare('INSERT...').run();
const note = await env.DB.prepare('SELECT * FROM notes WHERE id = last_insert_rowid()').first();
```

### Schema Design

#### Indexes for Performance
```sql
-- ✅ GOOD: Indexes for query patterns
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_folder_id ON notes(folder_id);
CREATE INDEX idx_notes_created_at ON notes(created_at);

-- ✅ GOOD: Composite index for multi-column queries
CREATE INDEX idx_notes_user_folder ON notes(user_id, folder_id);

-- ✅ GOOD: Unique index for constraints
CREATE UNIQUE INDEX idx_folders_name_user ON folders(name, user_id);
```

#### Foreign Keys with Cascading
```sql
-- ✅ GOOD: Foreign keys with ON DELETE
CREATE TABLE notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  folder_id INTEGER,
  title TEXT NOT NULL,
  content TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
);
```

### Error Handling
```typescript
// ✅ GOOD: Handle specific D1 errors
try {
  const result = await env.DB.prepare(`
    INSERT INTO notes (title, user_id) VALUES (?, ?)
  `).bind(title, userId).run();
  
  return c.json({ success: true, data: result });
} catch (error) {
  // Check for unique constraint violation
  if (error.message?.includes('UNIQUE constraint failed')) {
    return c.json({ 
      success: false, 
      error: 'A note with this title already exists' 
    }, 409);
  }
  
  console.error('Database error:', error);
  return c.json({ success: false, error: 'Database error' }, 500);
}
```

---

## ⚡ Vite Best Practices

### Configuration

#### Recommended vite.config.ts
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: true,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@uiw/react-md-editor', 'lucide-react'],
        },
      },
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  
  optimizeDeps: {
    include: ['react', 'react-dom', '@uiw/react-md-editor'],
  },
  
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
});
```

### Code Splitting

#### Route-Based Splitting
```typescript
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Lazy load route components
const Home = lazy(() => import('./pages/Home'));
const NoteEditor = lazy(() => import('./pages/NoteEditor'));
const Settings = lazy(() => import('./pages/Settings'));

// Named chunks for debugging
const Profile = lazy(() => 
  import(/* webpackChunkName: "profile" */ './pages/Profile')
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/note/:id" element={<NoteEditor />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

### Environment Variables
```typescript
// .env
VITE_API_URL=http://localhost:8787
VITE_APP_TITLE=MagicBox

// vite.config.ts - Type definitions
type ImportMetaEnv = {
  readonly VITE_API_URL: string;
  readonly VITE_APP_TITLE: string;
};

type ImportMeta = {
  readonly env: ImportMetaEnv;
};

// Usage in code
const apiUrl = import.meta.env.VITE_API_URL;
```

---

## 🧪 Vitest Testing Best Practices

### Configuration

#### vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'vitest.setup.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

#### vitest.setup.ts
```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Clean up after each test
afterEach(() => {
  cleanup();
});
```

### Component Testing

#### Testing User Behavior (Not Implementation)
```typescript
// ✅ GOOD: Test what users see and do
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { NoteEditor } from './NoteEditor';

describe('NoteEditor', () => {
  it('saves note when save button is clicked', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    
    render(<NoteEditor onSave={onSave} />);
    
    // Type in the title
    await user.type(screen.getByLabelText(/title/i), 'My Note');
    
    // Click save
    await user.click(screen.getByRole('button', { name: /save/i }));
    
    // Verify save was called
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      title: 'My Note',
    }));
  });
  
  it('shows error when title is empty', async () => {
    const user = userEvent.setup();
    render(<NoteEditor onSave={vi.fn()} />);
    
    // Try to save without title
    await user.click(screen.getByRole('button', { name: /save/i }));
    
    // Error message shown
    expect(screen.getByRole('alert')).toHaveTextContent(/title is required/i);
  });
});

// ❌ BAD: Testing implementation details
it('sets state correctly', () => {
  const { result } = renderHook(() => useState(''));
  // Testing internal state - bad!
});
```

#### Query Priority
```typescript
// ✅ GOOD: Query priority (most accessible first)
// 1. getByRole (best for accessibility)
screen.getByRole('button', { name: /submit/i });
screen.getByRole('textbox', { name: /email/i });

// 2. getByLabelText (for form elements)
screen.getByLabelText(/password/i);

// 3. getByPlaceholderText
screen.getByPlaceholderText(/search/i);

// 4. getByText (for non-interactive elements)
screen.getByText(/welcome/i);

// 5. getByTestId (last resort)
screen.getByTestId('note-list');
```

### Hook Testing
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useNotes } from './useNotes';

describe('useNotes', () => {
  it('fetches notes on mount', async () => {
    const { result } = renderHook(() => useNotes());
    
    // Initially loading
    expect(result.current.loading).toBe(true);
    
    // Wait for data
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.notes).toHaveLength(3);
  });
  
  it('handles errors', async () => {
    // Mock error response
    server.use(
      http.get('/api/notes', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );
    
    const { result } = renderHook(() => useNotes());
    
    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });
});
```

### Mocking
```typescript
import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock module
vi.mock('../api/notes', () => ({
  fetchNotes: vi.fn(() => Promise.resolve([{ id: '1', title: 'Test' }])),
}));

// Mock API with MSW (Mock Service Worker)
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  http.get('/api/notes', () => {
    return HttpResponse.json([
      { id: '1', title: 'Note 1' },
      { id: '2', title: 'Note 2' },
    ]);
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## 🎨 Tailwind CSS Best Practices

### Component Patterns
```typescript
// ✅ GOOD: Extract reusable classes with clsx + tailwind-merge
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | false)[]) {
  return twMerge(clsx(inputs));
}

function Button({ 
  variant = 'primary', 
  size = 'md', 
  className,
  children,
  ...props 
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
          'bg-gray-200 text-gray-800 hover:bg-gray-300': variant === 'secondary',
          'px-2 py-1 text-sm': size === 'sm',
          'px-4 py-2 text-base': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

### Responsive Design
```typescript
// ✅ GOOD: Mobile-first responsive design
function NoteCard({ note }: { note: Note }) {
  return (
    <div className="
      p-4                    /* Base: mobile */
      sm:p-6                 /* Small screens and up */
      lg:p-8                 /* Large screens and up */
      bg-white
      rounded-lg
      shadow-sm
      hover:shadow-md
      transition-shadow
    ">
      <h3 className="text-lg sm:text-xl font-semibold">{note.title}</h3>
      <p className="mt-2 text-sm sm:text-base text-gray-600 line-clamp-3">
        {note.content}
      </p>
    </div>
  );
}
```

---

## 📋 Quick Reference Checklist

### React + TypeScript
- [ ] Function components only
- [ ] Explicit props interfaces
- [ ] Custom hooks for reusable logic
- [ ] Proper useEffect dependencies
- [ ] Error boundaries for resilience
- [ ] Loading and error states

### Cloudflare Workers
- [ ] Current compatibility date
- [ ] Use bindings (not REST APIs)
- [ ] Stream large payloads
- [ ] No global mutable state
- [ ] Always await promises
- [ ] Web Crypto for security

### Hono
- [ ] Direct route handlers
- [ ] Typed middleware
- [ ] Proper middleware order
- [ ] Centralized error handling
- [ ] Zod for validation
- [ ] HTTPException for errors

### D1 Database
- [ ] Prepared statements only
- [ ] Batch for transactions
- [ ] RETURNING clause
- [ ] Proper indexes
- [ ] Foreign key constraints
- [ ] Handle specific errors

### Vite
- [ ] Code splitting with lazy
- [ ] Manual chunks config
- [ ] Terser for minification
- [ ] Path aliases
- [ ] Environment typing

### Vitest
- [ ] Test behavior, not implementation
- [ ] Accessible queries (getByRole)
- [ ] User event simulation
- [ ] MSW for API mocking
- [ ] Proper cleanup

---

## 🔗 Resources

- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Hono Documentation](https://hono.dev/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [D1 Best Practices](https://developers.cloudflare.com/d1/best-practices/)
- [Vitest Guide](https://vitest.dev/guide/)
- [Vite Documentation](https://vitejs.dev/)
