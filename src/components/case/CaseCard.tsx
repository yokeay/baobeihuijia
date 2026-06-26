"use client";

import Link from "next/link";

interface CaseItem {
  id: string;
  name: string;
  gender: string | null;
  lostDate: string | null;
  lostProvince: string | null;
  lostCity: string | null;
  photoUrls: string;
  height: number | null;
}

export function CaseCard({ item }: { item: CaseItem }) {
  const photos: string[] = (() => {
    try {
      const arr = JSON.parse(item.photoUrls || "[]");
      if (Array.isArray(arr)) return arr.filter((u: unknown) => typeof u === "string" && u.length > 0);
    } catch { /* ignore */ }
    return [];
  })();
  const firstPhoto = photos[0] || "/placeholder.svg";

  return (
    <Link
      href={`/case/${item.id}`}
      className="block group"
    >
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#1a1a1a] border border-black/5 dark:border-white/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20">
        <div className="relative overflow-hidden">
          <img
            src={firstPhoto}
            alt={item.name}
            className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>
        <div className="p-3.5">
          <h3 className="font-semibold text-[14px] text-[#1c1c1e] dark:text-[#e8e8e8] truncate tracking-tight">
            {item.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 text-[12px] text-[#1c1c1e]/40 dark:text-white/30">
            {item.gender && <span>{item.gender}</span>}
            {item.height && <span>{item.height}cm</span>}
          </div>
          <div className="flex items-center gap-1 mt-0.5 text-[12px] text-[#1c1c1e]/30 dark:text-white/20 truncate">
            {[item.lostProvince, item.lostCity].filter(Boolean).join(" ")}
            {item.lostDate && <span>· {item.lostDate}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function CaseCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white dark:bg-[#1a1a1a] border border-black/5 dark:border-white/5 overflow-hidden">
      <div className="w-full aspect-[3/4] bg-black/5 dark:bg-white/5 animate-pulse" />
      <div className="p-3.5 space-y-2">
        <div className="h-4 w-2/3 bg-black/5 dark:bg-white/5 animate-pulse rounded-md" />
        <div className="h-3 w-1/2 bg-black/5 dark:bg-white/5 animate-pulse rounded-md" />
        <div className="h-3 w-3/4 bg-black/5 dark:bg-white/5 animate-pulse rounded-md" />
      </div>
    </div>
  );
}
