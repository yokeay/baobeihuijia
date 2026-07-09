import { getDb, schema } from "@/lib/db";
import { desc, sql } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
  const search = searchParams.get("search") || "";
  const offset = (page - 1) * limit;

  const db = await getDb();
  const conditions = [];
  if (search) {
    conditions.push(
      sql`(${schema.users.phone} ILIKE ${"%" + search + "%"} OR ${schema.users.username} ILIKE ${"%" + search + "%"})`
    );
  }

  const total = await db.select({ count: sql<number>`count(*)` }).from(schema.users)
    .where(conditions.length ? conditions[0] : undefined)
    .then((r: any[]) => Number(r[0]?.count ?? 0));

  const users = await db.select().from(schema.users)
    .where(conditions.length ? conditions[0] : undefined)
    .orderBy(desc(schema.users.createdAt))
    .limit(limit).offset(offset);

  return Response.json({
    items: users.map(u => ({
      id: u.id,
      phone: u.phone,
      username: u.username,
      region: u.region,
      contactWechat: u.contactWechat,
      contactQq: u.contactQq,
      contactDouyin: u.contactDouyin,
      contactEmail: u.contactEmail,
      createdAt: u.createdAt,
      lastActiveAt: u.lastActiveAt,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
