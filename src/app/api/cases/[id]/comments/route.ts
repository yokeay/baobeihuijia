import { getDb, schema } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await getDb();
  const rows = await db
    .select()
    .from(schema.comments)
    .where(and(eq(schema.comments.caseId, id), eq(schema.comments.status, "approved")))
    .orderBy(desc(schema.comments.createdAt))
    .limit(50);

  return Response.json(rows);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { authorName, content } = body;

  if (!authorName?.trim() || !content?.trim()) {
    return Response.json({ error: "昵称和内容不能为空" }, { status: 400 });
  }
  if (content.length > 500) {
    return Response.json({ error: "评论内容不能超过500字" }, { status: 400 });
  }

  const db = await getDb();
  const commentId = uuidv4();
  await db.insert(schema.comments).values({
    id: commentId,
    caseId: id,
    authorName: authorName.trim(),
    content: content.trim(),
    status: "pending",
  });

  return Response.json({ id: commentId }, { status: 201 });
}
