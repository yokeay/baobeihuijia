import { crawlFromApi } from "@/lib/crawler";
import { getAdminFromCookies } from "@/lib/auth";

const SYNC_SECRET = process.env.SYNC_SECRET || "";

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

  const stats = await crawlFromApi({ maxRequests: count, delayMs: delay });
  return Response.json(stats);
}

export async function POST() {
  const admin = await getAdminFromCookies();
  if (!admin) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  const stats = await crawlFromApi();
  return Response.json(stats);
}
