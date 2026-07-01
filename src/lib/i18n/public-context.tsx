"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import zh, { type PublicTranslations } from "./public/zh";
import en from "./public/en";

type Lang = "zh" | "en";

interface PublicLangContextValue {
  countryCode: string;
  lang: Lang;
  t: PublicTranslations;
}

const PublicLangContext = createContext<PublicLangContextValue | null>(null);

const ZH_COUNTRIES = new Set(["CN", "HK", "MO", "TW"]);

function getLang(countryCode: string): Lang {
  return ZH_COUNTRIES.has(countryCode) ? "zh" : "en";
}

function getTranslations(lang: Lang): PublicTranslations {
  return lang === "zh" ? zh : en;
}

export function PublicLangProvider({ children }: { children: ReactNode }) {
  const [countryCode, setCountryCode] = useState("CN");
  const [lang, setLang] = useState<Lang>("zh");
  const [t, setT] = useState<PublicTranslations>(zh);

  useEffect(() => {
    fetch("/api/geo")
      .then((res) => res.json())
      .then((data) => {
        if (data.countryCode) {
          setCountryCode(data.countryCode);
          setLang(getLang(data.countryCode));
          setT(getTranslations(getLang(data.countryCode)));
        }
      })
      .catch(() => {
        // keep defaults
      });
  }, []);

  return (
    <PublicLangContext.Provider value={{ countryCode, lang, t }}>
      {children}
    </PublicLangContext.Provider>
  );
}

export function usePublicLang() {
  const ctx = useContext(PublicLangContext);
  if (!ctx) throw new Error("usePublicLang must be used within PublicLangProvider");
  return ctx;
}
