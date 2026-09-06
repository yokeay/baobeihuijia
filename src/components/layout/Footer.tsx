"use client";

import Link from "next/link";
import { usePublicLang } from "@/lib/i18n/public-context";

// Josh Jones 捐助了服务器，名字挂他的 LinkedIn。这个人名在 10 个语言包里
// 都是拉丁写法，所以直接在渲染时把它切出来变成链接，不必为一个专有名词
// 把整条文案拆成三段再翻译十遍。
const FOUNDER = "Josh Jones";
const FOUNDER_URL = "https://www.linkedin.com/in/joshjones2";

function Credit({ text }: { text: string }) {
  const i = text.indexOf(FOUNDER);
  const body =
    i === -1 ? (
      text
    ) : (
      <>
        {text.slice(0, i)}
        <a
          href={FOUNDER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-dotted underline-offset-2 hover:text-[#e60012] transition-colors"
        >
          {FOUNDER}
        </a>
        {text.slice(i + FOUNDER.length)}
      </>
    );

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] bg-black/5 dark:bg-white/5 text-[#1c1c1e]/40 dark:text-white/30">
      {body}
    </span>
  );
}

export function Footer() {
  const { t } = usePublicLang();
  const credits = [t.footer.creditServer, t.footer.creditDomain, t.footer.creditTech];

  return (
    <footer className="border-t border-black/5 dark:border-white/5 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-center text-[13px] text-[#1c1c1e]/40 dark:text-white/30">
        <p className="mb-1 text-[#1c1c1e]/60 dark:text-white/50">{t.footer.tagline}</p>
        <p>{t.footer.line1}</p>
        <p className="mt-1">{t.footer.line2}</p>

        <div className="mt-4 flex items-center justify-center gap-4 text-[12px]">
          <Link href="/terms" className="text-[#1c1c1e]/45 hover:text-[#e60012] no-underline transition-colors">
            {t.footer.terms}
          </Link>
          <span className="text-[#1c1c1e]/15">·</span>
          <Link href="/privacy" className="text-[#1c1c1e]/45 hover:text-[#e60012] no-underline transition-colors">
            {t.footer.privacy}
          </Link>
        </div>
        <div className="mt-5 pt-4 border-t border-black/5 dark:border-white/5">
          <p className="text-[11px] text-[#1c1c1e]/25 dark:text-white/20 mb-2">{t.footer.donate}</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {credits.map((c) => (
              <Credit key={c} text={c} />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
