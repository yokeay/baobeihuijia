"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { AdminProvider, useAdmin } from "./context";
import {
  DashboardIcon,
  FolderIcon,
  SunIcon,
  MoonIcon,
  UsersIcon,
  MessageIcon,
  HelpIcon,
  LightbulbIcon,
  InboxIcon,
  ActivityIcon,
  ShieldIcon,
  EyeIcon,
  LogoutIcon,
  GlobeIcon,
} from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

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
  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (isLogin) return;
    fetch("/api/admin/me")
      .then((r) => {
        if (!r.ok) throw new Error("Not logged in");
        return r.json();
      })
      .then((data) => setAdmin(data))
      .catch(() => router.push("/admin/login"))
      .finally(() => setLoading(false));
  }, [router, isLogin]);

  if (isLogin) return <>{children}</>;

  if (loading || !admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f7f9] dark:bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-black/10 border-t-[#e60012] rounded-full animate-spin" />
          <p className="text-[12px] text-[#98a2b3]">Loading…</p>
        </div>
      </div>
    );
  }

  const navSections = [
    {
      label: "系统管理",
      items: [
        { href: "/admin/dashboard", label: t.sidebar.dashboard, icon: DashboardIcon },
        { href: "/admin/audit-log", label: t.sidebar.auditLog, icon: ShieldIcon },
      ],
    },
    {
      label: "寻人管理",
      items: [
        { href: "/admin/review", label: t.sidebar.review, icon: EyeIcon },
        { href: "/admin/cases", label: t.sidebar.cases, icon: FolderIcon },
      ],
    },
    {
      label: "内容管理",
      items: [
        { href: "/admin/comments", label: "评论管理", icon: MessageIcon },
        { href: "/admin/questions", label: "疑问管理", icon: HelpIcon },
        { href: "/admin/clues", label: "线索管理", icon: LightbulbIcon },
        { href: "/admin/feedback", label: "反馈管理", icon: InboxIcon },
      ],
    },
    {
      label: "用户管理",
      items: [
        { href: "/admin/users", label: "用户管理", icon: UsersIcon },
        { href: "/admin/user-logs", label: "用户日志", icon: ActivityIcon },
      ],
    },
  ];

  const utilityBtn = cn(
    "flex items-center gap-2.5 w-full h-9 px-2.5 rounded-xl cursor-pointer",
    "text-[12.5px] font-medium text-[#667085] dark:text-[#98a2b3]",
    "transition-colors duration-150",
    "hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-[#101828] dark:hover:text-white"
  );

  return (
    <div className="h-screen overflow-hidden flex bg-[#f6f7f9] dark:bg-[#0a0a0a] text-[#101828] dark:text-[#eceff3]">
      {/* Sidebar */}
      <aside className="w-[236px] flex flex-col flex-shrink-0 bg-white dark:bg-[#0d0e10] border-r border-black/[0.06] dark:border-white/[0.06]">
        {/* Brand */}
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-black/[0.06] dark:border-white/[0.06]">
          <span className="w-7 h-7 rounded-[9px] bg-[#e60012] text-white flex items-center justify-center text-[12px] font-bold flex-shrink-0 shadow-[0_2px_6px_-1px_rgba(230,0,18,0.4)]">
            寻
          </span>
          <Link
            href="/"
            className="text-[13px] font-semibold tracking-[-0.01em] text-[#101828] dark:text-white truncate"
          >
            {t.sidebar.brand}
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-3.5 space-y-5 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.label}>
              <div className="px-2.5 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#98a2b3] dark:text-[#5b6472]">
                {section.label}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "relative flex items-center gap-2.5 h-9 px-2.5 rounded-xl text-[13px]",
                        "transition-colors duration-150",
                        isActive
                          ? "bg-[#e60012]/[0.07] dark:bg-[#e60012]/[0.12] text-[#c1000f] dark:text-[#ff8a92] font-medium"
                          : "text-[#5d6b7a] dark:text-[#98a2b3] hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-[#101828] dark:hover:text-white"
                      )}
                    >
                      {isActive ? (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-[#e60012]" />
                      ) : null}
                      <item.icon size={17} className="flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom controls */}
        <div className="border-t border-black/[0.06] dark:border-white/[0.06] px-2.5 py-3 space-y-1">
          <button type="button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className={utilityBtn}>
            {theme === "dark" ? <SunIcon size={16} /> : <MoonIcon size={16} />}
            {theme === "dark" ? t.theme.light : t.theme.dark}
          </button>

          <button type="button" onClick={() => setLang(lang === "zh" ? "en" : "zh")} className={utilityBtn}>
            <GlobeIcon size={16} />
            {t.lang.switch}
          </button>

          {/* User */}
          <div className="flex items-center gap-2.5 px-2.5 pt-3 mt-1.5 border-t border-black/[0.06] dark:border-white/[0.06]">
            {admin.avatarUrl ? (
              <img
                src={admin.avatarUrl}
                alt=""
                className="w-7 h-7 rounded-full flex-shrink-0 ring-1 ring-black/[0.06] dark:ring-white/[0.10]"
              />
            ) : (
              <div className="w-7 h-7 rounded-full flex-shrink-0 bg-[#f2f4f7] dark:bg-white/[0.06] flex items-center justify-center text-[11px] font-semibold text-[#667085] dark:text-[#98a2b3]">
                {admin.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium truncate leading-tight text-[#101828] dark:text-white">
                {admin.githubUsername || admin.username}
              </p>
              <p className="text-[10.5px] text-[#98a2b3] dark:text-[#5b6472] leading-tight">{t.sidebar.admin}</p>
            </div>
            <button
              type="button"
              title={t.sidebar.logout}
              aria-label={t.sidebar.logout}
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                router.push("/admin/login");
              }}
              className="flex-shrink-0 w-7 h-7 inline-flex items-center justify-center rounded-lg cursor-pointer text-[#98a2b3] hover:text-[#e60012] hover:bg-[#e60012]/[0.08] transition-colors"
            >
              <LogoutIcon size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-[1400px] px-7 py-6">{children}</div>
      </main>
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
