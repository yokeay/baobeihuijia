import type { PublicTranslations } from "./zh";

/**
 * Compact a count for a card badge. Chinese compacts at 10k (万); every other
 * language uses thousands, signalled by an empty `wan` string.
 */
export function formatCount(n: number, wan: string): string {
  const trim = (v: number) => v.toFixed(1).replace(/\.0$/, "");
  if (n >= 10000) return trim(n / (wan ? 10000 : 1000)) + (wan || "k");
  if (n >= 1000) return trim(n / 1000) + "k";
  return String(n);
}

/** Fill `{name}` placeholders in a translated template. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ""));
}

/** Gender is stored as 男/女 across every country table, so it is translated
 *  at display time rather than at the source. Unknown values pass through. */
export function genderLabel(gender: unknown, t: PublicTranslations): string {
  const g = String(gender ?? "").toLowerCase();
  if (g === "男" || g === "male") return t.case.genderMale;
  if (g === "女" || g === "female") return t.case.genderFemale;
  return String(gender ?? "");
}

const XML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

/**
 * "No photo" artwork for a case without images. Built as a data URI rather than
 * a static file so the caption follows the reader's language.
 */
export function photoPlaceholder(label: string): string {
  const safe = label.replace(/[&<>"']/g, (c) => XML_ESCAPES[c]);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">` +
    `<rect fill="#f3f4f6" width="400" height="300"/>` +
    `<text fill="#9ca3af" font-family="sans-serif" font-size="16" text-anchor="middle" x="200" y="155">${safe}</text>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
