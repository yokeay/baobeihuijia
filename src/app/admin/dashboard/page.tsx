"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { showToast, ToastContainer } from "@/components/ui/Toast";

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

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [pendingCases, setPendingCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cases");
      if (res.status === 401) return;
      const data: CaseItem[] = await res.json();
      setStats({
        total: data.length,
        pending: data.filter((c) => c.status === "pending").length,
        approved: data.filter((c) => c.status === "approved").length,
        rejected: data.filter((c) => c.status === "rejected").length,
      });
      setPendingCases(data.filter((c) => c.status === "pending"));
    } catch {
      showToast("加载失败", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleReview(id: string, status: "approved" | "rejected") {
    try {
      const res = await fetch("/api/admin/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        showToast(status === "approved" ? "已通过" : "已拒绝", "success");
        fetchData();
      } else {
        showToast("操作失败", "error");
      }
    } catch {
      showToast("操作失败", "error");
    }
  }

  async function handleSync() {
    try {
      showToast("数据同步中...", "info");
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      showToast(`同步完成：新增 ${data.added}，跳过 ${data.skipped}`, "success");
      fetchData();
    } catch {
      showToast("同步失败", "error");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">仪表盘</h2>
        <button
          onClick={handleSync}
          className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          同步 API 数据
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="案件总数" value={stats.total} color="bg-blue-50 text-blue-700" />
        <StatCard label="待审核" value={stats.pending} color="bg-yellow-50 text-yellow-700" />
        <StatCard label="已通过" value={stats.approved} color="bg-green-50 text-green-700" />
        <StatCard label="已拒绝" value={stats.rejected} color="bg-red-50 text-red-700" />
      </div>

      {/* Pending Review */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-medium">待审核案件 ({pendingCases.length})</h3>
          <Link href="/admin/review" className="text-sm text-primary hover:underline">
            查看全部 →
          </Link>
        </div>

        {loading ? (
          <p className="text-gray-400 text-sm py-8 text-center">加载中...</p>
        ) : pendingCases.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">暂无待审核案件</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left py-3 px-6 font-medium text-gray-500">姓名</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500">走失地点</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500">提交者</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-500">来源</th>
                  <th className="text-right py-3 px-6 font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {pendingCases.slice(0, 10).map((item) => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-6 font-medium">{item.name}</td>
                    <td className="py-3 px-6 text-gray-500">
                      {[item.lostProvince, item.lostCity].filter(Boolean).join(" ") || "-"}
                    </td>
                    <td className="py-3 px-6 text-gray-500">{item.submitterName || "-"}</td>
                    <td className="py-3 px-6">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        {item.source === "user_submit" ? "用户提交" : item.source}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right">
                      <div className="flex gap-1.5 justify-end">
                        <button
                          onClick={() => handleReview(item.id, "approved")}
                          className="px-3 py-1.5 text-xs bg-green-500 text-white rounded-md hover:bg-green-600"
                        >
                          通过
                        </button>
                        <button
                          onClick={() => handleReview(item.id, "rejected")}
                          className="px-3 py-1.5 text-xs bg-red-500 text-white rounded-md hover:bg-red-600"
                        >
                          拒绝
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl p-5 ${color}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm opacity-80 mt-0.5">{label}</p>
    </div>
  );
}
