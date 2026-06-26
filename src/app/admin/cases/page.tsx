"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface CaseItem {
  id: string;
  name: string;
  gender: string | null;
  lostDate: string | null;
  lostProvince: string | null;
  lostCity: string | null;
  status: string;
  source: string;
  createdAt: string;
  photoUrls: string;
  submitterName: string | null;
}

const statusLabels: Record<string, string> = {
  pending: "待审核",
  approved: "已通过",
  rejected: "已拒绝",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const sourceLabels: Record<string, string> = {
  api: "API同步",
  user_submit: "用户提交",
  crawl: "爬取",
};

export default function AdminCasesPage() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "api" | "user_submit">("all");
  const [search, setSearch] = useState("");

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cases");
      if (res.ok) {
        const data = await res.json();
        setCases(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  const filtered = cases.filter((c) => {
    if (filter !== "all" && c.status !== filter) return false;
    if (sourceFilter !== "all" && c.source !== sourceFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const match =
        c.name.toLowerCase().includes(q) ||
        c.lostProvince?.toLowerCase().includes(q) ||
        c.lostCity?.toLowerCase().includes(q) ||
        c.submitterName?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">案件管理</h2>
        <span className="text-sm text-gray-400">
          显示 {filtered.length} / {cases.length} 条
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          {(["all", "pending", "approved", "rejected"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 ${
                filter === f
                  ? "bg-primary text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f === "all" ? "全部" : statusLabels[f]}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          {(["all", "api", "user_submit"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setSourceFilter(f)}
              className={`px-3 py-1.5 ${
                sourceFilter === f
                  ? "bg-primary text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f === "all" ? "全部来源" : sourceLabels[f]}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索姓名、地点..."
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg flex-1 min-w-[160px] max-w-xs"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <p className="text-gray-400 text-sm py-12 text-center">加载中...</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-400 text-sm py-12 text-center">暂无数据</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">姓名</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">走失地点</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">走失日期</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">来源</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">状态</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-medium">{item.name}</td>
                    <td className="py-3 px-4 text-gray-500">
                      {[item.lostProvince, item.lostCity].filter(Boolean).join(" ") || "-"}
                    </td>
                    <td className="py-3 px-4 text-gray-500">{item.lostDate || "-"}</td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                        {sourceLabels[item.source] || item.source}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${statusColors[item.status] || ""}`}
                      >
                        {statusLabels[item.status] || item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/case/${item.id}`}
                        className="text-xs text-primary hover:underline"
                      >
                        查看详情
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
