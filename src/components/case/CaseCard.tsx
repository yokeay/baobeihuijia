"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

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
  const photos: string[] = JSON.parse(item.photoUrls || "[]");
  const firstPhoto = photos[0] || "/placeholder.svg";

  return (
    <Link
      href={`/case/${item.id}`}
      className="block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow break-inside-avoid mb-4 group"
    >
      <div className="relative overflow-hidden">
        <img
          src={firstPhoto}
          alt={item.name}
          className="w-full object-cover aspect-[3/4] group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm text-gray-900 truncate">{item.name}</h3>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
          {item.gender && <span>{item.gender}</span>}
          {item.height && <span>{item.height}cm</span>}
        </div>
        <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
          {(item.lostProvince || item.lostCity) && (
            <span className="truncate">
              {[item.lostProvince, item.lostCity].filter(Boolean).join(" ")}
            </span>
          )}
          {item.lostDate && (
            <>
              <span>·</span>
              <span>{item.lostDate}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

export function CaseCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm break-inside-avoid mb-4">
      <div className="w-full aspect-[3/4] bg-gray-200 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-2/3 bg-gray-200 animate-pulse rounded" />
        <div className="h-3 w-1/2 bg-gray-100 animate-pulse rounded" />
        <div className="h-3 w-3/4 bg-gray-100 animate-pulse rounded" />
      </div>
    </div>
  );
}
