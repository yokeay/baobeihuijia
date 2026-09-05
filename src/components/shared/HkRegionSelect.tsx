"use client";

import { HK_REGIONS } from "@/lib/regions/hongkong";
import { usePublicLang } from "@/lib/i18n/public-context";

// HK cases are stored with lostProvince="香港" and lostCity=<region name>
// (see src/lib/sync/hongkong.ts), so this selector maps to the "city" field.
interface HkRegionSelectProps {
  city: string;
  onCityChange: (name: string) => void;
  rightSlot?: React.ReactNode;
}

const selectClass =
  "w-full h-10 px-3 text-[13px] border border-black/10 dark:border-white/10 rounded-xl bg-white dark:bg-[#1a1a1a] text-[#1c1c1e] dark:text-[#e8e8e8] focus:outline-none focus:ring-2 focus:ring-[#c5705a]/20 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 appearance-none";
const labelClass = "block text-[12px] font-medium text-[#1c1c1e]/40 dark:text-white/30 mb-1";

export function HkRegionSelect({ city, onCityChange, rightSlot }: HkRegionSelectProps) {
  const { t } = usePublicLang();

  const gridClass = rightSlot
    ? "grid grid-cols-1 sm:grid-cols-2 gap-2"
    : "grid grid-cols-1 gap-2";

  return (
    <div className={gridClass}>
      <div>
        <label className={labelClass}>{t.filter.cityLabel}</label>
        <select
          className={selectClass}
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
        >
          <option value="">{t.filter.selectCity}</option>
          {HK_REGIONS.map(({ code, name }) => (
            <option key={code} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
      {rightSlot}
    </div>
  );
}
