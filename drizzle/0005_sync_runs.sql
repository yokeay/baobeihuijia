-- sync_runs: 同步任务运行记录（香港/美国/韩国/西班牙各一行/次），供巡检脚本与周报读取。
-- 由 src/lib/sync/runs.ts 在同步路由里写入；scripts/inspect.ts 只读。
-- status: running（进行中）| ok（跑完无错）| error（跑完但有错误）| failed（中途抛错）
CREATE TABLE IF NOT EXISTS sync_runs (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMP WITH TIME ZONE,
  total_in_api INTEGER,
  added INTEGER,
  skipped INTEGER,
  errors INTEGER,
  duration_ms INTEGER,
  last_error TEXT,
  detail JSONB
);

-- 巡检取「每个 source 最近一次运行」：按 source + started_at 倒序
CREATE INDEX IF NOT EXISTS idx_sync_runs_source_started ON sync_runs (source, started_at DESC);
