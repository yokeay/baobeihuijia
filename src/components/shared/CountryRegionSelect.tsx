"use client";

import { useEffect, useState } from "react";
import { usePublicLang } from "@/lib/i18n/public-context";

interface RegionOption {
  value: string;
  count: number;
}

interface CountryRegionSelectProps {
  countryCode: string;
  province: string;
  city: string;
  district: string;
  onProvinceChange: (v: string) => void;
  onCityChange: (v: string) => void;
  onDistrictChange: (v: string) => void;
  rightSlot?: React.ReactNode;
}

// Each level's options are cached under the key they were fetched for, so a
// stale response for a previous country/parent can never be rendered.
interface LevelData {
  key: string;
  options: RegionOption[];
}

const selectClass =
  "w-full h-10 px-3 text-[13px] border border-black/10 dark:border-white/10 rounded-xl bg-white dark:bg-[#1a1a1a] text-[#1c1c1e] dark:text-[#e8e8e8] focus:outline-none focus:ring-2 focus:ring-[#c5705a]/20 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 appearance-none";
const labelClass = "block text-[12px] font-medium text-[#1c1c1e]/40 dark:text-white/30 mb-1";

async function fetchRegions(params: Record<string, string>): Promise<RegionOption[]> {
  const res = await fetch(`/api/cases/regions?${new URLSearchParams(params)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data.options) ? data.options : [];
}

/**
 * Region filter for every country except mainland China and Hong Kong.
 * Options are derived from that country's own rows (/api/cases/regions), so the
 * dropdowns show its real administrative names and never fall back to mainland
 * provinces. Countries without structured data get an empty-state hint instead
 * of dropdowns that could not match anything.
 */
export function CountryRegionSelect(props: CountryRegionSelectProps) {
  const { t } = usePublicLang();
  const { countryCode, province, city, district } = props;

  const [provinceData, setProvinceData] = useState<LevelData | null>(null);
  const [cityData, setCityData] = useState<LevelData | null>(null);
  const [districtData, setDistrictData] = useState<LevelData | null>(null);

  const cityKey = province ? `${countryCode}|${province}` : "";
  const districtKey = province && city ? `${countryCode}|${province}|${city}` : "";

  const loaded = provinceData?.key === countryCode;
  const provinces = loaded ? provinceData.options : [];
  const cities = cityKey && cityData?.key === cityKey ? cityData.options : [];
  const districts = districtKey && districtData?.key === districtKey ? districtData.options : [];

  useEffect(() => {
    let alive = true;
    fetchRegions({ countryCode, level: "province" }).then((options) => {
      if (alive) setProvinceData({ key: countryCode, options });
    });
    return () => { alive = false; };
  }, [countryCode]);

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

  if (loaded && provinces.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-2">
        <p className="text-[12px] text-[#1c1c1e]/35 dark:text-white/25 leading-relaxed">
          {t.grid.empty}
        </p>
        {props.rightSlot}
      </div>
    );
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
          <select
            className={selectClass}
            value={city}
            onChange={(e) => handleCityChange(e.target.value)}
          >
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
          <select
            className={selectClass}
            value={district}
            onChange={(e) => props.onDistrictChange(e.target.value)}
          >
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
