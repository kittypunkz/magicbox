-- Migration 0008: Add pin_order column to tags for drag-drop reordering
-- This allows users to customize the order of pinned tags in the sidebar

ALTER TABLE tags ADD COLUMN pin_order INTEGER DEFAULT 0;

-- Create index for efficient ordering queries
CREATE INDEX IF NOT EXISTS idx_tags_pin_order ON tags(pinned DESC, pin_order ASC, name ASC);
