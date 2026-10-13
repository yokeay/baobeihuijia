-- system_logs: 系统日志表。备份脚本（scripts/db-backup.sh，REQ-202610-0436）在失败时写入；
-- 由脚本维护，应用侧只读（后台如需展示再挂路由）。
-- level: error（本次失败）；source 标识写入方（当前仅 'db-backup'）
CREATE TABLE IF NOT EXISTS system_logs (
  id TEXT PRIMARY KEY,
  level TEXT NOT NULL DEFAULT 'error',
  source TEXT NOT NULL DEFAULT 'db-backup',
  message TEXT NOT NULL,
  detail TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 按时间倒序查最近日志
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs (created_at DESC);
