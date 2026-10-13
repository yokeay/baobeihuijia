import type { Lang } from "./public-context";

/**
 * The ten UI languages the site ships, as hreflang variants. The site keeps a
 * single URL per page (language is client-side state), so every language
 * other than the default maps to the same URL with ?lang=<code>, which the
 * client applies on load (see public-context.tsx). zh-CN is the default and
 * keeps the plain URL; x-default points at it as well.
 */
export const HREFLANG_VARIANTS: { code: string; lang: Lang }[] = [
  { code: "zh-CN", lang: "zh" },
  { code: "zh-Hant", lang: "zh-Hant" },
  { code: "en", lang: "en" },
  { code: "ja", lang: "ja" },
  { code: "ko", lang: "ko" },
  { code: "fr", lang: "fr" },
  { code: "de", lang: "de" },
  { code: "ug", lang: "ug" },
  { code: "mn", lang: "mn" },
  { code: "bo", lang: "bo" },
];

/** The same page in the given UI language. */
export function variantUrl(url: string, code: string): string {
  return code === "zh-CN" ? url : `${url}?lang=${encodeURIComponent(code)}`;
}

/**
 * `alternates.languages` for Next metadata (homepage + every case page):
 * all ten languages plus x-default.
 */
export function languageAlternates(url: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const variant of HREFLANG_VARIANTS) {
    languages[variant.code] = variantUrl(url, variant.code);
  }
  languages["x-default"] = url;
  return languages;
}

/** Normalize a ?lang= query value (e.g. "zh-CN", "zh-hant") to a UI Lang. */
export function langFromQuery(value: string | null): Lang | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  const variant = HREFLANG_VARIANTS.find(
    (item) =>
      item.code.toLowerCase() === normalized || item.lang.toLowerCase() === normalized
  );
  return variant ? variant.lang : null;
}
