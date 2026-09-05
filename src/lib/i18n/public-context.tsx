"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import zh, { type PublicTranslations } from "./public/zh";
import en from "./public/en";
import zhHant from "./public/zh-hant";
import ja from "./public/ja";
import ko from "./public/ko";
import fr from "./public/fr";
import de from "./public/de";
import ug from "./public/ug";
import mn from "./public/mn";
import bo from "./public/bo";
import { COUNTRY_MAP } from "@/lib/countries";

export type Lang = "zh" | "zh-Hant" | "en" | "ja" | "ko" | "fr" | "de" | "ug" | "mn" | "bo";

// Provinces where the user may opt into a local-language UI on top of the
// CN default. Not a country switch — this is an overlay on the CN language.
export type RegionLangProvince = "新疆" | "内蒙古" | "西藏";

const REGION_LANG_MAP: Record<RegionLangProvince, Lang> = {
  "新疆": "ug",
  "内蒙古": "mn",
  "西藏": "bo",
};

function isRegionLangProvince(province: string): province is RegionLangProvince {
  return province === "新疆" || province === "内蒙古" || province === "西藏";
}

interface PublicLangContextValue {
  countryCode: string;
  detectedCountry: string;
  showRegionPrompt: boolean;
  lang: Lang;
  t: PublicTranslations;
  switchCountry: (code: string) => void;
  dismissRegionPrompt: () => void;
  keepChina: () => void;
  /** CN autonomous-region local-language overlay (新疆/内蒙古/西藏). */
  pendingRegionLangProvince: RegionLangProvince | null;
  regionLang: "zh" | "local" | null;
  promptRegionLang: (province: string) => void;
  setRegionLang: (choice: "zh" | "local") => void;
}

const PublicLangContext = createContext<PublicLangContextValue | null>(null);

// Country code -> display name (for the region prompt)
const COUNTRY_NAMES: Record<string, string> = {
  US: "美国", JP: "日本", KR: "韩国", GB: "英国", CA: "加拿大",
  AU: "澳大利亚", DE: "德国", FR: "法国", SG: "新加坡", MY: "马来西亚",
  TH: "泰国", VN: "越南", ID: "印度尼西亚", PH: "菲律宾", IN: "印度",
  IT: "意大利", ES: "西班牙", NL: "荷兰", NZ: "新西兰", RU: "俄罗斯",
  HK: "中国香港", MO: "中国澳门", TW: "中国台湾",
};

const TRANSLATIONS: Record<Lang, PublicTranslations> = {
  zh,
  "zh-Hant": zhHant,
  en,
  ja,
  ko,
  fr,
  de,
  ug,
  mn,
  bo,
};

function getLang(countryCode: string): Lang {
  return COUNTRY_MAP[countryCode]?.lang ?? "en";
}

function getTranslations(lang: Lang): PublicTranslations {
  return TRANSLATIONS[lang] ?? en;
}

export function countryName(code: string): string {
  return COUNTRY_NAMES[code] ?? code;
}

export function PublicLangProvider({ children }: { children: ReactNode }) {
  // Default: always China (CN) + Chinese. Never auto-switch.
  const [countryCode, setCountryCode] = useState("CN");
  const [detectedCountry, setDetectedCountry] = useState("");
  const [promptDismissed, setPromptDismissed] = useState(false);
  const [lang, setLang] = useState<Lang>("zh");
  const [t, setT] = useState<PublicTranslations>(zh);

  // CN autonomous-region local-language overlay (新疆/内蒙古/西藏). Independent
  // from the country-level `lang` above — only meaningful while countryCode === "CN".
  const [pendingRegionLangProvince, setPendingRegionLangProvince] = useState<RegionLangProvince | null>(null);
  const [regionLang, setRegionLangState] = useState<"zh" | "local" | null>(null);
  const askedProvincesRef = useRef<Set<RegionLangProvince>>(new Set());
  const regionLangRef = useRef<"zh" | "local" | null>(null);

  useEffect(() => {
    regionLangRef.current = regionLang;
  }, [regionLang]);

  // Detect the user's location but DO NOT auto-switch.
  // Only record it so the UI can ask whether to switch.
  useEffect(() => {
    fetch("/api/geo")
      .then((res) => res.json())
      .then((data) => {
        if (data.countryCode && data.countryCode !== "CN") {
          setDetectedCountry(data.countryCode);
        }
      })
      .catch(() => {
        // keep China default
      });
  }, []);

  const switchCountry = useCallback((code: string) => {
    setCountryCode(code);
    setPromptDismissed(true);
    const nextLang = getLang(code);
    setLang(nextLang);
    setT(getTranslations(nextLang));
    setPendingRegionLangProvince(null);
    setRegionLangState(null);
  }, []);

  const keepChina = useCallback(() => {
    setCountryCode("CN");
    setPromptDismissed(true);
    setLang("zh");
    setT(zh);
    setPendingRegionLangProvince(null);
    setRegionLangState(null);
  }, []);

  const dismissRegionPrompt = useCallback(() => {
    setPromptDismissed(true);
  }, []);

  // Called when the CN region filter's province changes. Only triggers the
  // local-language prompt for 新疆/内蒙古/西藏, and only once per province
  // per session (re-selecting the same province won't re-prompt).
  const promptRegionLang = useCallback((province: string) => {
    if (!isRegionLangProvince(province)) {
      setPendingRegionLangProvince(null);
      if (regionLangRef.current !== null) {
        setRegionLangState(null);
        setLang("zh");
        setT(zh);
      }
      return;
    }
    if (askedProvincesRef.current.has(province)) return;
    askedProvincesRef.current.add(province);
    setPendingRegionLangProvince(province);
  }, []);

  const setRegionLang = useCallback((choice: "zh" | "local") => {
    setRegionLangState(choice);
    setPendingRegionLangProvince(null);
    if (choice === "local" && pendingRegionLangProvince) {
      const localLang = REGION_LANG_MAP[pendingRegionLangProvince];
      setLang(localLang);
      setT(getTranslations(localLang));
    } else {
      setLang("zh");
      setT(zh);
    }
  }, [pendingRegionLangProvince]);

  const showRegionPrompt = detectedCountry !== "" && !promptDismissed;

  return (
    <PublicLangContext.Provider
      value={{
        countryCode,
        detectedCountry,
        showRegionPrompt,
        lang,
        t,
        switchCountry,
        dismissRegionPrompt,
        keepChina,
        pendingRegionLangProvince,
        regionLang,
        promptRegionLang,
        setRegionLang,
      }}
    >
      {children}
    </PublicLangContext.Provider>
  );
}

export function usePublicLang() {
  const ctx = useContext(PublicLangContext);
  if (!ctx) throw new Error("usePublicLang must be used within PublicLangProvider");
  return ctx;
}
