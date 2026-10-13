import { firstPhotoUrl } from "@/lib/db/find-case";

// Site origin used for every absolute share/metadata URL (mirrors the constant
// in src/app/layout.tsx and the case page).
export const SITE_ORIGIN = "https://wohaoxiangni.com";

/**
 * Absolute image URL to advertise in a case's share metadata.
 *
 * - An absolute upstream photo is returned as-is (hotlinked, unchanged) — that
 *   covers mainland `cases` and US NamUs, which keep working without routing
 *   their traffic through this server.
 * - Everything else — no photo, or an app-relative relay URL (`/api/image/...`
 *   used by Korea's 안전Dream and Spain's CNDES) — points at the generated card
 *   route. A crawler cannot use a relative URL, and the relay may answer 404
 *   for a dead photo (Korea's older records), so the card re-checks the photo
 *   server-side and falls back to a text-only brand card when there is none.
 */
export function caseShareImageUrl(c: { id: string; photoUrls?: string | null }): string {
  const photo = firstPhotoUrl(c.photoUrls);
  if (photo && /^https?:\/\//i.test(photo)) return photo;
  return `${SITE_ORIGIN}/api/og/case/${encodeURIComponent(c.id)}`;
}
