import { getDb, schema } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function logActivity(params: {
  userId: string;
  username: string;
  action: string;
  target?: string;
  targetId?: string;
  detail?: string;
}) {
  try {
    const db = await getDb();
    await db.insert(schema.userActivities).values({
      id: uuidv4(),
      userId: params.userId,
      username: params.username,
      action: params.action,
      target: params.target ?? null,
      targetId: params.targetId ?? null,
      detail: params.detail ?? null,
    });
  } catch {
    // non-critical, don't break main flow
    console.error("[activity] failed to log:", params.action);
  }
}
