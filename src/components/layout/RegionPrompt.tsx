"use client";

import { useState } from "react";
import { usePublicLang, countryName } from "@/lib/i18n/public-context";

export function RegionPrompt() {
  const { showRegionPrompt, detectedCountry, switchCountry, keepChina } = usePublicLang();
  const [leaving, setLeaving] = useState(false);

  if (!showRegionPrompt || !detectedCountry) return null;

  return (
    <div className="fixed top-14 right-4 z-[60] w-72 rounded-2xl border border-black/5 bg-white/90 p-3.5 shadow-lg backdrop-blur-xl animate-[fadeIn_.3s_ease] dark:border-white/10 dark:bg-[#1c1c1e]/90">
      {/* close */}
      <button
        onClick={() => keepChina()}
        aria-label="关闭"
        className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full text-black/30 transition hover:text-black/60 dark:text-white/40 dark:hover:text-white/70"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#c5705a]/10 text-[#c5705a]">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-[#1c1c1e] dark:text-white leading-snug">
            检测到您可能位于{countryName(detectedCountry)}
          </p>
          <p className="mt-0.5 text-[11px] text-[#1c1c1e]/40 dark:text-white/40 leading-snug">
            是否切换到当地失踪数据？
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <button
              onClick={() => switchCountry(detectedCountry)}
              disabled={leaving}
              className="flex-1 rounded-lg bg-[#c5705a] py-1.5 text-[12px] font-medium text-white transition hover:bg-[#b5604b] active:scale-[0.98]"
            >
              切换
            </button>
            <button
              onClick={() => keepChina()}
              className="flex-1 rounded-lg border border-black/10 py-1.5 text-[12px] font-medium text-[#1c1c1e]/60 transition hover:bg-black/5 dark:border-white/15 dark:text-white/60 dark:hover:bg-white/5"
            >
              保持中国
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
