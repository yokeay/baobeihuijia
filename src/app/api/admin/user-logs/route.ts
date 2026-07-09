import { getDb, schema } from "@/lib/db";
import { desc, sql } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const action = searchParams.get("action") || "";
  const search = searchParams.get("search") || "";
  const offset = (page - 1) * limit;

  const db = await getDb();
  const conditions: any[] = [];
  if (action) conditions.push(sql`${schema.userActivities.action} = ${action}`);
  if (search) conditions.push(sql`(${schema.userActivities.username} ILIKE ${"%" + search + "%"} OR ${schema.userActivities.target} ILIKE ${"%" + search + "%"})`);

  const where = conditions.length > 1
    ? sql`${conditions[0]} AND ${conditions[1]}`
    : conditions.length === 1 ? conditions[0] : undefined;

  const total = await db.select({ count: sql<number>`count(*)` }).from(schema.userActivities)
    .where(where).then((r: any[]) => Number(r[0]?.count ?? 0));

  const items = await db.select().from(schema.userActivities)
    .where(where)
    .orderBy(desc(schema.userActivities.createdAt))
    .limit(limit).offset(offset);

  return Response.json({ items, total, page, totalPages: Math.ceil(total / limit) });
}
