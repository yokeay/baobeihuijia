"use client";

import { PROVINCES, GENDERS } from "@/lib/constants";

interface CaseFilterProps {
  province: string;
  gender: string;
  onProvinceChange: (v: string) => void;
  onGenderChange: (v: string) => void;
}

export function CaseFilter({ province, gender, onProvinceChange, onGenderChange }: CaseFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <select
        value={province}
        onChange={(e) => onProvinceChange(e.target.value)}
        className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        <option value="">全部省份</option>
        {PROVINCES.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      <select
        value={gender}
        onChange={(e) => onGenderChange(e.target.value)}
        className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        {GENDERS.map((g) => (
          <option key={g.value} value={g.value}>{g.label}</option>
        ))}
      </select>

      {(province || gender) && (
        <button
          onClick={() => { onProvinceChange(""); onGenderChange(""); }}
          className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          清除筛选
        </button>
      )}
    </div>
  );
}
