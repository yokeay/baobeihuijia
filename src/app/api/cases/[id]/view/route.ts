import { getDb, schema } from "@/lib/db";
import { eq, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const ua = request.headers.get("user-agent") ?? "";
  const fingerprint = crypto.createHash("md5").update(ip + ua).digest("hex");

  const db = await getDb();
  // Try to record unique view (fingerprint may already exist, that's ok)
  try {
    await db.insert(schema.caseViews).values({ id: uuidv4(), caseId: id, fingerprint });
  } catch {
    // duplicate fingerprint, ignore
  }
  // Always increment view count
  await db.update(schema.cases).set({ viewCount: sql`view_count + 1` }).where(eq(schema.cases.id, id));
  return Response.json({ ok: true });
}
