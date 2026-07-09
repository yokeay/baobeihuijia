"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "../context";
import { showToast, ToastContainer } from "@/components/ui/Toast";
import { LineChart } from "@/components/ui/LineChart";

export default function AdminDashboardPage() {
  const { t } = useAdmin();
  const [stats, setStats] = useState({ total: 0, byStatus: { pending: 0, approved: 0, rejected: 0 }, bySource: { api: 0, user_submit: 0, crawl: 0 }, cluePending: 0 });
  const [trends, setTrends] = useState<any>(null);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [caseRange, setCaseRange] = useState("7d");
  const [clueRange, setClueRange] = useState("7d");
  const [followRange, setFollowRange] = useState("7d");

  const fetchStats = useCallback(async () => {
    try {
      const [statsRes, cluesRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/clues?status=pending&limit=1"),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (cluesRes.ok) {
        const data = await cluesRes.json();
        setStats((prev) => ({ ...prev, cluePending: data.total }));
      }
    } catch { /* silent */ }
  }, []);

  const fetchTrends = useCallback(async () => {
    setTrendsLoading(true);
    try {
      const res = await fetch(`/api/admin/trends?range=${caseRange}`);
      if (res.ok) setTrends(await res.json());
    } catch { /* silent */ }
    finally { setTrendsLoading(false); }
  }, [caseRange]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchTrends(); }, [fetchTrends]);

  async function handleSync() {
    try {
      showToast(t.dashboard.syncInProgress, "info");
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      showToast(t.dashboard.syncSuccess.replace("{added}", data.added).replace("{skipped}", data.skipped), "success");
      fetchStats();
    } catch {
      showToast(t.dashboard.syncFailed, "error");
    }
  }

  const statCards = [
    { label: t.dashboard.totalCases, value: stats.total },
    { label: t.dashboard.pendingReview, value: stats.byStatus.pending },
    { label: t.dashboard.approved, value: stats.byStatus.approved },
    { label: t.dashboard.rejected, value: stats.byStatus.rejected + (stats.cluePending || 0) },
  ];

  const rangeTabs = [
    { key: "7d", label: "7日" },
    { key: "30d", label: "1个月" },
    { key: "180d", label: "半年" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">{t.dashboard.title}</h2>
        <button
          onClick={handleSync}
          className="px-3.5 py-1.5 text-[12px] rounded-md bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-medium"
        >
          {t.dashboard.syncButton}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3 mb-3">
        {statCards.map((s, i) => (
          <div key={i} className="rounded-xl border border-gray-100 dark:border-[#1f1f1f] bg-white dark:bg-[#0d0d0d] p-4">
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{s.value.toLocaleString()}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-500 mt-0.5 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts: top row (2 charts), bottom row (1 chart) */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Follow trend */}
        <ChartCard
          title="关注趋势"
          range={followRange}
          onRangeChange={(v) => { setFollowRange(v); }}
          loading={trendsLoading}
        >
          {trends && <LineChart data={trends.follows || []} color="#ec4899" height={150} />}
        </ChartCard>

        {/* Case submission trend */}
        <ChartCard
          title="案件提交趋势"
          range={caseRange}
          onRangeChange={(v) => { setCaseRange(v); }}
          loading={trendsLoading}
        >
          {trends && <LineChart data={trends.cases || []} color="#D4821A" height={150} />}
        </ChartCard>
      </div>

      {/* Bottom row: Clue trend */}
      <ChartCard
        title="线索提交趋势"
        range={clueRange}
        onRangeChange={(v) => { setClueRange(v); }}
        loading={trendsLoading}
        className="mb-4"
      >
        {trends && <LineChart data={trends.clues || []} color="#3b82f6" height={150} />}
      </ChartCard>

      <ToastContainer />
    </div>
  );
}

function ChartCard({
  title,
  range,
  onRangeChange,
  children,
  loading,
  className = "",
}: {
  title: string;
  range: string;
  onRangeChange: (v: string) => void;
  children: React.ReactNode;
  loading: boolean;
  className?: string;
}) {
  const rangeTabs = [
    { key: "7d", label: "7日" },
    { key: "30d", label: "1个月" },
    { key: "180d", label: "半年" },
  ];

  return (
    <div className={`rounded-xl border border-gray-100 dark:border-[#1f1f1f] bg-white dark:bg-[#0d0d0d] overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-[#1f1f1f]">
        <h3 className="text-[13px] font-medium text-gray-900 dark:text-gray-100">{title}</h3>
        <div className="flex rounded-lg bg-gray-100 dark:bg-[#1a1a1a] p-0.5">
          {rangeTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onRangeChange(tab.key)}
              className={`px-2.5 py-1 text-[11px] rounded-md font-medium transition-colors ${
                range === tab.key
                  ? "bg-white dark:bg-[#0d0d0d] text-gray-900 dark:text-gray-100 shadow-sm"
                  : "text-gray-500 dark:text-gray-500"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center" style={{ height: 150 }}>
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
