import { getDb, schema } from "@/lib/db";
import { eq, desc, sql } from "drizzle-orm";
import { getAdminFromCookies } from "@/lib/auth";

export async function GET(request: Request) {
  const admin = await getAdminFromCookies();
  if (!admin) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "";
  const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
  const offset = (page - 1) * limit;

  const db = await getDb();
  const where = status ? eq(schema.feedback.status, status) : undefined;

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.feedback)
    .where(where);
  const total = countRow?.count ?? 0;

  const items = await db
    .select()
    .from(schema.feedback)
    .where(where)
    .orderBy(desc(schema.feedback.createdAt))
    .limit(limit)
    .offset(offset);

  return Response.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
}

export async function PATCH(request: Request) {
  const admin = await getAdminFromCookies();
  if (!admin) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  const body = await request.json();
  const { id, status } = body;
  if (!id || !status) {
    return Response.json({ error: "缺少参数" }, { status: 400 });
  }

  const db = await getDb();
  await db.update(schema.feedback).set({ status }).where(eq(schema.feedback.id, id));
  return Response.json({ ok: true });
}
