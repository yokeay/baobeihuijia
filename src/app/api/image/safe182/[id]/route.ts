import { fetchSafe182Image } from "@/lib/safe182-image";

// Face photos from Korea's 안전Dream cannot be hotlinked straight from the
// source (see src/lib/safe182-image.ts), so they are relayed through the app
// and cached at the edge. Nothing is written to disk — the platform stays
// hotlink-only, this just re-hosts the origin on a URL that works.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const image = await fetchSafe182Image(id);

  if (!image) {
    // Short-lived so a bad session at the source does not pin a broken face.
    return new Response("Not found", {
      status: 404,
      headers: { "Cache-Control": "public, max-age=300" },
    });
  }

  return new Response(new Uint8Array(image.body), {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "public, max-age=604800, s-maxage=2592000, immutable",
    },
  });
}
