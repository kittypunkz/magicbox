# ✨ MagicBox

A markdown-based note taking app inspired by Notion, built for Cloudflare.

## Features

- 📝 **Markdown Editor** - Full-featured markdown editing with live preview
- 📁 **Folders** - Organize notes with customizable folders
- 🔍 **Smart Search** - Full-text search with 1-second debounce
- ⚡ **Fast** - Edge-deployed on Cloudflare for global speed
- 💰 **Free** - Runs entirely on Cloudflare's generous free tier

## Quick Start

### 1. Install Dependencies

```bash
cd magicbox
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Create D1 Database

```bash
cd backend
npx wrangler d1 create magicbox-db
```

Copy the database ID and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "magicbox-db"
database_id = "your-database-id-here"
```

### 3. Run Migrations

```bash
npx wrangler d1 migrations create magicbox-db init
# Copy schema.sql content to the created migration file
npx wrangler d1 migrations apply magicbox-db
```

### 4. Start Development

```bash
# From root directory
npm run dev
```

This starts:
- Backend API at http://localhost:8787
- Frontend at http://localhost:3000

### 5. Deploy to Production

```bash
# Deploy API
cd backend
npx wrangler deploy

# Deploy Frontend
cd ../frontend
npm run build
npx wrangler pages deploy dist
```

## Project Structure

```
magicbox/
├── backend/          # Cloudflare Workers API
│   ├── src/
│   │   ├── routes/   # API routes (folders, notes, search)
│   │   ├── types/    # TypeScript types
│   │   └── index.ts  # Entry point
│   └── wrangler.toml # Cloudflare config
├── frontend/         # React + Vite app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── api/
│   └── index.html
└── database/
    └── schema.sql    # D1 database schema
```

## Usage Tips

### Creating Notes

On the home page, use the central input:
- Type `#foldername` to organize into a folder
- If the folder doesn't exist, it will be created automatically
- Example: `My Meeting Notes #work`

### Search

- Use the search bar (top right) to find notes and folders
- Searches title and content with 1-second debounce
- Results appear instantly from the edge

### Keyboard Shortcuts

- `Enter` - Create note from central input
- `Esc` - Cancel editing / Go back
- Notes auto-save after 2 seconds of inactivity

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript + Vite + Tailwind |
| Backend | Cloudflare Workers + Hono |
| Database | Cloudflare D1 (SQLite) |
| Markdown | @uiw/react-md-editor |
| Icons | Lucide React |

## License

MIT - Free for personal and commercial use.
