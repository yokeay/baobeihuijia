import { getDb, schema } from "@/lib/db";
import { sql, eq } from "drizzle-orm";
import { getAdminFromCookies } from "@/lib/auth";

export async function GET() {
  const admin = await getAdminFromCookies();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();

  const [totalRow] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.cases);

  const statusRows = await db
    .select({ status: schema.cases.status, count: sql<number>`count(*)::int` })
    .from(schema.cases)
    .groupBy(schema.cases.status);

  const sourceRows = await db
    .select({ source: schema.cases.source, count: sql<number>`count(*)::int` })
    .from(schema.cases)
    .groupBy(schema.cases.source);

  const byStatus: Record<string, number> = { pending: 0, approved: 0, rejected: 0 };
  for (const r of statusRows) {
    if (r.status && byStatus.hasOwnProperty(r.status)) {
      byStatus[r.status] = r.count;
    }
  }

  const bySource: Record<string, number> = { api: 0, user_submit: 0, crawl: 0 };
  for (const r of sourceRows) {
    if (r.source && bySource.hasOwnProperty(r.source)) {
      bySource[r.source] = r.count;
    }
  }

  const [cluePendingRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.clues)
    .where(eq(schema.clues.status, "pending"));

  const [clueRejectedRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.clues)
    .where(eq(schema.clues.status, "rejected"));

  // 访问统计：一次页面加载算一次访问，独立 IP 按 ip_hash 去重。
  // CURRENT_DATE 走数据库会话时区（本机为 Asia/Shanghai），和趋势线的 DATE() 分桶一致。
  const visitResult = (await db.execute(sql`
    SELECT
      COUNT(*)::int                                              AS total,
      COUNT(DISTINCT ip_hash)::int                               AS unique_ips,
      COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::int    AS today,
      COUNT(DISTINCT ip_hash) FILTER (WHERE created_at >= CURRENT_DATE)::int AS today_unique
    FROM site_visits
  `)) as unknown as { rows?: Record<string, unknown>[] };
  const visitRow = visitResult.rows?.[0] ?? {};

  return Response.json({
    total: totalRow?.count ?? 0,
    byStatus,
    bySource,
    cluePending: cluePendingRow?.count ?? 0,
    clueRejected: clueRejectedRow?.count ?? 0,
    visits: {
      total: Number(visitRow.total) || 0,
      uniqueIps: Number(visitRow.unique_ips) || 0,
      today: Number(visitRow.today) || 0,
      todayUniqueIps: Number(visitRow.today_unique) || 0,
    },
  });
}
