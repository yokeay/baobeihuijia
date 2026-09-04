"use client";
import Link from "next/link";

// eslint-disable-next-line @typescript-eslint/no-explicit-any

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

export function CaseCard({ item }: { item: any }) {
  const photos: string[] = (() => {
    try {
      const arr = JSON.parse(item.photoUrls || "[]");
      if (Array.isArray(arr)) return arr.filter((u: unknown) => typeof u === "string" && u.length > 0);
    } catch { }
    return [];
  })();
  const firstPhoto = photos[0] || "/placeholder.svg";
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
        <div className="relative overflow-hidden" style={{ aspectRatio: "3/4" }}>
          <img
            src={firstPhoto}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {isFound && (
            <div className="absolute inset-0 bg-green-900/60 flex items-center justify-center">
              <span className="text-white text-sm font-semibold bg-green-600 px-3 py-1 rounded-full">❤️ 已团聚</span>
            </div>
          )}
          {!isFound && duration && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
              <span className="text-white text-xs opacity-90">{duration}</span>
            </div>
          )}
        </div>
        <div className="px-3.5 py-3">
          <h3 className="font-semibold text-[15px] truncate" style={{ color: "var(--text-primary)" }}>
            {item.name}
          </h3>
          {ageText && (
            <p className="text-[12px] mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>{ageText}</p>
          )}
          <p className="text-[12px] mt-0.5 truncate" style={{ color: "var(--text-tertiary)" }}>{location}</p>
          <div className="flex items-center gap-3 mt-2">
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

export function CaseCardSkeleton() {
  return (
    <div className="card-base overflow-hidden">
      <div className="w-full bg-gray-100 animate-pulse" style={{ aspectRatio: "3/4" }} />
      <div className="px-3.5 py-3 space-y-2">
        <div className="h-4 w-2/3 bg-gray-100 animate-pulse rounded-lg" />
        <div className="h-3 w-1/2 bg-gray-100 animate-pulse rounded-lg" />
        <div className="h-3 w-3/4 bg-gray-100 animate-pulse rounded-lg" />
      </div>
    </div>
  );
}
