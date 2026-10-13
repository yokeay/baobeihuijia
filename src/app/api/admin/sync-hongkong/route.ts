import { syncHongKong } from "@/lib/sync/hongkong";
import { beginSyncRun, completeSyncRun, abortSyncRun } from "@/lib/sync/runs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { dryRun } = body;

  if (dryRun) {
    const stats = await syncHongKong({ dryRun: true });
    return Response.json(stats);
  }

  // 真实同步：记录 sync_runs 供巡检做心跳与结果检查（dryRun 不记录）
  const runId = await beginSyncRun("hongkong");
  try {
    const stats = await syncHongKong({ dryRun: false });
    await completeSyncRun(runId, stats);
    return Response.json(stats);
  } catch (err) {
    await abortSyncRun(runId, err);
    throw err;
  }
}

export async function GET() {
  const stats = await syncHongKong({ dryRun: true });
  return Response.json({ message: "Dry run complete", ...stats });
}
