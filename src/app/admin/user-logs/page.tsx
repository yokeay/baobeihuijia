"use client";

import { useState, useEffect, useCallback } from "react";

const ACTION_LABELS: Record<string, string> = {
  login: "登录",
  logout: "退出登录",
  follow: "关注",
  unfollow: "取消关注",
  update_contact: "完善联系方式",
  submit_clue: "提交线索",
  submit_case: "提交寻亲帖",
  submit_question: "提交疑问",
};

export default function UserLogsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");

  const fetchLogs = useCallback(async (p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "50" });
    if (action) params.set("action", action);
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/user-logs?${params}`);
    const data = await res.json();
    setItems(data.items || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [action, search]);

  useEffect(() => { setPage(1); fetchLogs(1); }, [fetchLogs]);

  const totalPages = Math.ceil(total / 50);

  const inputClass = "px-3 py-2 border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-sm bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-700";
  const selectClass = "px-3 py-2 border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-sm bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-700";

  return (
    <div>
      <h1 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 mb-4">用户日志</h1>

      <div className="flex gap-2 mb-4">
        <select value={action} onChange={e => setAction(e.target.value)} className={selectClass}>
          <option value="">全部操作</option>
          {Object.entries(ACTION_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <input type="text" placeholder="搜索用户/目标..." value={search}
          onChange={e => setSearch(e.target.value)} className={inputClass + " flex-1"} />
      </div>

      {loading ? <p className="text-sm text-gray-400 dark:text-gray-600">加载中...</p> : (
        <>
          <div className="rounded-xl border border-gray-100 dark:border-[#1f1f1f] bg-white dark:bg-[#0d0d0d] overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#1f1f1f]">
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-500">时间</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-500">用户</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-500">操作</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-500">目标</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-500">详情</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any) => (
                  <tr key={item.id} className="border-b border-gray-50 dark:border-[#1a1a1a] hover:bg-gray-50/50 dark:hover:bg-[#141414]">
                    <td className="py-2.5 px-4 text-gray-500 dark:text-gray-500 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleString("zh-CN")}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-gray-900 dark:text-gray-100">{item.username}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-[#1f1f1f] text-gray-700 dark:text-gray-300">
                        {ACTION_LABELS[item.action] || item.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-gray-900 dark:text-gray-100">{item.target || "-"}</td>
                    <td className="py-2.5 px-4 text-gray-500 dark:text-gray-500 text-xs">{item.detail || "-"}</td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-400 dark:text-gray-600">暂无记录</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => { setPage(i + 1); fetchLogs(i + 1); }}
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
