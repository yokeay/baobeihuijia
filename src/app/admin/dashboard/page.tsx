"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAdmin } from "../context";
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
  const { t } = useAdmin();
  const [stats, setStats] = useState({ total: 0, byStatus: { pending: 0, approved: 0, rejected: 0 }, bySource: { api: 0, user_submit: 0, crawl: 0 }, cluePending: 0, clueRejected: 0 });
  const [pendingCases, setPendingCases] = useState<CaseItem[]>([]);
  const [pendingClues, setPendingClues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, pendingRes, cluesRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/cases?status=pending&limit=20"),
        fetch("/api/admin/clues?status=pending&limit=20"),
      ]);
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (pendingRes.ok) {
        const data = await pendingRes.json();
        setPendingCases(data.items);
      }
      if (cluesRes.ok) {
        const data = await cluesRes.json();
        setPendingClues(data.items);
        setStats((prev) => ({ ...prev, cluePending: data.total }));
      }
    } catch {
      showToast(t.dashboard.loadFailed, "error");
    } finally {
      setLoading(false);
    }
  }, [t.dashboard.loadFailed]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleReview(id: string, status: "approved" | "rejected") {
    try {
      const res = await fetch("/api/admin/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        showToast(status === "approved" ? t.dashboard.approvedToast : t.dashboard.rejectedToast, "success");
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || t.dashboard.operationFailed, "error");
      }
    } catch {
      showToast(t.dashboard.operationFailed, "error");
    }
  }

  async function handleSync() {
    try {
      showToast(t.dashboard.syncInProgress, "info");
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      showToast(t.dashboard.syncSuccess.replace("{added}", data.added).replace("{skipped}", data.skipped), "success");
      fetchData();
    } catch {
      showToast(t.dashboard.syncFailed, "error");
    }
  }

  const rejectedTotal = stats.byStatus.rejected + (stats.clueRejected || 0);
  const statCards = [
    { label: t.dashboard.totalCases, value: stats.total },
    { label: t.dashboard.pendingReview, value: stats.byStatus.pending },
    { label: t.dashboard.approved, value: stats.byStatus.approved },
    { label: t.dashboard.rejected, value: rejectedTotal },
    { label: t.dashboard.pendingClues, value: stats.cluePending },
  ];

  const handleClueReview = async (id: string, status: "approved" | "rejected") => {
    try {
      const res = await fetch("/api/admin/clues/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        showToast(status === "approved" ? t.dashboard.approvedToast : t.dashboard.rejectedToast, "success");
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || t.dashboard.operationFailed, "error");
      }
    } catch {
      showToast(t.dashboard.operationFailed, "error");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">{t.dashboard.title}</h2>
        <button
          onClick={handleSync}
          className="px-3.5 py-1.5 text-[12px] rounded-md bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-medium"
        >
          {t.dashboard.syncButton}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {statCards.map((s, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-100 dark:border-[#1f1f1f] bg-white dark:bg-[#0d0d0d] p-4"
          >
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{s.value.toLocaleString()}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-500 mt-0.5 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pending Table */}
      <div className="rounded-xl border border-gray-100 dark:border-[#1f1f1f] bg-white dark:bg-[#0d0d0d] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-[#1f1f1f]">
          <h3 className="text-[13px] font-medium text-gray-900 dark:text-gray-100">
            {t.dashboard.pendingCases} ({stats.byStatus.pending})
          </h3>
          <Link href="/admin/review" className="text-[12px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            {t.dashboard.viewAll}
          </Link>
        </div>

        {loading ? (
          <p className="text-[13px] text-gray-400 py-10 text-center">{t.dashboard.loading}</p>
        ) : pendingCases.length === 0 ? (
          <p className="text-[13px] text-gray-400 py-10 text-center">{t.dashboard.noPending}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-gray-50 dark:border-[#1a1a1a]">
                  <th className="text-left py-2.5 px-5 font-medium text-gray-500 dark:text-gray-500">{t.dashboard.name}</th>
                  <th className="text-left py-2.5 px-5 font-medium text-gray-500 dark:text-gray-500">{t.dashboard.lostLocation}</th>
                  <th className="text-left py-2.5 px-5 font-medium text-gray-500 dark:text-gray-500">{t.dashboard.submitter}</th>
                  <th className="text-left py-2.5 px-5 font-medium text-gray-500 dark:text-gray-500">{t.dashboard.source}</th>
                  <th className="text-right py-2.5 px-5 font-medium text-gray-500 dark:text-gray-500">{t.dashboard.actions}</th>
                </tr>
              </thead>
              <tbody>
                {pendingCases.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50 dark:border-[#1a1a1a] hover:bg-gray-50/50 dark:hover:bg-[#141414]">
                    <td className="py-2.5 px-5 font-medium">{item.name}</td>
                    <td className="py-2.5 px-5 text-gray-500 dark:text-gray-500">
                      {[item.lostProvince, item.lostCity].filter(Boolean).join(" ") || "-"}
                    </td>
                    <td className="py-2.5 px-5 text-gray-500 dark:text-gray-500">{item.submitterName || "-"}</td>
                    <td className="py-2.5 px-5">
                      <span className="text-[11px] px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                        {item.source === "user_submit" ? t.cases.sourceUser : item.source}
                      </span>
                    </td>
                    <td className="py-2.5 px-5 text-right">
                      <div className="flex gap-1.5 justify-end">
                        <button
                          onClick={() => handleReview(item.id, "approved")}
                          className="px-3 py-1.5 text-[12px] rounded-md bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 font-medium transition-colors"
                        >
                          {t.dashboard.approve}
                        </button>
                        <button
                          onClick={() => handleReview(item.id, "rejected")}
                          className="px-3 py-1.5 text-[12px] rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-colors"
                        >
                          {t.dashboard.reject}
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

      {/* Pending Clues Table */}
      {pendingClues.length > 0 && (
        <div className="rounded-xl border border-gray-100 dark:border-[#1f1f1f] bg-white dark:bg-[#0d0d0d] overflow-hidden mt-4">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-[#1f1f1f]">
            <h3 className="text-[13px] font-medium text-gray-900 dark:text-gray-100">
              {t.dashboard.pendingCluesCount.replace("{count}", String(stats.cluePending))}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-gray-50 dark:border-[#1a1a1a]">
                  <th className="text-left py-2.5 px-5 font-medium text-gray-500 dark:text-gray-500">{t.review.clueAssociateCase}</th>
                  <th className="text-left py-2.5 px-5 font-medium text-gray-500 dark:text-gray-500">{t.review.clueContent}</th>
                  <th className="text-left py-2.5 px-5 font-medium text-gray-500 dark:text-gray-500">{t.dashboard.submitter}</th>
                  <th className="text-right py-2.5 px-5 font-medium text-gray-500 dark:text-gray-500">{t.dashboard.actions}</th>
                </tr>
              </thead>
              <tbody>
                {pendingClues.map((clue: any) => (
                  <tr key={clue.id} className="border-b border-gray-50 dark:border-[#1a1a1a] hover:bg-gray-50/50 dark:hover:bg-[#141414]">
                    <td className="py-2.5 px-5 font-medium">{clue.caseName || "-"}</td>
                    <td className="py-2.5 px-5 text-gray-500 dark:text-gray-500 truncate max-w-[200px]">{clue.content}</td>
                    <td className="py-2.5 px-5 text-gray-500 dark:text-gray-500">{clue.submitterName || "-"}</td>
                    <td className="py-2.5 px-5 text-right">
                      <div className="flex gap-1.5 justify-end">
                        <button
                          onClick={() => handleClueReview(clue.id, "approved")}
                          className="px-3 py-1.5 text-[12px] rounded-md bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 font-medium transition-colors"
                        >
                          {t.dashboard.approve}
                        </button>
                        <button
                          onClick={() => handleClueReview(clue.id, "rejected")}
                          className="px-3 py-1.5 text-[12px] rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-colors"
                        >
                          {t.dashboard.reject}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
}
