"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import zh from "@/lib/i18n/zh";
import en from "@/lib/i18n/en";
import type { Translations } from "@/lib/i18n/zh";

type Lang = "zh" | "en";
type Theme = "light" | "dark";

const translations: Record<Lang, Translations> = { zh, en };

interface AdminContextValue {
  t: Translations;
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

function getInitialLang(): Lang {
  if (typeof window === "undefined") return "zh";
  const stored = localStorage.getItem("admin-lang");
  if (stored === "en" || stored === "zh") return stored;
  return "zh";
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("admin-theme");
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("zh");
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLangState(getInitialLang());
    setThemeState(getInitialTheme());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("admin-lang", lang);
  }, [lang, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("admin-theme", theme);
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme, mounted]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const setTheme = useCallback((t: Theme) => setThemeState(t), []);

  const t = translations[lang];

  return (
    <AdminContext.Provider value={{ t, lang, setLang, theme, setTheme }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}
