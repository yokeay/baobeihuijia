"use client";

import { useState } from "react";
import { GENDERS } from "@/lib/constants";
import { RegionCascader } from "@/components/shared/RegionCascader";
import { usePublicLang } from "@/lib/i18n/public-context";

interface CaseFilterProps {
  province: string;
  city: string;
  district: string;
  gender: string;
  search: string;
  onProvinceChange: (v: string) => void;
  onCityChange: (v: string) => void;
  onDistrictChange: (v: string) => void;
  onGenderChange: (v: string) => void;
  onSearchChange: (v: string) => void;
}

type Mode = "search" | "filter";

const slideCurve = "cubic-bezier(0.16, 1, 0.3, 1)";

export function CaseFilter({
  province,
  city,
  district,
  gender,
  search,
  onProvinceChange,
  onCityChange,
  onDistrictChange,
  onGenderChange,
  onSearchChange,
}: CaseFilterProps) {
  const { t } = usePublicLang();
  const [mode, setMode] = useState<Mode>("search");
  const [localSearch, setLocalSearch] = useState(search);
  const hasFilter = province || city || district || gender;

  const segments: { key: Mode; label: string; icon: string }[] = [
    { key: "search", label: t.filter.searchTab, icon: "🔍" },
    { key: "filter", label: t.filter.regionTab, icon: "📍" },
  ];

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSearchChange(localSearch);
  }

  return (
    <div className="mb-6">
      {/* Segmented Control */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex rounded-xl bg-black/[0.04] dark:bg-white/[0.04] p-1 gap-0.5">
          {segments.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium rounded-[10px] transition-all duration-300 ${slideCurve} ${
                mode === key
                  ? "bg-white dark:bg-[#1a1a1a] text-[#1c1c1e] dark:text-[#e8e8e8] shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                  : "text-[#1c1c1e]/35 dark:text-white/25 hover:text-[#1c1c1e]/50 dark:hover:text-white/40"
              }`}
            >
              <span className="text-[12px]">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Sliding Panels */}
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500"
          style={{
            transform: mode === "search" ? "translateX(0)" : "translateX(-100%)",
            transitionTimingFunction: slideCurve,
          }}
        >
          {/* Panel A: Search */}
          <div className="w-full flex-shrink-0">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder={t.filter.searchPlaceholder}
                className="flex-1 h-10 px-4 text-[13px] border border-black/10 dark:border-white/10 rounded-xl bg-white dark:bg-[#1a1a1a] text-[#1c1c1e] dark:text-[#e8e8e8] placeholder:text-[#1c1c1e]/25 dark:placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#c5705a]/20 transition-all duration-200"
              />
              <button
                type="submit"
                className="h-10 px-5 text-[13px] font-medium text-white bg-[#c5705a] hover:bg-[#b05a45] rounded-xl transition-colors duration-200"
              >
                {t.filter.searchButton}
              </button>
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setLocalSearch("");
                    onSearchChange("");
                  }}
                  className="h-10 px-3.5 text-[12px] text-[#1c1c1e]/40 dark:text-white/30 hover:text-[#1c1c1e]/60 dark:hover:text-white/50 transition-colors"
                >
                  {t.filter.clearButton}
                </button>
              )}
            </form>
          </div>

          {/* Panel B: Filters */}
          <div className="w-full flex-shrink-0">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <RegionCascader
                  province={province}
                  city={city}
                  district={district}
                  onProvinceChange={onProvinceChange}
                  onCityChange={onCityChange}
                  onDistrictChange={onDistrictChange}
                  rightSlot={
                    <div>
                      <label className="block text-[12px] font-medium text-[#1c1c1e]/40 dark:text-white/30 mb-1">
                        {t.filter.genderLabel}
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => onGenderChange(e.target.value)}
                        className="h-10 px-3.5 text-[13px] border border-black/10 dark:border-white/10 rounded-xl bg-white dark:bg-[#1a1a1a] text-[#1c1c1e]/60 dark:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#c5705a]/20 transition-all duration-200 appearance-none w-full"
                      >
                        {GENDERS.map((g) => (
                          <option key={g.value} value={g.value}>
                            {g.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  }
                />
              </div>

              {hasFilter && (
                <button
                  onClick={() => {
                    onProvinceChange("");
                    onCityChange("");
                    onDistrictChange("");
                    onGenderChange("");
                  }}
                  className="h-10 px-3.5 text-[12px] text-[#1c1c1e]/40 dark:text-white/30 hover:text-[#1c1c1e]/60 dark:hover:text-white/50 transition-colors mt-[18px]"
                >
                  {t.filter.clearButton}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
