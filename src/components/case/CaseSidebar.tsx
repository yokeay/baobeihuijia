"use client";

import { useState } from "react";
import { GENDERS } from "@/lib/constants";
import { RegionCascader } from "@/components/shared/RegionCascader";
import { usePublicLang } from "@/lib/i18n/public-context";

interface CaseSidebarProps {
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

type Panel = "none" | "search" | "filter";

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function CaseSidebar(props: CaseSidebarProps) {
  const { t } = usePublicLang();
  const [panel, setPanel] = useState<Panel>("none");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(props.search);
  const hasFilter = Boolean(props.province || props.city || props.district || props.gender);
  const hasActive = hasFilter || Boolean(props.search);

  function togglePanel(next: Panel) {
    setPanel((cur) => (cur === next ? "none" : next));
  }

  function clearFilters() {
    props.onProvinceChange("");
    props.onCityChange("");
    props.onDistrictChange("");
    props.onGenderChange("");
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    props.onSearchChange(localSearch);
    setPanel("none");
    setMobileOpen(false);
  }

  const searchPanel = (
    <form onSubmit={handleSearchSubmit} className="flex gap-2">
      <input
        type="text"
        autoFocus
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
      {props.search && (
        <button
          type="button"
          onClick={() => {
            setLocalSearch("");
            props.onSearchChange("");
          }}
          className="h-10 px-3.5 text-[12px] text-[#1c1c1e]/40 dark:text-white/30 hover:text-[#1c1c1e]/60 dark:hover:text-white/50 transition-colors"
        >
          {t.filter.clearButton}
        </button>
      )}
    </form>
  );

  const filterPanel = (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-medium text-[#1c1c1e]/40 dark:text-white/30">{t.filter.regionTab}</span>
        {hasFilter && (
          <button
            onClick={clearFilters}
            className="text-[12px] text-[#1c1c1e]/40 dark:text-white/30 hover:text-[#1c1c1e]/60 dark:hover:text-white/50 transition-colors"
          >
            {t.filter.clearButton}
          </button>
        )}
      </div>
      <RegionCascader
        province={props.province}
        city={props.city}
        district={props.district}
        onProvinceChange={props.onProvinceChange}
        onCityChange={props.onCityChange}
        onDistrictChange={props.onDistrictChange}
        rightSlot={
          <div>
            <label className="block text-[12px] font-medium text-[#1c1c1e]/40 dark:text-white/30 mb-1">
              {t.filter.genderLabel}
            </label>
            <select
              value={props.gender}
              onChange={(e) => props.onGenderChange(e.target.value)}
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
  );

  return (
    <>
      {/* Desktop persistent rail */}
      <div className="hidden lg:block sticky top-16 self-start w-14 shrink-0">
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => togglePanel("search")}
            className={`relative flex h-11 w-11 items-center justify-center rounded-xl border transition-colors ${
              panel === "search"
                ? "border-[#c5705a]/30 bg-[#c5705a]/10 text-[#c5705a]"
                : "border-black/10 dark:border-white/10 text-[#1c1c1e]/50 dark:text-white/40 hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <SearchIcon className="h-4.5 w-4.5" />
            {props.search && <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[#c5705a]" />}
          </button>
          <button
            onClick={() => togglePanel("filter")}
            className={`relative flex h-11 w-11 items-center justify-center rounded-xl border transition-colors ${
              panel === "filter"
                ? "border-[#c5705a]/30 bg-[#c5705a]/10 text-[#c5705a]"
                : "border-black/10 dark:border-white/10 text-[#1c1c1e]/50 dark:text-white/40 hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            <FilterIcon className="h-4.5 w-4.5" />
            {hasFilter && <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[#c5705a]" />}
          </button>
        </div>

        {/* Desktop popover panel */}
        {panel !== "none" && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setPanel("none")} />
            <div className="absolute left-full top-0 ml-3 z-50 w-80 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-4 shadow-xl animate-[fadeIn_.2s_ease]">
              {panel === "search" ? searchPanel : filterPanel}
            </div>
          </>
        )}
      </div>

      {/* Mobile floating trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-6 right-5 z-40 flex h-13 w-13 items-center justify-center rounded-full shadow-lg text-white transition-transform active:scale-95"
        style={{ background: "#c5705a", width: "52px", height: "52px" }}
      >
        <FilterIcon className="h-5 w-5" />
        {hasActive && (
          <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-white border-2" style={{ borderColor: "#c5705a" }} />
        )}
      </button>

      {/* Mobile bottom sheet */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-[#1a1a1a] rounded-t-3xl p-5 pb-8 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="w-10 h-1 bg-gray-200 dark:bg-white/15 rounded-full mx-auto mb-5" />
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-full text-black/30 dark:text-white/40 hover:bg-black/5 dark:hover:bg-white/5"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
            <div className="space-y-5">
              {searchPanel}
              {filterPanel}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
