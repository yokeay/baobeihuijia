import { getDb, schema } from "@/lib/db";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
  const status = searchParams.get("status") || "";
  const offset = (page - 1) * limit;

  const db = await getDb();
  const conditions: any[] = [];
  if (status) conditions.push(eq(schema.questions.status, status));

  const where = conditions.length ? conditions[0] : undefined;
  const total = await db.select({ count: sql<number>`count(*)` }).from(schema.questions)
    .where(where).then((r: any[]) => Number(r[0]?.count ?? 0));

  const items = await db.select().from(schema.questions)
    .where(where).orderBy(desc(schema.questions.createdAt)).limit(limit).offset(offset);

  return Response.json({ items, total, page, totalPages: Math.ceil(total / limit) });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, status, reviewedBy } = body;
  if (!id || !status) return Response.json({ error: "缺少参数" }, { status: 400 });

  const db = await getDb();
  await db.update(schema.questions).set({ status }).where(eq(schema.questions.id, id));
  return Response.json({ ok: true });
}
