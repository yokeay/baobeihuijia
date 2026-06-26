"use client";

import Link from "next/link";
import { useState } from "react";
import { Container } from "./Container";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <Container>
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
            <svg className="w-6 h-6" viewBox="0 0 100 100"><path d="M50 80 C25 55, 10 45, 10 30 C10 18, 20 10, 32 10 C40 10, 48 15, 50 22 C52 15, 60 10, 68 10 C80 10, 90 18, 90 30 C90 45, 75 55, 50 80Z" fill="#e60012"/></svg>
            <span className="hidden sm:inline">我好想你</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/" className="text-gray-700 hover:text-primary transition-colors">首页</Link>
            <Link href="/submit" className="text-gray-700 hover:text-primary transition-colors">提交信息</Link>
            <Link href="/admin/login" className="text-gray-400 hover:text-gray-600 transition-colors text-xs">管理</Link>
          </nav>

          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-100 pt-3 space-y-2">
            <Link href="/" className="block px-3 py-2 text-sm rounded-lg hover:bg-gray-50" onClick={() => setMenuOpen(false)}>首页</Link>
            <Link href="/submit" className="block px-3 py-2 text-sm rounded-lg hover:bg-gray-50" onClick={() => setMenuOpen(false)}>提交信息</Link>
            <Link href="/admin/login" className="block px-3 py-2 text-sm rounded-lg hover:bg-gray-50 text-gray-400" onClick={() => setMenuOpen(false)}>管理后台</Link>
          </div>
        )}
      </Container>
    </header>
  );
}
