-- Migration: Add note pinning support
-- Date: 2026-03-20

-- Add is_pinned column to notes table (0 = not pinned, 1 = pinned)
ALTER TABLE notes ADD COLUMN is_pinned INTEGER DEFAULT 0;

-- Create index for efficient pin sorting
CREATE INDEX idx_notes_is_pinned ON notes(is_pinned DESC);

-- Create composite index for common query pattern (folder + pin + updated)
CREATE INDEX idx_notes_folder_pin_updated ON notes(folder_id, is_pinned DESC, updated_at DESC);
