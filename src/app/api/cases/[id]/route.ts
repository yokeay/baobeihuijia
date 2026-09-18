import { findCaseById } from "@/lib/db/find-case";
import { apiError } from "@/lib/i18n/api-messages";

// IDs are UUIDs, globally unique, so we can look them up without knowing the country upfront.

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const record = await findCaseById(id);
  if (!record) {
    return apiError(request, "caseNotFound", 404);
  }
  return Response.json(record);
}
