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

export function CaseGrid({ items, loading, hasMore, loadingMore, onLoadMore }: CaseGridProps) {
  const { t } = usePublicLang();

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <CaseCardSkeleton key={i} />
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <CaseCard key={item.id} item={item} />
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
