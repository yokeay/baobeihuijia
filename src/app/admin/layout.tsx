"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

interface AdminInfo {
  id: string;
  username: string;
  githubUsername?: string;
  avatarUrl?: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Login page doesn't need the sidebar layout
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400">加载中...</div>
      </div>
    );
  }

  const navItems = [
    { href: "/admin/dashboard", label: "仪表盘", icon: "📊" },
    { href: "/admin/review", label: "审核队列", icon: "📋" },
    { href: "/admin/cases", label: "案件管理", icon: "📁" },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
        <div className="h-14 flex items-center px-5 border-b border-gray-100">
          <Link href="/" className="font-bold text-primary text-sm">
            我好想你 · 管理
          </Link>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="border-t border-gray-100 p-3">
          <div className="flex items-center gap-3 mb-2">
            {admin.avatarUrl ? (
              <img
                src={admin.avatarUrl}
                alt=""
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                {admin.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">
                {admin.githubUsername || admin.username}
              </p>
              <p className="text-xs text-gray-400">管理员</p>
            </div>
          </div>
          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/admin/login");
            }}
            className="w-full text-xs text-gray-400 hover:text-red-500 py-1.5 text-center rounded hover:bg-red-50 transition-colors"
          >
            退出登录
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
