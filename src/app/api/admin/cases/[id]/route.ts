import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getAdminFromCookies } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromCookies();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = await getDb();
  const rows = await db.select().from(schema.cases).where(eq(schema.cases.id, id)).limit(1);

  if (rows.length === 0) {
    return Response.json({ error: "Case not found" }, { status: 404 });
  }

  return Response.json(rows[0]);
}

const EDITABLE_FIELDS = [
  "name", "gender", "birthDate", "lostDate",
  "lostProvince", "lostCity", "lostDistrict", "lostAddress",
  "height", "feature", "submitterName", "submitterContact",
] as const;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromCookies();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const updates: Record<string, unknown> = {};
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No editable fields provided" }, { status: 400 });
  }

  updates.updatedAt = new Date();

  const db = await getDb();
  await db.update(schema.cases).set(updates).where(eq(schema.cases.id, id));

  await db.insert(schema.auditLogs).values({
    id: uuidv4(),
    adminId: admin.id,
    adminUsername: admin.username,
    action: "edit",
    targetType: "case",
    targetId: id,
    detail: JSON.stringify({ fields: Object.keys(updates).filter((k) => k !== "updatedAt") }),
    createdAt: new Date(),
  });

  const rows = await db.select().from(schema.cases).where(eq(schema.cases.id, id)).limit(1);
  return Response.json(rows[0]);
}
