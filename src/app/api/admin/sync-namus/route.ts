import { syncNamus } from "@/lib/sync/namus";
import { beginSyncRun, completeSyncRun, abortSyncRun } from "@/lib/sync/runs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { maxStates, dryRun } = body;

  if (dryRun) {
    const stats = await syncNamus({
      maxStates: maxStates ?? undefined,
      dryRun: true,
    });
    return Response.json(stats);
  }

  // 真实同步：记录 sync_runs 供巡检做心跳与结果检查（dryRun 不记录）
  const runId = await beginSyncRun("namus");
  try {
    const stats = await syncNamus({
      maxStates: maxStates ?? undefined,
      dryRun: false,
    });
    await completeSyncRun(runId, stats, { removed: stats.removed });
    return Response.json(stats);
  } catch (err) {
    await abortSyncRun(runId, err);
    throw err;
  }
}

export async function GET() {
  const stats = await syncNamus({ dryRun: true });
  return Response.json({ message: "Dry run complete", ...stats });
}
