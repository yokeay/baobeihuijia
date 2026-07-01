"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import chinaAreaData from "china-area-data";
import { usePublicLang } from "@/lib/i18n/public-context";

interface Option {
  code: string;
  name: string;
}

interface RegionCascaderProps {
  province: string;
  city: string;
  district: string;
  onProvinceChange: (name: string) => void;
  onCityChange: (name: string) => void;
  onDistrictChange: (name: string) => void;
  rightSlot?: React.ReactNode;
}

const d = chinaAreaData as Record<string, Record<string, string>>;

const selectClass =
  "w-full h-10 px-3 text-[13px] border border-black/10 dark:border-white/10 rounded-xl bg-white dark:bg-[#1a1a1a] text-[#1c1c1e] dark:text-[#e8e8e8] focus:outline-none focus:ring-2 focus:ring-[#c5705a]/20 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 appearance-none";
const labelClass = "block text-[12px] font-medium text-[#1c1c1e]/40 dark:text-white/30 mb-1";

export function RegionCascader({
  province,
  city,
  district,
  onProvinceChange,
  onCityChange,
  onDistrictChange,
  rightSlot,
}: RegionCascaderProps) {
  const { t } = usePublicLang();
  const provinces: Option[] = useMemo(() => {
    return Object.entries(d["86"]).map(([code, name]) => ({ code, name }));
  }, []);

  const nameToCode: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {};
    for (const [code, name] of Object.entries(d["86"])) {
      map[name] = code;
    }
    return map;
  }, []);

  const provinceCode = province ? nameToCode[province] || "" : "";

  const cities: Option[] = useMemo(() => {
    if (!provinceCode || !d[provinceCode]) return [];
    return Object.entries(d[provinceCode]).map(([code, name]) => ({
      code,
      name,
    }));
  }, [provinceCode]);

  const cityCode = city && provinceCode && d[provinceCode]
    ? (() => {
        for (const [code, name] of Object.entries(d[provinceCode])) {
          if (name === city) return code;
        }
        return "";
      })()
    : "";

  const districts: Option[] = useMemo(() => {
    if (!cityCode || !d[cityCode]) return [];
    return Object.entries(d[cityCode])
      .filter(([_, name]) => name !== "市辖区")
      .map(([code, name]) => ({ code, name }));
  }, [cityCode]);

  const districtCode = district && cityCode && d[cityCode]
    ? (() => {
        for (const [code, name] of Object.entries(d[cityCode])) {
          if (name === district) return code;
        }
        return "";
      })()
    : "";

  function handleProvinceChange(code: string) {
    const name = code ? d["86"][code] || "" : "";
    onProvinceChange(name);
    onCityChange("");
    onDistrictChange("");
  }

  function handleCityChange(code: string) {
    const name = code ? d[provinceCode]?.[code] || "" : "";
    onCityChange(name);
    onDistrictChange("");
  }

  function handleDistrictChange(code: string) {
    const name = code ? d[cityCode]?.[code] || "" : "";
    onDistrictChange(name);
  }

  const gridClass = rightSlot
    ? "grid grid-cols-1 sm:grid-cols-4 gap-2"
    : "grid grid-cols-1 sm:grid-cols-3 gap-2";
  return (
    <div className={gridClass}>
      <div>
        <label className={labelClass}>{t.filter.provinceLabel}</label>
        <select
          className={selectClass}
          value={provinceCode}
          onChange={(e) => handleProvinceChange(e.target.value)}
        >
          <option value="">{t.filter.selectProvince}</option>
          {provinces.map(({ code, name }) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>{t.filter.cityLabel}</label>
        <select
          className={selectClass}
          value={cityCode}
          onChange={(e) => handleCityChange(e.target.value)}
          disabled={!provinceCode || cities.length === 0}
        >
          <option value="">{t.filter.selectCity}</option>
          {cities.map(({ code, name }) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>{t.filter.districtLabel}</label>
        <select
          className={selectClass}
          value={districtCode}
          onChange={(e) => handleDistrictChange(e.target.value)}
          disabled={!cityCode || districts.length === 0}
          title={districts.length === 0 && cityCode ? t.filter.noDistrict : undefined}
        >
          <option value="">{t.filter.selectDistrict}</option>
          {districts.map(({ code, name }) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </div>
      {rightSlot}
    </div>
  );
}
