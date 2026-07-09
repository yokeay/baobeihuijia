import { getDb } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "7d";

  const days = range === "30d" ? 30 : range === "180d" ? 180 : 7;
  const db = await getDb();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const sinceStr = since.toISOString();

  // Generate date labels
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }

  function fill(rows: any[], dateCol = "date", countCol = "count"): { date: string; count: number }[] {
    const map = new Map<string, number>();
    for (const r of rows) {
      const d = String(r[dateCol] || "").slice(0, 10);
      map.set(d, Number(r[countCol]) || 0);
    }
    return dates.map(d => ({ date: days > 30 ? d.slice(5) : d.slice(5), count: map.get(d) || 0 }));
  }

  // Cases per day
  const caseRows = await db.execute(
    sql`SELECT DATE(created_at) as date, COUNT(*)::int as count FROM cases WHERE created_at >= ${sinceStr}::timestamp GROUP BY DATE(created_at) ORDER BY date`
  );

  // Clues per day
  const clueRows = await db.execute(
    sql`SELECT DATE(created_at) as date, COUNT(*)::int as count FROM clues WHERE created_at >= ${sinceStr}::timestamp GROUP BY DATE(created_at) ORDER BY date`
  );

  // Follows per day
  const followRows = await db.execute(
    sql`SELECT DATE(created_at) as date, COUNT(*)::int as count FROM user_activities WHERE action = 'follow' AND created_at >= ${sinceStr}::timestamp GROUP BY DATE(created_at) ORDER BY date`
  );

  return Response.json({
    cases: fill(caseRows.rows || caseRows),
    clues: fill(clueRows.rows || clueRows),
    follows: fill(followRows.rows || followRows),
  });
}
