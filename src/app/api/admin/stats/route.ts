import { getDb, schema } from "@/lib/db";
import { sql } from "drizzle-orm";
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

  return Response.json({
    total: totalRow?.count ?? 0,
    byStatus,
    bySource,
  });
}
