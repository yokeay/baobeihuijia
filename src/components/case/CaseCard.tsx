"use client";
import Link from "next/link";
import { useState } from "react";
import { usePublicLang } from "@/lib/i18n/public-context";
import { formatCount, fmt, photoPlaceholder } from "@/lib/i18n/public/format";
import type { PublicTranslations } from "@/lib/i18n/public/zh";

/** Shape the card actually reads. Rows come from several country tables, so
 *  everything beyond id/name/photoUrls is treated as optional. */
export interface CaseCardItem {
  id: string;
  name: string;
  photoUrls?: string | null;
  lostDate?: string | null;
  lostProvince?: string | null;
  lostCity?: string | null;
  age?: number | null;
  status?: string | null;
  missingCountry?: string | null;
  viewCount?: number | null;
  followCount?: number | null;
}

function getLostDuration(lostDate: string | null | undefined, t: PublicTranslations): string {
  if (!lostDate) return "";
  const lost = new Date(lostDate);
  const now = new Date();
  const days = Math.floor((now.getTime() - lost.getTime()) / 86400000);
  if (days < 1) return t.time.today;
  if (days < 30) return fmt(t.time.days, { n: days });
  const years = Math.floor(days / 365);
  const remainDays = days - years * 365;
  if (years === 0) return fmt(t.time.months, { n: Math.floor(days / 30) });
  return fmt(t.time.years, { n: years, m: remainDays });
}

function getEstimatedAge(age: number | null | undefined, lostDate: string | null | undefined, t: PublicTranslations): string {
  if (!age) return "";
  if (!lostDate) return fmt(t.time.ageOnly, { n: age });
  const lost = new Date(lostDate);
  const now = new Date();
  const yearsPassed = Math.floor((now.getTime() - lost.getTime()) / (365.25 * 86400000));
  const current = age + yearsPassed;
  if (yearsPassed <= 0) return fmt(t.time.ageOnly, { n: age });
  return fmt(t.time.ageThenNow, { n: age, m: current });
}

// Shape of the thumbnails the sources serve (mainland's are uniformly 240×300).
const NOMINAL_RATIO = 0.8;

// A card's shape follows its photo, but it must not follow it *exactly*: the
// mainland source hands out one thumbnail size for every case and photo-less
// rows all fall back to the same 4:3 placeholder, so inheriting the photo's
// proportions verbatim flattened those two feeds into a grid of identical
// cards — while Hong Kong's mixed police photos stayed happily ragged. Every
// card therefore takes a deterministic squeeze on top of its photo's real
// proportions: framing is preserved, but no two rows line up.
const RATIO_SPREAD = [1, 0.88, 1.12, 0.94, 1.06, 0.85, 1.18, 0.91, 1.09, 0.97];

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function spreadFor(id: string): number {
  return RATIO_SPREAD[hashId(id) % RATIO_SPREAD.length];
}

// Clamp so a freak panorama or sliver can't wreck the column.
function clampRatio(r: number): number {
  return Math.min(Math.max(r, 0.55), 1.5);
}

export function CaseCard({ item, index = 0 }: { item: CaseCardItem; index?: number }) {
  const { t } = usePublicLang();
  const photos: string[] = (() => {
    try {
      const arr = JSON.parse(item.photoUrls || "[]");
      if (Array.isArray(arr)) return arr.filter((u: unknown) => typeof u === "string" && u.length > 0);
    } catch { }
    return [];
  })();
  const key = String(item.id ?? index);
  const hasPhoto = photos.length > 0;
  const firstPhoto = hasPhoto ? photos[0] : photoPlaceholder(t.case.noPhoto);

  // First paint guesses the nominal thumbnail so the columns barely move when
  // the real image reports its size.
  const [ratio, setRatio] = useState(() => clampRatio(NOMINAL_RATIO * spreadFor(key)));

  const duration = getLostDuration(item.lostDate, t);
  const ageText = getEstimatedAge(item.age, item.lostDate, t);
  const isFound = item.status === "found";
  const isOverseas = item.missingCountry && item.missingCountry !== "CN";
  const location = (() => {
    if (isOverseas) return t.case.unknown;
    const loc = [item.lostProvince, item.lostCity].filter(Boolean).join(" ");
    return loc || t.case.unknown;
  })();

  return (
    <Link href={`/case/${item.id}`} className="block group">
      <div className="card-base overflow-hidden cursor-pointer">
        <div className="relative overflow-hidden bg-[#e8f0f3]" style={{ aspectRatio: String(ratio) }}>
          <img
            src={firstPhoto}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            loading="lazy"
            decoding="async"
            onLoad={(e) => {
              // A card with no photo keeps the seeded shape: the placeholder is
              // a fixed 4:3, and adopting it would make every empty card equal.
              if (!hasPhoto) return;
              const el = e.currentTarget;
              if (el.naturalWidth > 0 && el.naturalHeight > 0) {
                setRatio(clampRatio((el.naturalWidth / el.naturalHeight) * spreadFor(key)));
              }
            }}
          />
          {isFound && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(20, 61, 38, 0.6)" }}>
              <span className="text-white text-sm font-semibold px-3 py-1 rounded-full" style={{ background: "var(--success)" }}>{t.case.statusFound}</span>
            </div>
          )}
          {!isFound && duration && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent px-2.5 pt-6 pb-2">
              <span className="text-white text-[11px] tracking-wide opacity-95">{duration}</span>
            </div>
          )}
        </div>
        <div className="px-3 py-2.5">
          <h3 className="font-semibold text-[14px] leading-snug truncate" style={{ color: "var(--text-primary)" }}>
            {item.name}
          </h3>
          {ageText && (
            <p className="text-[11.5px] mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>{ageText}</p>
          )}
          <p className="text-[11.5px] mt-0.5 truncate" style={{ color: "var(--text-tertiary)" }}>{location}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: "var(--text-tertiary)" }}>
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {formatCount(item.viewCount ?? 0, t.number.wan)}
            </span>
            {(item.followCount ?? 0) > 0 && (
              <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>🕯 {item.followCount} {t.case.watchersUnit}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function CaseCardSkeleton({ ratio = 0.75 }: { ratio?: number }) {
  return (
    <div className="card-base overflow-hidden">
      <div className="w-full bg-gray-100 animate-pulse" style={{ aspectRatio: String(ratio) }} />
      <div className="px-3 py-2.5 space-y-2">
        <div className="h-3.5 w-2/3 bg-gray-100 animate-pulse rounded-lg" />
        <div className="h-3 w-1/2 bg-gray-100 animate-pulse rounded-lg" />
        <div className="h-3 w-3/4 bg-gray-100 animate-pulse rounded-lg" />
      </div>
    </div>
  );
}
