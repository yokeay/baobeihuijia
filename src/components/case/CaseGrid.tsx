"use client";

import { CaseCard, CaseCardSkeleton } from "./CaseCard";
import { usePublicLang } from "@/lib/i18n/public-context";

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

interface CaseGridProps {
  items: CaseItem[];
  loading?: boolean;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

// Two columns on phones (the Xiaohongshu/Douyin shape), widening with the
// viewport. Gutters stay tight so the wall of faces reads as one feed.
const COLUMN_CLASS = "columns-2 md:columns-3 xl:columns-4 gap-2.5 sm:gap-3.5 [column-fill:_balance]";

// Deterministic per-card bottom gap so the rows never line up into a grid.
const GAPS = ["mb-2.5", "mb-4", "mb-3", "mb-5", "mb-3.5", "mb-2.5"];

function gapFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 33 + id.charCodeAt(i)) >>> 0;
  return GAPS[h % GAPS.length];
}

const SKELETON_RATIOS = [0.75, 1, 0.67, 0.83, 1.2, 0.7, 0.9, 0.6, 1.1, 0.8];

export function CaseGrid({ items, loading, hasMore, loadingMore, onLoadMore }: CaseGridProps) {
  const { t } = usePublicLang();

  if (loading) {
    return (
      <div className={COLUMN_CLASS}>
        {SKELETON_RATIOS.map((r, i) => (
          <div key={i} className="mb-3 break-inside-avoid">
            <CaseCardSkeleton ratio={r} />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="text-5xl mb-4 opacity-30">—</div>
        <p className="text-[14px] text-[#1c1c1e]/40 dark:text-white/30">{t.grid.empty}</p>
        <p className="text-[12px] text-[#1c1c1e]/25 dark:text-white/15 mt-1">{t.grid.emptyHint}</p>
      </div>
    );
  }

  return (
    <div>
      <div className={COLUMN_CLASS}>
        {items.map((item, i) => (
          <div
            key={item.id}
            className={`${gapFor(item.id)} break-inside-avoid card-enter`}
            // Stagger only within the first couple of screens; later cards
            // appear immediately so pagination never feels laggy.
            style={{ animationDelay: `${Math.min(i, 11) * 45}ms` }}
          >
            <CaseCard item={item} index={i} />
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 text-center">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="px-6 py-2.5 text-[13px] font-medium rounded-xl border border-black/10 dark:border-white/10 text-[#1c1c1e]/60 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200 disabled:opacity-40"
          >
            {loadingMore ? t.grid.loadingMore : t.grid.loadMore}
          </button>
        </div>
      )}
    </div>
  );
}
