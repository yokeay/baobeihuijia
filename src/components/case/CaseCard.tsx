"use client";
import Link from "next/link";
import { useState } from "react";

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

function getLostDuration(lostDate: string | null | undefined): string {
  if (!lostDate) return "";
  const lost = new Date(lostDate);
  const now = new Date();
  const days = Math.floor((now.getTime() - lost.getTime()) / 86400000);
  if (days < 1) return "今日失踪";
  if (days < 30) return `已失踪 ${days} 天`;
  const years = Math.floor(days / 365);
  const remainDays = days - years * 365;
  if (years === 0) return `已失踪 ${Math.floor(days / 30)} 个月`;
  return `已失踪 ${years} 年 ${remainDays} 天`;
}

function getEstimatedAge(age: number | null | undefined, lostDate: string | null | undefined): string {
  if (!age) return "";
  if (!lostDate) return `${age} 岁`;
  const lost = new Date(lostDate);
  const now = new Date();
  const yearsPassed = Math.floor((now.getTime() - lost.getTime()) / (365.25 * 86400000));
  const current = age + yearsPassed;
  if (yearsPassed <= 0) return `${age} 岁`;
  return `失踪时 ${age} 岁，现约 ${current} 岁`;
}

function formatCount(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, "") + "万";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

// Placeholder ratios before the real image reports its dimensions. Keyed off the
// case id rather than the list index, so the feed never falls into a visible
// repeating rhythm the way a fixed short cycle does.
const SEED_RATIOS = [0.75, 0.8, 1, 0.71, 0.67, 1.33, 0.83, 0.6, 0.9, 1.15, 0.7, 1.25];

function seedRatio(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return SEED_RATIOS[h % SEED_RATIOS.length];
}

export function CaseCard({ item, index = 0 }: { item: CaseCardItem; index?: number }) {
  const photos: string[] = (() => {
    try {
      const arr = JSON.parse(item.photoUrls || "[]");
      if (Array.isArray(arr)) return arr.filter((u: unknown) => typeof u === "string" && u.length > 0);
    } catch { }
    return [];
  })();
  const firstPhoto = photos[0] || "/placeholder.svg";

  // Start from the seeded ratio, then settle on the photo's real proportions —
  // that is what makes the columns genuinely ragged instead of patterned.
  const [ratio, setRatio] = useState(() => seedRatio(String(item.id ?? index)));

  const duration = getLostDuration(item.lostDate);
  const ageText = getEstimatedAge(item.age, item.lostDate);
  const isFound = item.status === "found";
  const isOverseas = item.missingCountry && item.missingCountry !== "CN";
  const location = (() => {
    if (isOverseas) return "Unknown Address";
    const loc = [item.lostProvince, item.lostCity].filter(Boolean).join(" ");
    return loc || "未知身份";
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
              const el = e.currentTarget;
              if (el.naturalWidth > 0 && el.naturalHeight > 0) {
                // Clamp so a freak panorama or sliver can't wreck the column.
                const r = el.naturalWidth / el.naturalHeight;
                setRatio(Math.min(Math.max(r, 0.55), 1.5));
              }
            }}
          />
          {isFound && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(20, 61, 38, 0.6)" }}>
              <span className="text-white text-sm font-semibold px-3 py-1 rounded-full" style={{ background: "var(--success)" }}>❤️ 已团聚</span>
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
              {formatCount(item.viewCount ?? 0)}
            </span>
            {(item.followCount ?? 0) > 0 && (
              <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>🕯 {item.followCount} 守候</span>
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
