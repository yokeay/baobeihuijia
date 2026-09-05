"use client";

import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { usePublicLang } from "@/lib/i18n/public-context";

/**
 * Shell for the two legal pages. They are authored in Chinese (authoritative)
 * with an English translation underneath — machine-translating binding terms
 * into the other eight UI languages would be worse than not offering them.
 */
export function LegalPage({
  titleZh,
  titleEn,
  updated,
  zh,
  en,
}: {
  titleZh: string;
  titleEn: string;
  updated: string;
  zh: React.ReactNode;
  en: React.ReactNode;
}) {
  const { lang } = usePublicLang();
  const preferEnglish = lang !== "zh" && lang !== "zh-Hant";

  return (
    <div className="flex flex-col min-h-full">
      <Header />
      <main className="flex-1 py-10">
        <Container className="max-w-3xl">
          <nav className="mb-6 text-[12px] text-[#1c1c1e]/35">
            <Link href="/" className="hover:text-[#c5705a] no-underline">
              ← 我好想你
            </Link>
          </nav>

          <h1 className="text-[26px] md:text-[32px] font-bold tracking-tight text-[#1c1c1e] leading-snug">
            {preferEnglish ? titleEn : titleZh}
          </h1>
          <p className="mt-2 text-[12px] text-[#1c1c1e]/35">
            最后更新 / Last updated: {updated}
          </p>

          <div className="mt-8 legal-body">{preferEnglish ? en : zh}</div>

          <hr className="my-10 border-black/5" />

          <details className="group">
            <summary className="cursor-pointer text-[13px] text-[#1c1c1e]/45 hover:text-[#c5705a] list-none">
              {preferEnglish ? "查看中文版（以中文版为准）" : "View English version"}
            </summary>
            <div className="mt-6 legal-body">{preferEnglish ? zh : en}</div>
          </details>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
