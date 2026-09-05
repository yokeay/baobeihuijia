"use client";

import { usePublicLang } from "@/lib/i18n/public-context";

const PROVINCE_LOCAL_NAMES: Record<string, string> = {
  "新疆": "维吾尔文",
  "内蒙古": "蒙古文",
  "西藏": "藏文",
};

export function RegionLangPrompt() {
  const { pendingRegionLangProvince, setRegionLang } = usePublicLang();

  if (!pendingRegionLangProvince) return null;

  const localName = PROVINCE_LOCAL_NAMES[pendingRegionLangProvince] ?? "当地文字";

  return (
    <div className="fixed top-14 right-4 z-[60] w-72 rounded-2xl border border-black/5 bg-white/90 p-3.5 shadow-lg backdrop-blur-xl animate-[fadeIn_.3s_ease] dark:border-white/10 dark:bg-[#1c1c1e]/90">
      <button
        onClick={() => setRegionLang("zh")}
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
            <path d="M4 5h16M4 12h10M4 19h7" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-[#1c1c1e] dark:text-white leading-snug">
            检测到您选择了{pendingRegionLangProvince}
          </p>
          <p className="mt-0.5 text-[11px] text-[#1c1c1e]/40 dark:text-white/40 leading-snug">
            是否切换到{localName}界面？
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <button
              onClick={() => setRegionLang("local")}
              className="flex-1 rounded-lg bg-[#c5705a] py-1.5 text-[12px] font-medium text-white transition hover:bg-[#b5604b] active:scale-[0.98]"
            >
              切换
            </button>
            <button
              onClick={() => setRegionLang("zh")}
              className="flex-1 rounded-lg border border-black/10 py-1.5 text-[12px] font-medium text-[#1c1c1e]/60 transition hover:bg-black/5 dark:border-white/15 dark:text-white/60 dark:hover:bg-white/5"
            >
              保持中文
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
