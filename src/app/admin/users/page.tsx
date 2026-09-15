"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshButton } from "@/components/ui/RefreshButton";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  const fetchUsers = useCallback(async (p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "20" });
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/users?${params}`);
    const data = await res.json();
    setUsers(data.items || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [search]);

  useEffect(() => { setPage(1); fetchUsers(1); }, [fetchUsers]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <h1 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 mb-4">用户管理</h1>

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 flex-1 max-w-lg p-1.5 bg-white/60 dark:bg-[#141414]/60 backdrop-blur-md rounded-xl border border-gray-200/50 dark:border-[#2a2a2a]/50 shadow-sm">
          <RefreshButton onClick={() => fetchUsers(page)} />
          <input type="text" placeholder="搜索手机号或用户名..." value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchUsers(1)}
            className="px-2 py-1.5 text-[13px] bg-transparent flex-1 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none" />
          <button onClick={() => fetchUsers(1)} className="px-4 py-1.5 rounded-lg text-[12px] font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 transition-opacity shadow-sm">
            搜索
          </button>
        </div>
        <span className="px-4 py-1.5 text-[13px] font-medium text-gray-500 dark:text-gray-400 bg-white/60 dark:bg-[#141414]/60 backdrop-blur-md rounded-xl border border-gray-200/50 dark:border-[#2a2a2a]/50">
          共 {total} 人
        </span>
      </div>

      {loading ? <p className="text-sm text-gray-400 dark:text-gray-600">加载中...</p> : (
        <>
          <div className="rounded-2xl border border-gray-200/60 dark:border-[#1f1f1f]/80 bg-white/70 dark:bg-[#0a0a0a]/70 backdrop-blur-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-gray-50/40 dark:bg-[#111]/40 border-b border-gray-200/60 dark:border-[#1f1f1f]/80">
                <tr>
                  <th className="text-left py-3 px-5 font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[11px]">手机号</th>
                  <th className="text-left py-3 px-5 font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[11px]">用户名</th>
                  <th className="text-left py-3 px-5 font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[11px]">地区</th>
                  <th className="text-left py-3 px-5 font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[11px]">微信</th>
                  <th className="text-left py-3 px-5 font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[11px]">QQ</th>
                  <th className="text-left py-3 px-5 font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[11px]">注册时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/50 dark:divide-[#1a1a1a]/50">
                {users.map((u: any) => (
                  <tr key={u.id} className="group hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors duration-200">
                    <td className="py-3.5 px-5 font-mono text-[12px] text-gray-900 dark:text-gray-100">{u.phone}</td>
                    <td className="py-3.5 px-5 font-medium text-gray-900 dark:text-gray-100">{u.username}</td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-medium border ${u.region === "overseas" ? "bg-blue-50/50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/30" : "bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 border-gray-200/50 dark:border-white/10"}`}>
                        {u.region === "overseas" ? "海外" : "大陆"}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-gray-500 dark:text-gray-400 text-[12px]">{u.contactWechat || "-"}</td>
                    <td className="py-3.5 px-5 text-gray-500 dark:text-gray-400 text-[12px]">{u.contactQq || "-"}</td>
                    <td className="py-3.5 px-5 text-gray-500 dark:text-gray-400 text-[12px] whitespace-nowrap">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString("zh-CN") : "-"}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400 dark:text-gray-600">暂无用户</td></tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 bg-gray-50/30 dark:bg-[#111]/30 border-t border-gray-200/60 dark:border-[#1f1f1f]/80">
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => { setPage(i + 1); fetchUsers(i + 1); }}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-[13px] font-medium transition-all duration-200 ${
                    page === i + 1
                      ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm"
                      : "bg-white/50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200/50 dark:border-transparent"
                  }`}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
