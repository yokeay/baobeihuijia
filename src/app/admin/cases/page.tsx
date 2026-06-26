"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAdmin } from "../context";

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

const statusKeys = ["pending", "approved", "rejected"] as const;
const sourceKeys = ["api", "user_submit"] as const;

export default function AdminCasesPage() {
  const { t } = useAdmin();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "api" | "user_submit">("all");
  const [search, setSearch] = useState("");

  const statusLabels: Record<string, string> = {
    pending: t.cases.statusPending,
    approved: t.cases.statusApproved,
    rejected: t.cases.statusRejected,
  };

  const sourceLabels: Record<string, string> = {
    api: t.cases.sourceApi,
    user_submit: t.cases.sourceUser,
    crawl: t.cases.sourceCrawl,
  };

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
        <h2 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">{t.cases.title}</h2>
        <span className="text-[12px] text-gray-400 dark:text-gray-500">
          {t.cases.showing.replace("{filtered}", String(filtered.length)).replace("{total}", String(cases.length))}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex rounded-md border border-gray-200 dark:border-[#1f1f1f] overflow-hidden text-[12px]">
          {(["all", ...statusKeys] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 transition-colors ${
                filter === f
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium"
                  : "text-gray-500 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-[#141414]"
              }`}
            >
              {f === "all" ? t.cases.all : statusLabels[f]}
            </button>
          ))}
        </div>
        <div className="flex rounded-md border border-gray-200 dark:border-[#1f1f1f] overflow-hidden text-[12px]">
          {(["all", ...sourceKeys] as const).map((f) => (
            <button
              key={f}
              onClick={() => setSourceFilter(f)}
              className={`px-3 py-1.5 transition-colors ${
                sourceFilter === f
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium"
                  : "text-gray-500 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-[#141414]"
              }`}
            >
              {f === "all" ? t.cases.allSources : sourceLabels[f]}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.cases.searchPlaceholder}
          className="px-3 py-1.5 text-[12px] border border-gray-200 dark:border-[#1f1f1f] rounded-md bg-white dark:bg-[#0d0d0d] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 flex-1 min-w-[160px] max-w-xs outline-none focus:border-gray-400 dark:focus:border-gray-600"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-100 dark:border-[#1f1f1f] bg-white dark:bg-[#0d0d0d] overflow-hidden">
        {loading ? (
          <p className="text-[13px] text-gray-400 py-12 text-center">{t.cases.loading}</p>
        ) : filtered.length === 0 ? (
          <p className="text-[13px] text-gray-400 py-12 text-center">{t.cases.noData}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#1f1f1f]">
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-500">{t.cases.name}</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-500">{t.cases.lostLocation}</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-500">{t.cases.lostDate}</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-500">{t.cases.source}</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-500">{t.cases.status}</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-500">{t.cases.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50 dark:border-[#1a1a1a] hover:bg-gray-50/50 dark:hover:bg-[#141414]">
                    <td className="py-2.5 px-4 font-medium">{item.name}</td>
                    <td className="py-2.5 px-4 text-gray-500 dark:text-gray-500">
                      {[item.lostProvince, item.lostCity].filter(Boolean).join(" ") || "-"}
                    </td>
                    <td className="py-2.5 px-4 text-gray-500 dark:text-gray-500">{item.lostDate || "-"}</td>
                    <td className="py-2.5 px-4">
                      <span className="text-[11px] px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                        {sourceLabels[item.source] || item.source}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="text-[11px] px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                        {statusLabels[item.status] || item.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <Link
                        href={`/case/${item.id}`}
                        className="text-[12px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {t.cases.viewDetail}
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
