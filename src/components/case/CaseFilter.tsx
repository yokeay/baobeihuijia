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
    <div className="flex flex-wrap items-end gap-2 mb-6">
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
        className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
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
          className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
        >
          清除筛选
        </button>
      )}
    </div>
  );
}
