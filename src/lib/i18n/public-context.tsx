"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import zh, { type PublicTranslations } from "./public/zh";
import en from "./public/en";

type Lang = "zh" | "en";

interface PublicLangContextValue {
  countryCode: string;
  detectedCountry: string;
  showRegionPrompt: boolean;
  lang: Lang;
  t: PublicTranslations;
  switchCountry: (code: string) => void;
  dismissRegionPrompt: () => void;
  keepChina: () => void;
}

const PublicLangContext = createContext<PublicLangContextValue | null>(null);

const ZH_COUNTRIES = new Set(["CN", "HK", "MO", "TW"]);

// Country code -> display name (for the region prompt)
const COUNTRY_NAMES: Record<string, string> = {
  US: "美国", JP: "日本", KR: "韩国", GB: "英国", CA: "加拿大",
  AU: "澳大利亚", DE: "德国", FR: "法国", SG: "新加坡", MY: "马来西亚",
  TH: "泰国", VN: "越南", ID: "印度尼西亚", PH: "菲律宾", IN: "印度",
  IT: "意大利", ES: "西班牙", NL: "荷兰", NZ: "新西兰", RU: "俄罗斯",
  HK: "中国香港", MO: "中国澳门", TW: "中国台湾",
};

function getLang(countryCode: string): Lang {
  return ZH_COUNTRIES.has(countryCode) ? "zh" : "en";
}

function getTranslations(lang: Lang): PublicTranslations {
  return lang === "zh" ? zh : en;
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
  }, []);

  const keepChina = useCallback(() => {
    setCountryCode("CN");
    setPromptDismissed(true);
    setLang("zh");
    setT(zh);
  }, []);

  const dismissRegionPrompt = useCallback(() => {
    setPromptDismissed(true);
  }, []);

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
