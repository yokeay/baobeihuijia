import { createHash } from "crypto";

const ORIGIN = "https://www.safe182.go.kr";
const INDEX_URL = `${ORIGIN}/index.do`;
const IMAGE_URL = `${ORIGIN}/home/lcm/blobImgView.do`;
const USER_AGENT = "Baobeihuijia/1.0 (public-service; https://baobeihuijia.org)";

const REQUEST_TIMEOUT_MS = 10000;
const SESSION_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

// safe182 runs behind a load balancer whose two backends do not share the blob
// store: a session pinned to the wrong node answers every photo request with
// this 2860-byte police-emblem graphic instead of the face. There is no header
// or status code to tell it apart from a real photo, so the bytes have to be
// recognised. Photos that *are* missing are already filtered out upstream in
// the sync (the list markup tells us), so a placeholder here always means a bad
// session — rotate and retry rather than serve the emblem as a face.
const NO_IMAGE_SHA256 = "a2469b43aa0fe733b57838846bb829e402e39ddc11133abe4afe4fc5a0daf5bb";

let session: { cookie: string; expiresAt: number } | null = null;

export interface Safe182Image {
  body: Buffer;
  contentType: string;
}

function sha256(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

async function openSession(): Promise<string> {
  const res = await fetch(INDEX_URL, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  // Node has no cookie jar, and the node pin lives entirely in JSESSIONIDPT.
  const cookie = res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  if (!cookie) throw new Error("no session cookie");
  return cookie;
}

async function getSession(): Promise<string> {
  if (session && session.expiresAt > Date.now()) return session.cookie;
  const cookie = await openSession();
  session = { cookie, expiresAt: Date.now() + SESSION_TTL_MS };
  return cookie;
}

function dropSession(): void {
  session = null;
}

/** Relays one 안전Dream photo, rotating sessions until the blob node answers. */
export async function fetchSafe182Image(id: string): Promise<Safe182Image | null> {
  if (!/^\d{1,12}$/.test(id)) return null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const cookie = await getSession();
      const res = await fetch(`${IMAGE_URL}?msspsnIdntfccd=${id}`, {
        headers: {
          "User-Agent": USER_AGENT,
          Referer: `${ORIGIN}/home/lcm/lcmMssList.do`,
          Cookie: cookie,
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!res.ok) {
        dropSession();
        continue;
      }

      const body = Buffer.from(await res.arrayBuffer());
      if (body.length < 512 || sha256(body) === NO_IMAGE_SHA256) {
        dropSession();
        continue;
      }

      return {
        body,
        contentType: res.headers.get("content-type") || "image/jpeg",
      };
    } catch {
      dropSession();
    }
  }

  return null;
}
