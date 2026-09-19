import { syncKorea } from "@/lib/sync/korea";
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

  const stats = await syncKorea({ dryRun: dryRun ?? false });

  return Response.json(stats);
}

export async function GET() {
  const admin = await getAdminFromCookies();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await syncKorea({ dryRun: true });
  return Response.json({ message: "Dry run complete", ...stats });
}
