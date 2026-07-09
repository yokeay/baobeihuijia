"use client";

import { useState, useEffect, useCallback } from "react";

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
      <h1 className="text-lg font-bold mb-4">用户管理</h1>

      <div className="flex gap-2 mb-4">
        <input type="text" placeholder="搜索手机号或用户名..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm flex-1" />
        <span className="px-3 py-2 text-sm text-gray-400">共 {total} 人</span>
      </div>

      {loading ? <p className="text-sm text-gray-400">加载中...</p> : (
        <>
          <div className="bg-white rounded-xl border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500">手机号</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500">用户名</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500">地区</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500">微信</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500">QQ</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-500">注册时间</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-mono text-xs">{u.phone}</td>
                    <td className="px-4 py-2.5 font-medium">{u.username}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${u.region === "overseas" ? "bg-blue-100 text-blue-700" : "bg-gray-100"}`}>
                        {u.region === "overseas" ? "海外" : "大陆"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{u.contactWechat || "-"}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{u.contactQq || "-"}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs whitespace-nowrap">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString("zh-CN") : "-"}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">暂无用户</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => { setPage(i + 1); fetchUsers(i + 1); }}
                  className={`px-3 py-1 rounded text-sm ${page === i + 1 ? "bg-gray-800 text-white" : "bg-gray-100 hover:bg-gray-200"}`}>
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
