-- user_activities: user action log for admin audit
CREATE TABLE IF NOT EXISTS user_activities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT,
  target_id TEXT,
  detail TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
