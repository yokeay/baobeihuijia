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

      <div className="flex items-center gap-2 mb-4">
        <RefreshButton onClick={() => fetchUsers(page)} />
        <input type="text" placeholder="搜索手机号或用户名..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-sm flex-1 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-700" />
        <span className="px-3 py-2 text-sm text-gray-400 dark:text-gray-600">共 {total} 人</span>
      </div>

      {loading ? <p className="text-sm text-gray-400 dark:text-gray-600">加载中...</p> : (
        <>
          <div className="rounded-xl border border-gray-100 dark:border-[#1f1f1f] bg-white dark:bg-[#0d0d0d] overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#1f1f1f]">
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-500">手机号</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-500">用户名</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-500">地区</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-500">微信</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-500">QQ</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-500">注册时间</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id} className="border-b border-gray-50 dark:border-[#1a1a1a] hover:bg-gray-50/50 dark:hover:bg-[#141414]">
                    <td className="py-2.5 px-4 font-mono text-xs text-gray-900 dark:text-gray-100">{u.phone}</td>
                    <td className="py-2.5 px-4 font-medium text-gray-900 dark:text-gray-100">{u.username}</td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${u.region === "overseas" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "bg-gray-100 dark:bg-[#1f1f1f] text-gray-700 dark:text-gray-300"}`}>
                        {u.region === "overseas" ? "海外" : "大陆"}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-gray-500 dark:text-gray-500 text-xs">{u.contactWechat || "-"}</td>
                    <td className="py-2.5 px-4 text-gray-500 dark:text-gray-500 text-xs">{u.contactQq || "-"}</td>
                    <td className="py-2.5 px-4 text-gray-500 dark:text-gray-500 text-xs whitespace-nowrap">
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
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => { setPage(i + 1); fetchUsers(i + 1); }}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    page === i + 1
                      ? "bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900"
                      : "bg-gray-100 dark:bg-[#1f1f1f] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2a2a2a]"
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
