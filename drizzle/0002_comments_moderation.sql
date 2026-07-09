-- Add moderation fields to comments table
ALTER TABLE comments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE comments ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;

-- Set existing comments as approved
UPDATE comments SET status = 'approved' WHERE status IS NULL OR status = 'pending';
