"use client";

import Link from "next/link";
import { useState } from "react";
import { Container } from "./Container";
import { usePublicLang } from "@/lib/i18n/public-context";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = usePublicLang();

  return (
    <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-black/5 dark:border-white/5">
      <Container>
        <div className="flex items-center justify-between h-12">
          <Link href="/" className="flex items-center gap-2 font-semibold text-[15px] tracking-tight text-[#1c1c1e] dark:text-[#e8e8e8]">
            <svg className="w-5 h-5" viewBox="0 0 100 100">
              <path d="M50 80 C25 55, 10 45, 10 30 C10 18, 20 10, 32 10 C40 10, 48 15, 50 22 C52 15, 60 10, 68 10 C80 10, 90 18, 90 30 C90 45, 75 55, 50 80Z" fill="#c5705a"/>
            </svg>
            <span className="hidden sm:inline">我好想你</span>
          </Link>

          <div className="flex items-center gap-3">
            <nav className="hidden md:flex items-center gap-5 text-[13px] font-medium">
              <Link href="/" className="text-[#1c1c1e]/70 dark:text-white/70 hover:text-[#1c1c1e] dark:hover:text-white transition-colors">{t.nav.home}</Link>
              <Link href="/submit" className="text-[#1c1c1e]/70 dark:text-white/70 hover:text-[#1c1c1e] dark:hover:text-white transition-colors">{t.nav.submit}</Link>
            </nav>

            <button
              className="md:hidden p-2 text-[#1c1c1e]/50 dark:text-white/50"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-black/5 dark:border-white/5 pt-3 space-y-1">
            <Link href="/" className="block px-3 py-2 text-[13px] rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#1c1c1e] dark:text-[#e8e8e8]" onClick={() => setMenuOpen(false)}>{t.nav.home}</Link>
            <Link href="/submit" className="block px-3 py-2 text-[13px] rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#1c1c1e] dark:text-[#e8e8e8]" onClick={() => setMenuOpen(false)}>{t.nav.submit}</Link>
          </div>
        )}
      </Container>
    </header>
  );
}
