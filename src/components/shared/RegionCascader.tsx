"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import chinaAreaData from "china-area-data";

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
}

const d = chinaAreaData as Record<string, Record<string, string>>;

const selectClass =
  "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-gray-50 disabled:text-gray-400";

export function RegionCascader({
  province,
  city,
  district,
  onProvinceChange,
  onCityChange,
  onDistrictChange,
}: RegionCascaderProps) {
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          国家
        </label>
        <select className={selectClass} value="中国" disabled>
          <option>中国</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          省份 *
        </label>
        <select
          className={selectClass}
          value={provinceCode}
          onChange={(e) => handleProvinceChange(e.target.value)}
        >
          <option value="">请选择省份</option>
          {provinces.map(({ code, name }) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          城市
        </label>
        <select
          className={selectClass}
          value={cityCode}
          onChange={(e) => handleCityChange(e.target.value)}
          disabled={!provinceCode || cities.length === 0}
        >
          <option value="">请选择城市</option>
          {cities.map(({ code, name }) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          区县
        </label>
        <select
          className={selectClass}
          value={districtCode}
          onChange={(e) => handleDistrictChange(e.target.value)}
          disabled={!cityCode || districts.length === 0}
          title={districts.length === 0 && cityCode ? "该城市暂无区县数据" : undefined}
        >
          <option value="">请选择区县</option>
          {districts.map(({ code, name }) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
