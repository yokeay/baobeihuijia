import { getPool } from "@/lib/db/adapter-local-pg";

// 同步任务运行记录：每个同步路由在真正执行（非 dryRun）时写一行 sync_runs。
// 巡检脚本 scripts/inspect.ts 依赖这张表做「心跳与结果」检查，表结构见 drizzle/0005_sync_runs.sql。
// 设计原则：记录失败绝不影响同步本身——所有函数只记 console.error，不向外抛错。

export interface SyncRunStats {
  totalInApi?: number;
  added?: number;
  skipped?: number;
  errors?: number;
  durationMs?: number;
  lastError?: string | null;
}

// 同步开始：插入 running 行，返回运行 id；失败返回 null（后续完成/失败记录自动跳过）。
export async function beginSyncRun(source: string): Promise<string | null> {
  try {
    const id = crypto.randomUUID();
    await getPool().query(
      `INSERT INTO sync_runs (id, source, status, started_at) VALUES ($1, $2, 'running', NOW())`,
      [id, source]
    );
    return id;
  } catch (err) {
    console.error(`[sync-runs] 记录开始失败（source=${source}）:`, err);
    return null;
  }
}

// 同步完成：errors > 0 记为 error，否则 ok；detail 存该来源特有的附加信息（如 removed / photosSaved）。
export async function completeSyncRun(
  id: string | null,
  stats: SyncRunStats,
  detail?: Record<string, unknown>
): Promise<void> {
  if (!id) return;
  const errors = stats.errors ?? 0;
  try {
    await getPool().query(
      `UPDATE sync_runs SET status = $2, finished_at = NOW(), total_in_api = $3, added = $4,
         skipped = $5, errors = $6, duration_ms = $7, last_error = $8, detail = $9
       WHERE id = $1`,
      [
        id,
        errors > 0 ? "error" : "ok",
        stats.totalInApi ?? null,
        stats.added ?? null,
        stats.skipped ?? null,
        errors,
        stats.durationMs ?? null,
        stats.lastError ?? null,
        detail ? JSON.stringify(detail) : null,
      ]
    );
  } catch (err) {
    console.error(`[sync-runs] 记录完成失败（id=${id}）:`, err);
  }
}

// 同步中途抛错：记为 failed 并保留错误信息。
export async function abortSyncRun(id: string | null, err: unknown): Promise<void> {
  if (!id) return;
  const message = err instanceof Error ? err.message : String(err);
  try {
    await getPool().query(
      `UPDATE sync_runs SET status = 'failed', finished_at = NOW(), last_error = $2 WHERE id = $1`,
      [id, message.slice(0, 500)]
    );
  } catch (e) {
    console.error(`[sync-runs] 记录失败状态失败（id=${id}）:`, e);
  }
}
