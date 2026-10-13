import { syncCndes } from "@/lib/sync/cndes";
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

  const stats = await syncCndes({ dryRun: dryRun ?? false });

  return Response.json(stats);
}

export async function GET() {
  const admin = await getAdminFromCookies();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await syncCndes({ dryRun: true });
  return Response.json({ message: "Dry run complete", ...stats });
}
