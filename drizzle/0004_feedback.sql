-- feedback: 前台「反馈与建议」表单落库。只有标题和正文，不收图片。
-- user_id / user_name 是提交时若已登录则记下的身份，未登录为 NULL（不强制登录）。
CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  user_id TEXT,
  user_name TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 后台默认按时间倒序翻页
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback (created_at);
-- 后台「待处理 / 已处理」筛选
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback (status);
