import { getDb, schema } from "@/lib/db";
import { eq, desc, sql, ilike, or, and } from "drizzle-orm";
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
  const search = searchParams.get("search")?.trim() || "";

  const db = await getDb();

  const conditions: any[] = [];
  if (status) conditions.push(eq(schema.clues.status, status));
  if (search) conditions.push(or(
    ilike(schema.clues.content, `%${search}%`),
    ilike(schema.clues.submitterName, `%${search}%`)
  ));
  const whereClause = conditions.length > 0
    ? (conditions.length === 1 ? conditions[0] : and(...conditions))
    : undefined;

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.clues)
    .where(whereClause);

  const total = countRow?.count ?? 0;

  const items = await db
    .select()
    .from(schema.clues)
    .where(whereClause)
    .orderBy(desc(schema.clues.createdAt))
    .limit(limit)
    .offset(offset);

  // Fetch associated case names
  const caseIds = [...new Set(items.map((c: any) => c.caseId as string))];
  const caseMap = new Map<string, any>();
  if (caseIds.length > 0) {
    const cases = await db
      .select()
      .from(schema.cases)
      .where(sql`${schema.cases.id} = ANY(ARRAY[${sql.join(caseIds.map(id => sql`${id}`), sql`, `)}])`);
    for (const c of cases) {
      caseMap.set(c.id, c);
    }
  }

  // If searching, also match against case names — filter results
  let enriched = items.map((clue: any) => ({
    ...clue,
    caseName: caseMap.get(clue.caseId)?.name || "(已删除)",
    caseData: caseMap.get(clue.caseId) || null,
  }));

  if (search) {
    enriched = enriched.filter((c: any) =>
      c.caseName.toLowerCase().includes(search.toLowerCase()) ||
      (c.content && c.content.toLowerCase().includes(search.toLowerCase())) ||
      (c.submitterName && c.submitterName.toLowerCase().includes(search.toLowerCase()))
    );
  }

  return Response.json({ items: enriched, total, page, limit, totalPages: Math.ceil(total / limit) });
}
