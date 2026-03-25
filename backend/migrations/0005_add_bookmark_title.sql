-- Add bookmark_title column for storing fetched website title
ALTER TABLE notes ADD COLUMN bookmark_title TEXT DEFAULT NULL;
