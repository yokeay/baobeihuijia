"use client";

import { useState, useEffect, useCallback } from "react";

const th = "text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-500";
const td = "py-2.5 px-4 text-gray-900 dark:text-gray-100";
const tdMuted = "py-2.5 px-4 text-gray-500 dark:text-gray-500";
const trClass = "border-b border-gray-50 dark:border-[#1a1a1a] hover:bg-gray-50/50 dark:hover:bg-[#141414]";

export default function QuestionsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("pending");

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "20" });
    if (filter) params.set("status", filter);
    const res = await fetch(`/api/admin/questions?${params}`);
    const data = await res.json();
    setItems(data.items || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [filter]);

  useEffect(() => { setPage(1); fetchData(1); }, [fetchData]);

  async function handleAction(id: string, action: string) {
    await fetch("/api/admin/questions", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: action }),
    });
    fetchData(page);
  }

  const totalPages = Math.ceil(total / 20);
  const selectClass = "px-3 py-1.5 border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-sm bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100";

  return (
    <div>
      <h1 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 mb-4">疑问管理</h1>
      <div className="flex gap-2 mb-4">
        <select value={filter} onChange={e => setFilter(e.target.value)} className={selectClass}>
          <option value="">全部</option>
          <option value="pending">待审核</option>
          <option value="approved">已通过</option>
          <option value="rejected">已拒绝</option>
        </select>
        <span className="px-3 py-1.5 text-sm text-gray-400 dark:text-gray-600">共 {total} 条</span>
      </div>

      {loading ? <p className="text-sm text-gray-400 dark:text-gray-600">加载中...</p> : (
        <>
          <div className="rounded-xl border border-gray-100 dark:border-[#1f1f1f] bg-white dark:bg-[#0d0d0d] overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#1f1f1f]">
                  <th className={th}>提交者</th>
                  <th className={th}>疑问内容</th>
                  <th className={th}>状态</th>
                  <th className={th}>时间</th>
                  <th className={th}>操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map((q: any) => (
                  <tr key={q.id} className={trClass}>
                    <td className={td}>{q.submitterName || "匿名"}</td>
                    <td className={td} style={{ maxWidth: 300 }}><div className="truncate">{q.content}</div></td>
                    <td className={td}>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        q.status === "approved" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        : q.status === "rejected" ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                        : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                      }`}>
                        {q.status === "approved" ? "已通过" : q.status === "rejected" ? "已拒绝" : "待审核"}
                      </span>
                    </td>
                    <td className={tdMuted + " whitespace-nowrap text-xs"}>
                      {new Date(q.createdAt).toLocaleString("zh-CN")}
                    </td>
                    <td className="py-2.5 px-4">
                      {q.status === "pending" && (
                        <div className="flex gap-1.5">
                          <button onClick={() => handleAction(q.id, "approved")}
                            className="px-2.5 py-1 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50">通过</button>
                          <button onClick={() => handleAction(q.id, "rejected")}
                            className="px-2.5 py-1 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50">拒绝</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-400 dark:text-gray-600">暂无疑问</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => { setPage(i + 1); fetchData(i + 1); }}
                  className={`px-3 py-1 rounded text-sm ${page === i + 1 ? "bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900" : "bg-gray-100 dark:bg-[#1f1f1f] text-gray-600 dark:text-gray-400"}`}>
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
