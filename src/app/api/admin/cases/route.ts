import { getDb, schema } from "@/lib/db";
import { desc, eq, or, ilike, and, sql } from "drizzle-orm";
import { getAdminFromCookies } from "@/lib/auth";

export async function GET(req: Request) {
  const admin = await getAdminFromCookies();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
  const status = url.searchParams.get("status") || "";
  const source = url.searchParams.get("source") || "";
  const search = url.searchParams.get("search") || "";
  const offset = (page - 1) * limit;

  const db = await getDb();

  const conditions = [];
  if (status) {
    conditions.push(eq(schema.cases.status, status));
  }
  if (source) {
    conditions.push(eq(schema.cases.source, source));
  }
  if (search) {
    const q = `%${search}%`;
    conditions.push(
      or(
        ilike(schema.cases.name, q),
        ilike(schema.cases.lostProvince, q),
        ilike(schema.cases.lostCity, q),
        ilike(schema.cases.submitterName, q)
      )
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.cases)
    .where(where);

  const total = countRow?.count ?? 0;
  const totalPages = Math.ceil(total / limit);

  const items = await db
    .select()
    .from(schema.cases)
    .where(where)
    .orderBy(desc(schema.cases.createdAt))
    .limit(limit)
    .offset(offset);

  return Response.json({ items, total, page, limit, totalPages });
}
