import { syncNamus } from "@/lib/sync/namus";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { maxStates, dryRun } = body;

  const stats = await syncNamus({
    maxStates: maxStates ?? undefined,
    dryRun: dryRun ?? false,
  });

  return Response.json(stats);
}

export async function GET() {
  const stats = await syncNamus({ dryRun: true });
  return Response.json({ message: "Dry run complete", ...stats });
}
