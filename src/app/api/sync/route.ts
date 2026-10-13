import { crawlFromApi, type CrawlStats } from "@/lib/crawler";
import { beginSyncRun, completeSyncRun, abortSyncRun } from "@/lib/sync/runs";
import { getAdminFromCookies } from "@/lib/auth";

const SYNC_SECRET = process.env.SYNC_SECRET || "";

// 记录大陆爬虫运行到 sync_runs（巡检心跳/结果的数据源）。
// tokenMissing 时爬虫并没有真正开始跑，按错误记，避免「静默 0 新增」。
function crawlRunStats(stats: CrawlStats) {
  return {
    totalInApi: stats.totalRequests,
    added: stats.added,
    skipped: stats.skipped,
    errors: stats.errors + (stats.tokenMissing ? 1 : 0),
    durationMs: stats.durationMs,
    lastError: stats.lastError ?? (stats.tokenMissing ? "上游 API token 缺失（EXTERNAL_API_TOKEN 未配置）" : null),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Require secret for cron-triggered sync (skip check if no secret configured)
  if (SYNC_SECRET) {
    const secret = searchParams.get("secret");
    if (secret !== SYNC_SECRET) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const count = Math.min(parseInt(searchParams.get("count") || "30"), 100);
  const delay = Math.max(parseInt(searchParams.get("delay") || "2000"), 100);

  const runId = await beginSyncRun("mainland");
  try {
    const stats = await crawlFromApi({ maxRequests: count, delayMs: delay });
    await completeSyncRun(runId, crawlRunStats(stats), { totalInDb: stats.totalInDb, tokenMissing: stats.tokenMissing });
    return Response.json(stats);
  } catch (err) {
    await abortSyncRun(runId, err);
    throw err;
  }
}

export async function POST() {
  const admin = await getAdminFromCookies();
  if (!admin) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  const runId = await beginSyncRun("mainland");
  try {
    const stats = await crawlFromApi();
    await completeSyncRun(runId, crawlRunStats(stats), { totalInDb: stats.totalInDb, tokenMissing: stats.tokenMissing });
    return Response.json(stats);
  } catch (err) {
    await abortSyncRun(runId, err);
    throw err;
  }
}
