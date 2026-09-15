"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "../context";
import { ToastContainer } from "@/components/ui/Toast";
import { LineChart } from "@/components/ui/LineChart";
import { IconButton, PageHeader, Panel, Segmented, StatCard, type Tone } from "@/components/ui/admin/kit";
import { RefreshIcon, FolderIcon, ClockIcon, CheckIcon, CloseIcon } from "@/components/ui/Icon";

const RANGE_TABS = [
  { value: "7d", label: "7日" },
  { value: "30d", label: "1个月" },
  { value: "180d", label: "半年" },
] as const;

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

  const statCards: { label: string; value: number; tone: Tone; icon: React.ReactNode }[] = [
    { label: t.dashboard.totalCases, value: stats.total, tone: "brand", icon: <FolderIcon size={15} /> },
    { label: t.dashboard.pendingReview, value: stats.byStatus.pending, tone: "warning", icon: <ClockIcon size={15} /> },
    { label: t.dashboard.approved, value: stats.byStatus.approved, tone: "success", icon: <CheckIcon size={15} /> },
    { label: t.dashboard.rejected, value: stats.byStatus.rejected + (stats.cluePending || 0), tone: "danger", icon: <CloseIcon size={15} /> },
  ];

  return (
    <div>
      <PageHeader
        title={t.dashboard.title}
        description="平台整体数据概览与近期提交趋势"
        actions={
          <IconButton label="刷新" onClick={() => { fetchStats(); fetchTrends(); }}>
            <RefreshIcon size={16} />
          </IconButton>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        {statCards.map((s) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value.toLocaleString()}
            tone={s.tone}
            icon={s.icon}
          />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        <ChartCard
          title="关注趋势"
          range={followRange}
          onRangeChange={setFollowRange}
          loading={trendsLoading}
        >
          {trends && <LineChart data={trends.follows || []} color="#ec4899" height={150} />}
        </ChartCard>

        <ChartCard
          title="案件提交趋势"
          range={caseRange}
          onRangeChange={setCaseRange}
          loading={trendsLoading}
        >
          {trends && <LineChart data={trends.cases || []} color="#D4821A" height={150} />}
        </ChartCard>

        <ChartCard
          title="线索提交趋势"
          range={clueRange}
          onRangeChange={setClueRange}
          loading={trendsLoading}
        >
          {trends && <LineChart data={trends.clues || []} color="#3b82f6" height={150} />}
        </ChartCard>
      </div>

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
}: {
  title: string;
  range: string;
  onRangeChange: (v: string) => void;
  children: React.ReactNode;
  loading: boolean;
}) {
  return (
    <Panel>
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-black/[0.06] dark:border-white/[0.06]">
        <h3 className="text-[13px] font-medium text-[#101828] dark:text-white truncate">{title}</h3>
        <Segmented value={range} onChange={onRangeChange} options={RANGE_TABS} />
      </div>
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center" style={{ height: 150 }}>
            <div className="w-5 h-5 border-2 border-black/10 border-t-[#e60012] rounded-full animate-spin" />
          </div>
        ) : (
          children
        )}
      </div>
    </Panel>
  );
}
