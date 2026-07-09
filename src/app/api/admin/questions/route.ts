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

  // Enrich with case names
  const caseIds = [...new Set(items.map((q: any) => q.caseId as string))];
  const caseMap = new Map<string, any>();
  if (caseIds.length > 0) {
    const cases = await db.select().from(schema.cases)
      .where(sql`${schema.cases.id} = ANY(ARRAY[${sql.join(caseIds.map(id => sql`${id}`), sql`, `)}])`);
    for (const c of cases) caseMap.set(c.id, c);
  }

  const enriched = items.map((item: any) => ({
    ...item,
    caseName: caseMap.get(item.caseId)?.name || "(已删除)",
    caseData: caseMap.get(item.caseId) || null,
  }));

  return Response.json({ items: enriched, total, page, totalPages: Math.ceil(total / limit) });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, status, reviewedBy } = body;
  if (!id || !status) return Response.json({ error: "缺少参数" }, { status: 400 });

  const db = await getDb();
  await db.update(schema.questions).set({ status }).where(eq(schema.questions.id, id));
  return Response.json({ ok: true });
}
