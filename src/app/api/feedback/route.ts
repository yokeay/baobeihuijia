import { getDb, schema } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { apiError } from "@/lib/i18n/api-messages";
import { getUserFromRequest } from "@/lib/user-auth";
import { FEEDBACK_TITLE_MAX, FEEDBACK_CONTENT_MAX } from "@/lib/constants";

// 不用登录：任何人都能提交反馈，登录了就把身份一并记下来方便后台回访。
export async function POST(request: Request) {
  const body = await request.json();
  const { title, content } = body;

  if (!title?.trim() || !content?.trim()) {
    return apiError(request, "feedbackFieldsRequired", 400);
  }
  if (title.trim().length > FEEDBACK_TITLE_MAX) {
    return apiError(request, "feedbackTitleTooLong", 400);
  }
  if (content.trim().length > FEEDBACK_CONTENT_MAX) {
    return apiError(request, "feedbackTooLong", 400);
  }

  const user = await getUserFromRequest(request);
  const db = await getDb();
  const id = uuidv4();

  await db.insert(schema.feedback).values({
    id,
    title: title.trim(),
    content: content.trim(),
    userId: user?.id || null,
    userName: user?.username || null,
  });

  return Response.json({ id }, { status: 201 });
}
