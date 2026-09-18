"use client";

import { usePublicLang } from "@/lib/i18n/public-context";
import { fmt } from "@/lib/i18n/public/format";

export function RegionLangPrompt() {
  const { pendingRegionLangProvince, setRegionLang, t } = usePublicLang();

  if (!pendingRegionLangProvince) return null;

  const r = t.region;
  const localName =
    pendingRegionLangProvince === "新疆" ? r.localUyghur
    : pendingRegionLangProvince === "内蒙古" ? r.localMongolian
    : pendingRegionLangProvince === "西藏" ? r.localTibetan
    : r.localDefault;

  return (
    <div className="fixed top-14 right-4 z-[60] w-72 rounded-2xl border border-black/5 bg-white/90 p-3.5 shadow-lg backdrop-blur-xl animate-[fadeIn_.3s_ease] dark:border-white/10 dark:bg-[#1c1c1e]/90">
      <button
        onClick={() => setRegionLang("zh")}
        aria-label={r.close}
        className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full text-black/30 transition hover:text-black/60 dark:text-white/40 dark:hover:text-white/70"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e60012]/10 text-[#e60012]">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 5h16M4 12h10M4 19h7" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-[#1c1c1e] dark:text-white leading-snug">
            {fmt(r.detectedProvince, { province: pendingRegionLangProvince })}
          </p>
          <p className="mt-0.5 text-[11px] text-[#1c1c1e]/40 dark:text-white/40 leading-snug">
            {fmt(r.switchLocalLang, { lang: localName })}
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <button
              onClick={() => setRegionLang("local")}
              className="flex-1 rounded-lg bg-[#e60012] py-1.5 text-[12px] font-medium text-white transition hover:bg-[#c1000f] active:scale-[0.98]"
            >
              {r.switch}
            </button>
            <button
              onClick={() => setRegionLang("zh")}
              className="flex-1 rounded-lg border border-black/10 py-1.5 text-[12px] font-medium text-[#1c1c1e]/60 transition hover:bg-black/5 dark:border-white/15 dark:text-white/60 dark:hover:bg-white/5"
            >
              {r.keepChinese}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
