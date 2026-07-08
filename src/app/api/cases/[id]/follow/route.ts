import { getDb, schema } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import { getUserFromRequest } from "@/lib/user-auth";
import { v4 as uuidv4 } from "uuid";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getUserFromRequest(request);
  if (!session) return Response.json({ following: false });

  const db = await getDb();
  const row = await db.select().from(schema.follows)
    .where(and(eq(schema.follows.userId, session.id), eq(schema.follows.caseId, id)))
    .limit(1).then((r: any[]) => r[0] ?? null);

  return Response.json({ following: !!row });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getUserFromRequest(request);
  if (!session) return Response.json({ error: "未登录" }, { status: 401 });

  const db = await getDb();
  const existing = await db.select().from(schema.follows)
    .where(and(eq(schema.follows.userId, session.id), eq(schema.follows.caseId, id)))
    .limit(1).then((r: any[]) => r[0] ?? null);

  if (existing) {
    // 取关
    await db.delete(schema.follows).where(eq(schema.follows.id, existing.id));
    await db.update(schema.cases).set({ followCount: sql`follow_count - 1` }).where(eq(schema.cases.id, id));
    return Response.json({ following: false });
  } else {
    // 关注
    await db.insert(schema.follows).values({ id: uuidv4(), userId: session.id, caseId: id });
    await db.update(schema.cases).set({ followCount: sql`follow_count + 1` }).where(eq(schema.cases.id, id));
    return Response.json({ following: true });
  }
}
