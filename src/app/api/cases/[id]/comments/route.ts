import { getDb, schema } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { apiError } from "@/lib/i18n/api-messages";

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
    return apiError(request, "commentFieldsRequired", 400);
  }
  if (content.length > 500) {
    return apiError(request, "commentTooLong", 400);
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
