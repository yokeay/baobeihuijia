"use client";

import { useEffect, useState } from "react";
import { usePublicLang } from "@/lib/i18n/public-context";

export interface RegionOption {
  value: string;
  count: number;
}

// Each level's options are cached under the key they were fetched for, so a
// stale response for a previous country/parent can never be rendered.
interface LevelData {
  key: string;
  options: RegionOption[];
}

const selectClass =
  "w-full h-10 px-3 text-[13px] border border-black/10 dark:border-white/10 rounded-xl bg-white dark:bg-[#1a1a1a] text-[#1c1c1e] dark:text-[#e8e8e8] focus:outline-none focus:ring-2 focus:ring-[#e60012]/20 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 appearance-none";
const labelClass = "block text-[12px] font-medium text-[#1c1c1e]/40 dark:text-white/30 mb-1";

async function fetchRegions(params: Record<string, string>): Promise<RegionOption[]> {
  const res = await fetch(`/api/cases/regions?${new URLSearchParams(params)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data.options) ? data.options : [];
}

/**
 * Top-level region options for a country, derived from its own rows.
 * Pass an empty countryCode to skip fetching (for countries that use a
 * dedicated cascade instead). Callers use `provinces.length` to decide whether
 * a region filter is worth showing at all.
 */
export function useCountryRegions(countryCode: string) {
  const [data, setData] = useState<LevelData | null>(null);

  useEffect(() => {
    if (!countryCode) return;
    let alive = true;
    fetchRegions({ countryCode, level: "province" }).then((options) => {
      if (alive) setData({ key: countryCode, options });
    });
    return () => { alive = false; };
  }, [countryCode]);

  const loaded = !countryCode || data?.key === countryCode;
  return {
    loaded,
    provinces: countryCode && data?.key === countryCode ? data.options : [],
  };
}

interface CountryRegionSelectProps {
  countryCode: string;
  province: string;
  city: string;
  district: string;
  provinces: RegionOption[];
  loaded: boolean;
  onProvinceChange: (v: string) => void;
  onCityChange: (v: string) => void;
  onDistrictChange: (v: string) => void;
  rightSlot?: React.ReactNode;
}

/**
 * Region filter for every country except mainland China and Hong Kong.
 * Option labels are that country's real administrative names — mainland
 * provinces are never used as a fallback.
 */
export function CountryRegionSelect(props: CountryRegionSelectProps) {
  const { t } = usePublicLang();
  const { countryCode, province, city, district, provinces, loaded } = props;

  const [cityData, setCityData] = useState<LevelData | null>(null);
  const [districtData, setDistrictData] = useState<LevelData | null>(null);

  const cityKey = province ? `${countryCode}|${province}` : "";
  const districtKey = province && city ? `${countryCode}|${province}|${city}` : "";

  const cities = cityKey && cityData?.key === cityKey ? cityData.options : [];
  const districts = districtKey && districtData?.key === districtKey ? districtData.options : [];

  useEffect(() => {
    if (!cityKey) return;
    let alive = true;
    fetchRegions({ countryCode, level: "city", province }).then((options) => {
      if (alive) setCityData({ key: cityKey, options });
    });
    return () => { alive = false; };
  }, [countryCode, province, cityKey]);

  useEffect(() => {
    if (!districtKey) return;
    let alive = true;
    fetchRegions({ countryCode, level: "district", province, city }).then((options) => {
      if (alive) setDistrictData({ key: districtKey, options });
    });
    return () => { alive = false; };
  }, [countryCode, province, city, districtKey]);

  function handleProvinceChange(v: string) {
    props.onProvinceChange(v);
    props.onCityChange("");
    props.onDistrictChange("");
  }

  function handleCityChange(v: string) {
    props.onCityChange(v);
    props.onDistrictChange("");
  }

  return (
    <div className={props.rightSlot ? "grid grid-cols-1 sm:grid-cols-2 gap-2" : "grid grid-cols-1 gap-2"}>
      <div>
        <label className={labelClass}>{t.filter.regionLabel1}</label>
        <select
          className={selectClass}
          value={province}
          onChange={(e) => handleProvinceChange(e.target.value)}
          disabled={!loaded}
        >
          <option value="">{t.filter.selectAll}</option>
          {provinces.map((o) => (
            <option key={o.value} value={o.value}>{`${o.value} (${o.count})`}</option>
          ))}
        </select>
      </div>

      {cities.length > 0 && (
        <div>
          <label className={labelClass}>{t.filter.regionLabel2}</label>
          <select className={selectClass} value={city} onChange={(e) => handleCityChange(e.target.value)}>
            <option value="">{t.filter.selectAll}</option>
            {cities.map((o) => (
              <option key={o.value} value={o.value}>{`${o.value} (${o.count})`}</option>
            ))}
          </select>
        </div>
      )}

      {districts.length > 0 && (
        <div>
          <label className={labelClass}>{t.filter.regionLabel3}</label>
          <select className={selectClass} value={district} onChange={(e) => props.onDistrictChange(e.target.value)}>
            <option value="">{t.filter.selectAll}</option>
            {districts.map((o) => (
              <option key={o.value} value={o.value}>{`${o.value} (${o.count})`}</option>
            ))}
          </select>
        </div>
      )}

      {props.rightSlot}
    </div>
  );
}
