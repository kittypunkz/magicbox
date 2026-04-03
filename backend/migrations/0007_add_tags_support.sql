-- Migration 0007: Add tags support
-- This migration adds:
-- 1. tags JSON column to notes table (for storing array of tag names)
-- 2. legacy_folder_id column for rollback support
-- 3. tags table for tag management (id, name, color, icon, pinned)
-- 4. Proper indexes for tag-based queries

-- Add tags JSON column to notes
-- NOTE: This will fail if column already exists. Run each statement individually if needed.
ALTER TABLE notes ADD COLUMN tags TEXT DEFAULT '[]';

-- Add legacy_folder_id for rollback support
ALTER TABLE notes ADD COLUMN legacy_folder_id INTEGER;

-- Backup folder_id to legacy_folder_id for all notes
UPDATE notes SET legacy_folder_id = folder_id WHERE legacy_folder_id IS NULL;

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#3b82f6',
    icon TEXT DEFAULT NULL,
    pinned INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient tag queries
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_pinned ON tags(pinned DESC, name ASC);

-- Insert unique folder names as tags (with pinned=1 since they were previously folders)
INSERT OR IGNORE INTO tags (name, pinned)
SELECT DISTINCT name, 1 FROM folders;

-- Migrate notes: set tags JSON array from folder name
-- This converts folder_id → tags array for backward compatibility
UPDATE notes 
SET tags = json_array(
    (SELECT name FROM folders WHERE id = notes.folder_id)
)
WHERE json_array_length(tags) = 0 OR tags = '[]';

-- Add FTS trigger for tags column (optional, for full-text search on tags)
-- Note: SQLite FTS5 doesn't directly support JSON, so tags are searchable via LIKE queries

-- Migration complete
-- folders table is DEPRECATED but kept for rollback
-- Use legacy_folder_id to restore folder_id if needed
-- After confirming migration works, run: DROP TABLE folders;
