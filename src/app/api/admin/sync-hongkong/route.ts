import { syncHongKong } from "@/lib/sync/hongkong";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { dryRun } = body;

  const stats = await syncHongKong({ dryRun: dryRun ?? false });

  return Response.json(stats);
}

export async function GET() {
  const stats = await syncHongKong({ dryRun: true });
  return Response.json({ message: "Dry run complete", ...stats });
}
