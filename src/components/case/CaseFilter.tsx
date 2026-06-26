"use client";

import { GENDERS } from "@/lib/constants";
import { RegionCascader } from "@/components/shared/RegionCascader";

interface CaseFilterProps {
  province: string;
  city: string;
  district: string;
  gender: string;
  onProvinceChange: (v: string) => void;
  onCityChange: (v: string) => void;
  onDistrictChange: (v: string) => void;
  onGenderChange: (v: string) => void;
}

export function CaseFilter({
  province,
  city,
  district,
  gender,
  onProvinceChange,
  onCityChange,
  onDistrictChange,
  onGenderChange,
}: CaseFilterProps) {
  const hasFilter = province || city || district || gender;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <div className="flex-1 min-w-0">
        <RegionCascader
          province={province}
          city={city}
          district={district}
          onProvinceChange={onProvinceChange}
          onCityChange={onCityChange}
          onDistrictChange={onDistrictChange}
        />
      </div>

      <select
        value={gender}
        onChange={(e) => onGenderChange(e.target.value)}
        className="px-3.5 py-2 text-[13px] border border-black/10 dark:border-white/10 rounded-xl bg-white dark:bg-[#1a1a1a] text-[#1c1c1e]/60 dark:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#c5705a]/20 transition-all duration-200"
      >
        {GENDERS.map((g) => (
          <option key={g.value} value={g.value}>
            {g.label}
          </option>
        ))}
      </select>

      {hasFilter && (
        <button
          onClick={() => {
            onProvinceChange("");
            onCityChange("");
            onDistrictChange("");
            onGenderChange("");
          }}
          className="px-3.5 py-2 text-[12px] text-[#1c1c1e]/40 dark:text-white/30 hover:text-[#1c1c1e]/60 dark:hover:text-white/50 transition-colors"
        >
          清除
        </button>
      )}
    </div>
  );
}
