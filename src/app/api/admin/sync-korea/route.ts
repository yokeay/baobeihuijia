import { syncKorea } from "@/lib/sync/korea";
import { beginSyncRun, completeSyncRun, abortSyncRun } from "@/lib/sync/runs";
import { getAdminFromCookies } from "@/lib/auth";

// A run walks ~2100 upstream pages over several minutes, so unlike the older
// sync routes this one is behind the admin session rather than open to anyone
// who guesses the path.
export async function POST(request: Request) {
  const admin = await getAdminFromCookies();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { dryRun } = body;

  if (dryRun) {
    const stats = await syncKorea({ dryRun: true });
    return Response.json(stats);
  }

  // 真实同步：记录 sync_runs 供巡检做心跳与结果检查（dryRun 不记录）
  const runId = await beginSyncRun("korea");
  try {
    const stats = await syncKorea({ dryRun: false });
    await completeSyncRun(runId, stats);
    return Response.json(stats);
  } catch (err) {
    await abortSyncRun(runId, err);
    throw err;
  }
}

export async function GET() {
  const admin = await getAdminFromCookies();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await syncKorea({ dryRun: true });
  return Response.json({ message: "Dry run complete", ...stats });
}
