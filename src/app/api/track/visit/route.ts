import { getDb, schema } from "@/lib/db";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

/**
 * 记一次页面加载。由 VisitTracker（挂在根布局）在文档加载后上报，
 * 所以一次「打开 / 刷新」正好一条，前端路由跳转不会重复计。
 *
 * 访客 IP 不落库：只存 HMAC-SHA256(JWT_SECRET, ip)，不可逆，仅用于区分独立访客。
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const path = typeof body?.path === "string" ? body.path.slice(0, 120) : "";

    // 后台自己的浏览不算访客（否则管理员看板会把统计刷高）
    if (path.startsWith("/admin")) return Response.json({ ok: true });

    const forwarded = request.headers.get("x-forwarded-for");
    const ip =
      forwarded?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const ipHash = crypto
      .createHmac("sha256", process.env.JWT_SECRET || "")
      .update(ip)
      .digest("hex");

    const db = await getDb();
    await db.insert(schema.siteVisits).values({ id: uuidv4(), ipHash, path: path || null });
  } catch {
    // 统计只是附加信息，失败也不能影响页面
  }

  return Response.json({ ok: true });
}
