"use client";

import { usePublicLang } from "@/lib/i18n/public-context";

// For countries without structured region data, the filter panel falls back
// to a free-text location keyword input instead of a fake cascader.
interface FreeTextLocationProps {
  value: string;
  onChange: (v: string) => void;
  rightSlot?: React.ReactNode;
}

const inputClass =
  "w-full h-10 px-3 text-[13px] border border-black/10 dark:border-white/10 rounded-xl bg-white dark:bg-[#1a1a1a] text-[#1c1c1e] dark:text-[#e8e8e8] placeholder:text-[#1c1c1e]/25 dark:placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#c5705a]/20 transition-all duration-200";
const labelClass = "block text-[12px] font-medium text-[#1c1c1e]/40 dark:text-white/30 mb-1";

export function FreeTextLocation({ value, onChange, rightSlot }: FreeTextLocationProps) {
  const { t } = usePublicLang();

  const gridClass = rightSlot
    ? "grid grid-cols-1 sm:grid-cols-2 gap-2"
    : "grid grid-cols-1 gap-2";

  return (
    <div className={gridClass}>
      <div>
        <label className={labelClass}>{t.filter.locationLabel}</label>
        <input
          type="text"
          className={inputClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t.filter.locationPlaceholder}
        />
      </div>
      {rightSlot}
    </div>
  );
}
