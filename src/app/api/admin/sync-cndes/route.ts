import { syncCndes } from "@/lib/sync/cndes";
import { beginSyncRun, completeSyncRun, abortSyncRun } from "@/lib/sync/runs";
import { getAdminFromCookies } from "@/lib/auth";

// A full run pulls ~90 year slices, some of them tens of MB of inline base64, and
// writes the decoded photos to disk — much heavier than the older sync routes, so
// like sync-korea this one sits behind the admin session rather than being open.
export async function POST(request: Request) {
  const admin = await getAdminFromCookies();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { dryRun } = body;

  if (dryRun) {
    const stats = await syncCndes({ dryRun: true });
    return Response.json(stats);
  }

  // 真实同步：记录 sync_runs 供巡检做心跳与结果检查（dryRun 不记录）
  const runId = await beginSyncRun("cndes");
  try {
    const stats = await syncCndes({ dryRun: false });
    await completeSyncRun(runId, stats, { photosSaved: stats.photosSaved });
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

  const stats = await syncCndes({ dryRun: true });
  return Response.json({ message: "Dry run complete", ...stats });
}
