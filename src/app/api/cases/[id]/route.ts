import { findCaseById } from "@/lib/db/find-case";

// IDs are UUIDs, globally unique, so we can look them up without knowing the country upfront.

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const record = await findCaseById(id);
  if (!record) {
    return Response.json({ error: "案件不存在" }, { status: 404 });
  }
  return Response.json(record);
}
