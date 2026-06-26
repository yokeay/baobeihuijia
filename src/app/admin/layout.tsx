"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { AdminProvider, useAdmin } from "./context";
import { DashboardIcon, ClipboardIcon, FolderIcon, LogIcon, SunIcon, MoonIcon } from "@/components/ui/Icon";

interface AdminInfo {
  id: string;
  username: string;
  githubUsername?: string;
  avatarUrl?: string;
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, lang, setLang, theme, setTheme } = useAdmin();
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [loading, setLoading] = useState(true);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => {
        if (!r.ok) throw new Error("Not logged in");
        return r.json();
      })
      .then((data) => setAdmin(data))
      .catch(() => router.push("/admin/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading || !admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a]">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
      </div>
    );
  }

  const navItems = [
    { href: "/admin/dashboard", label: t.sidebar.dashboard, icon: DashboardIcon },
    { href: "/admin/review", label: t.sidebar.review, icon: ClipboardIcon },
    { href: "/admin/cases", label: t.sidebar.cases, icon: FolderIcon },
    { href: "/admin/audit-log", label: t.sidebar.auditLog, icon: LogIcon },
  ];

  return (
    <div className="h-screen overflow-hidden flex bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <aside className="w-56 border-r border-gray-100 dark:border-[#1f1f1f] flex flex-col flex-shrink-0 bg-gray-50/50 dark:bg-[#0d0d0d]">
        {/* Brand */}
        <div className="h-12 flex items-center px-5 border-b border-gray-100 dark:border-[#1f1f1f]">
          <Link href="/" className="text-[13px] font-medium tracking-tight text-gray-900 dark:text-gray-100">
            {t.sidebar.brand}
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-colors ${
                  isActive
                    ? "bg-gray-100 dark:bg-[#1f1f1f] text-gray-900 dark:text-gray-100 font-medium"
                    : "text-gray-500 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-[#141414] hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <item.icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom controls */}
        <div className="border-t border-gray-100 dark:border-[#1f1f1f] px-3 py-2.5 space-y-2">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-[13px] text-gray-500 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-[#141414] hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            {theme === "dark" ? <SunIcon size={17} /> : <MoonIcon size={17} />}
            {theme === "dark" ? t.theme.light : t.theme.dark}
          </button>

          {/* Lang toggle */}
          <button
            onClick={() => setLang(lang === "zh" ? "en" : "zh")}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-[13px] text-gray-500 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-[#141414] hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <span className="text-[17px] leading-none w-[17px] text-center">文</span>
            {t.lang.switch}
          </button>

          {/* User */}
          <div className="flex items-center gap-2.5 px-3 pt-2 border-t border-gray-100 dark:border-[#1f1f1f]">
            {admin.avatarUrl ? (
              <img src={admin.avatarUrl} alt="" className="w-6 h-6 rounded-full" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[11px] text-gray-500 dark:text-gray-400">
                {admin.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium truncate leading-tight">
                {admin.githubUsername || admin.username}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-600 leading-tight">{t.sidebar.admin}</p>
            </div>
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                router.push("/admin/login");
              }}
              className="text-[11px] text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
            >
              {t.sidebar.logout}
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 p-6 overflow-y-auto">{children}</main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminProvider>
  );
}
