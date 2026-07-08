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
  try {
    await db.insert(schema.caseViews).values({ id: uuidv4(), caseId: id, fingerprint });
    await db.update(schema.cases).set({ viewCount: sql`view_count + 1` }).where(eq(schema.cases.id, id));
  } catch {
    // unique constraint: already counted
  }
  return Response.json({ ok: true });
}
