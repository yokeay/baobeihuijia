"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Container } from "./Container";
import { RegionPrompt } from "./RegionPrompt";
import { RegionLangPrompt } from "./RegionLangPrompt";
import { usePublicLang } from "@/lib/i18n/public-context";
import { useUser } from "@/lib/UserContext";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { t } = usePublicLang();
  const { user, token, setAuthOpen, logout } = useUser();

  // Close user menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [userMenuOpen]);

  function handleAvatarClick() {
    if (user) {
      setUserMenuOpen(!userMenuOpen);
    } else {
      setAuthOpen(true);
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-black/5">
      <Container>
        <div className="flex items-center justify-between h-12">
          {/* Logo — IMU squircle wordmark + a heart that actually beats */}
          <Link href="/" className="flex items-center gap-2 font-semibold text-[15px] tracking-tight no-underline group">
            <svg className="w-6 h-6 shrink-0" viewBox="0 0 100 100" aria-label="IMU" role="img">
              <defs>
                <linearGradient id="hdrTile" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#D98166" />
                  <stop offset="0.55" stopColor="#C5705A" />
                  <stop offset="1" stopColor="#A85440" />
                </linearGradient>
              </defs>
              <rect width="100" height="100" rx="26" fill="url(#hdrTile)" />
              <g fill="none" stroke="#FFF6F1" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 36 V68" />
                <path d="M33 68 V37 L45 54 L57 37 V68" />
                <path d="M67 36 V57 C67 63.5 71.5 68 76 68 C80.5 68 85 63.5 85 57 V36" />
              </g>
            </svg>
            <span className="hidden sm:inline" style={{ fontFamily: '"Songti SC", "Noto Serif SC", "SimSun", serif', color: '#1c1c1e' }}>
              我好想你
            </span>
            <svg
              className="w-3 h-3 flex-shrink-0 animate-heartbeat"
              viewBox="0 0 24 22"
              fill="#c5705a"
              aria-hidden="true"
            >
              <path d="M12 21.2C4.6 14.6 1.4 11.4 1.4 7.2 1.4 3.6 4.1 1 7.4 1c2 0 3.7 1 4.6 2.5C12.9 2 14.6 1 16.6 1 19.9 1 22.6 3.6 22.6 7.2c0 4.2-3.2 7.4-10.6 14z" />
            </svg>
          </Link>

          <div className="flex items-center gap-3">
            <nav className="hidden md:flex items-center gap-5 text-[13px] font-medium">
              <Link href="/" className="text-[#1c1c1e]/70 hover:text-[#1c1c1e] transition-colors">{t.nav.home}</Link>
              <Link href="/submit" className="text-[#1c1c1e]/70 hover:text-[#1c1c1e] transition-colors">{t.nav.submit}</Link>
            </nav>

            {/* User / Guest area */}
            <div className="relative ml-2" ref={menuRef}>
              <button
                onClick={handleAvatarClick}
                className="flex items-center gap-2 pl-3 pr-3 py-1.5 rounded-full hover:bg-black/5 transition-colors"
              >
                {user ? (
                  <>
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                      style={{ background: `hsl(${user.avatarSeed ? user.avatarSeed.split('').reduce((a,c)=>a+c.charCodeAt(0),0) % 360 : 30}, 50%, 50%)` }}
                    >
                      {user.username.charAt(0)}
                    </div>
                    <span className="text-[13px] text-[#1c1c1e] hidden sm:inline">{user.username}</span>
                  </>
                ) : (
                  <>
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className="text-[13px] text-[#6B6860]">游客</span>
                  </>
                )}
              </button>

              {/* User dropdown menu */}
              {user && userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                  <Link
                    href="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="w-full text-left px-4 py-2.5 text-sm text-[#1c1c1e] hover:bg-gray-50 transition-colors block no-underline"
                  >
                    完善联系方式
                  </Link>
                  <button
                    onClick={() => { setUserMenuOpen(false); logout(); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    退出登录
                  </button>
                </div>
              )}
            </div>

            <button
              className="md:hidden p-2 text-[#1c1c1e]/50"
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
          <div className="md:hidden pb-4 border-t border-black/5 pt-3 space-y-1">
            <Link href="/" className="block px-3 py-2 text-[13px] rounded-lg hover:bg-black/5 text-[#1c1c1e]" onClick={() => setMenuOpen(false)}>{t.nav.home}</Link>
            <Link href="/submit" className="block px-3 py-2 text-[13px] rounded-lg hover:bg-black/5 text-[#1c1c1e]" onClick={() => setMenuOpen(false)}>{t.nav.submit}</Link>
          </div>
        )}
      </Container>

      {/* Region switch prompt — top-right, only when overseas detected */}
      <RegionPrompt />
      {/* CN autonomous-region local-language prompt — 新疆/内蒙古/西藏 */}
      <RegionLangPrompt />
    </header>
  );
}
