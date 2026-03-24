-- Add bookmark_url column (NULL = regular note, non-NULL = bookmark)
ALTER TABLE notes ADD COLUMN bookmark_url TEXT DEFAULT NULL;

-- Partial index for bookmark filtering
CREATE INDEX idx_notes_bookmark ON notes(bookmark_url) WHERE bookmark_url IS NOT NULL;
