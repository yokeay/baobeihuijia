import fs from "fs";
import path from "path";

// CNDES (Spain) photos are inlined as base64 in the listing JSON with no per-id
// upstream URL to hotlink, so the sync decodes them to public/uploads/cndes/.
// That directory is written at runtime, and `next start` only serves public
// assets that existed at build time — so the files are streamed from disk here
// instead, the same way Korea's photos are relayed (see api/image/safe182).
const PHOTO_DIR = path.join(process.cwd(), "public", "uploads", "cndes");

// Filenames are always "<32 hex>.<jpg|png|bmp>"; anything else is rejected so a
// crafted path can never escape PHOTO_DIR.
const NAME_RE = /^[0-9a-f]{32}\.(jpg|png|bmp)$/;
const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  bmp: "image/bmp",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;

  if (!NAME_RE.test(file)) {
    return new Response("Not found", { status: 404 });
  }

  const filepath = path.join(PHOTO_DIR, file);
  let buf: Buffer;
  try {
    buf = fs.readFileSync(filepath);
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const ext = file.slice(file.lastIndexOf(".") + 1);
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=604800, s-maxage=2592000, immutable",
    },
  });
}
