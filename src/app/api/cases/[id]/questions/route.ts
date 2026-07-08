import { getDb, schema } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { getUserFromRequest } from "@/lib/user-auth";
import { v4 as uuidv4 } from "uuid";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await getDb();
  const rows = await db.select().from(schema.questions)
    .where(and(eq(schema.questions.caseId, id), eq(schema.questions.status, "approved")))
    .orderBy(desc(schema.questions.createdAt)).limit(50);
  return Response.json({ items: rows });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { content } = body;
  if (!content?.trim()) return Response.json({ error: "疑问内容不能为空" }, { status: 400 });
  if (content.length > 500) return Response.json({ error: "疑问内容不能超过500字" }, { status: 400 });

  const session = await getUserFromRequest(request);
  const db = await getDb();
  await db.insert(schema.questions).values({
    id: uuidv4(),
    caseId: id,
    userId: session?.id ?? null,
    content: content.trim(),
    submitterName: session?.username ?? null,
    status: "pending",
  });
  return Response.json({ ok: true }, { status: 201 });
}
