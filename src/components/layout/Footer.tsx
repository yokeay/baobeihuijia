"use client";

import { usePublicLang } from "@/lib/i18n/public-context";

export function Footer() {
  const { t } = usePublicLang();

  return (
    <footer className="border-t border-black/5 dark:border-white/5 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-center text-[13px] text-[#1c1c1e]/40 dark:text-white/30">
        <p className="mb-1 text-[#1c1c1e]/60 dark:text-white/50">{t.footer.tagline}</p>
        <p>{t.footer.line1}</p>
        <p className="mt-1">{t.footer.line2}</p>
        <div className="mt-5 pt-4 border-t border-black/5 dark:border-white/5">
          <p className="text-[11px] text-[#1c1c1e]/25 dark:text-white/20 mb-2">{t.footer.donate}</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] bg-black/5 dark:bg-white/5 text-[#1c1c1e]/40 dark:text-white/30">ClodHost.com 捐助服务器</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] bg-black/5 dark:bg-white/5 text-[#1c1c1e]/40 dark:text-white/30">安徽安庆太湖王震 捐助域名</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] bg-black/5 dark:bg-white/5 text-[#1c1c1e]/40 dark:text-white/30">SunChengxin 技术支持</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
