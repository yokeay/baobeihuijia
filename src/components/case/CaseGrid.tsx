import { CaseCard, CaseCardSkeleton } from "./CaseCard";

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
}

export function CaseGrid({ items, loading }: CaseGridProps) {
  if (loading) {
    return (
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <CaseCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-6xl mb-4">🔍</p>
        <p className="text-gray-400 text-lg">暂无数据</p>
        <p className="text-gray-300 text-sm mt-1">换个筛选条件试试</p>
      </div>
    );
  }

  return (
    <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
      {items.map((item) => (
        <CaseCard key={item.id} item={item} />
      ))}
    </div>
  );
}
