"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { ReviewQueue } from "@/components/admin/ReviewQueue";
import { showToast, ToastContainer } from "@/components/ui/Toast";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cases");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      setCases(data);
      setStats({
        pending: data.filter((c: any) => c.status === "pending").length,
        approved: data.filter((c: any) => c.status === "approved").length,
        rejected: data.filter((c: any) => c.status === "rejected").length,
      });
    } catch {
      showToast("加载失败", "error");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  async function handleReview(id: string, status: "approved" | "rejected") {
    try {
      const res = await fetch("/api/admin/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        showToast(status === "approved" ? "已通过" : "已拒绝", "success");
        fetchCases();
      } else {
        showToast("操作失败", "error");
      }
    } catch {
      showToast("操作失败", "error");
    }
  }

  async function handleSync() {
    try {
      showToast("正在同步...", "info");
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      showToast(`同步完成：新增 ${data.added}，跳过 ${data.skipped}，错误 ${data.errors}`, "success");
      fetchCases();
    } catch {
      showToast("同步失败", "error");
    }
  }

  return (
    <div className="min-h-full bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <Container>
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <h1 className="font-bold text-primary">宝贝回家 · 管理后台</h1>
              <span className="text-xs text-gray-400">|</span>
              <a href="/" className="text-xs text-gray-500 hover:text-primary">返回首页</a>
            </div>
            <Button variant="outline" size="sm" onClick={handleSync}>同步API数据</Button>
          </div>
        </Container>
      </header>

      <main className="py-6">
        <Container>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatCard label="待审核" value={stats.pending} color="bg-yellow-50 text-yellow-700" />
            <StatCard label="已通过" value={stats.approved} color="bg-green-50 text-green-700" />
            <StatCard label="已拒绝" value={stats.rejected} color="bg-red-50 text-red-700" />
          </div>

          {/* Review Queue */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-semibold text-lg mb-4">审核队列</h2>
            <ReviewQueue cases={cases} onReview={handleReview} loading={loading} />
          </div>
        </Container>
      </main>
      <ToastContainer />
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl p-4 ${color}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm opacity-80">{label}</p>
    </div>
  );
}
