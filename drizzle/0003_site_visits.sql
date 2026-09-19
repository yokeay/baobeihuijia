-- site_visits: 全站访问流水，一次页面加载（含刷新）记一条
-- ip_hash 是 HMAC-SHA256(服务端密钥, 访客 IP)，不可逆，原始 IP 不落库
CREATE TABLE IF NOT EXISTS site_visits (
  id TEXT PRIMARY KEY,
  ip_hash TEXT NOT NULL,
  path TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 按天聚合出趋势线、按时间筛今日
CREATE INDEX IF NOT EXISTS idx_site_visits_created_at ON site_visits (created_at);
-- 累计/今日独立访客（COUNT DISTINCT ip_hash）
CREATE INDEX IF NOT EXISTS idx_site_visits_ip_hash ON site_visits (ip_hash);
