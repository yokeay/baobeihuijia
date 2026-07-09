import { getDb, schema } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import { getUserFromRequest } from "@/lib/user-auth";
import { logActivity } from "@/lib/activity-log";
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

  // Get case name for activity log
  const caseRow = await db.select({ name: schema.cases.name }).from(schema.cases).where(eq(schema.cases.id, id)).limit(1).then((r: any[]) => r[0] ?? null);
  const caseName = caseRow?.name ?? id;

  if (existing) {
    // 取关
    await db.delete(schema.follows).where(eq(schema.follows.id, existing.id));
    await db.update(schema.cases).set({ followCount: sql`follow_count - 1` }).where(eq(schema.cases.id, id));
    logActivity({ userId: session.id, username: session.username, action: "unfollow", target: caseName, targetId: id });
    return Response.json({ following: false });
  } else {
    // 关注
    await db.insert(schema.follows).values({ id: uuidv4(), userId: session.id, caseId: id });
    await db.update(schema.cases).set({ followCount: sql`follow_count + 1` }).where(eq(schema.cases.id, id));
    logActivity({ userId: session.id, username: session.username, action: "follow", target: caseName, targetId: id });
    return Response.json({ following: true });
  }
}
