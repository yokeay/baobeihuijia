"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "../context";
import Drawer from "@/components/ui/Drawer";

interface CaseItem {
  id: string;
  name: string;
  gender: string | null;
  birthDate: string | null;
  lostDate: string | null;
  lostProvince: string | null;
  lostCity: string | null;
  lostDistrict: string | null;
  lostAddress: string | null;
  height: number | null;
  feature: string | null;
  photoUrls: string;
  source: string;
  sourceUrl: string | null;
  sourceId: string | null;
  status: string;
  submitterName: string | null;
  submitterContact: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const statusKeys = ["pending", "approved", "rejected"] as const;
const sourceKeys = ["api", "user_submit"] as const;

function parsePhotos(photoUrls: string): string[] {
  try {
    const arr = JSON.parse(photoUrls);
    if (Array.isArray(arr)) return arr.filter((u: unknown) => typeof u === "string" && u.length > 0);
  } catch { /* ignore */ }
  if (typeof photoUrls === "string" && photoUrls.length > 0) return [photoUrls];
  return [];
}

export default function AdminCasesPage() {
  const { t } = useAdmin();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "api" | "user_submit">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string | number | null>>({});
  const [saving, setSaving] = useState(false);

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

  const fetchCases = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(p));
      params.set("limit", "20");
      if (filter !== "all") params.set("status", filter);
      if (sourceFilter !== "all") params.set("source", sourceFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/cases?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCases(data.items);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filter, sourceFilter, search]);

  useEffect(() => {
    setPage(1);
    fetchCases(1);
  }, [fetchCases]);

  const filtered = cases;

  async function openDrawer(id: string) {
    try {
      const res = await fetch(`/api/admin/cases/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedCase(data);
        setEditForm({});
        setDrawerOpen(true);
      }
    } catch {
      // ignore
    }
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setSelectedCase(null);
    setEditForm({});
  }

  function startEdit(field: string, value: string | number | null) {
    setEditForm((prev) => {
      const next = { ...prev };
      if (field in next) {
        delete next[field];
      } else {
        next[field] = value ?? "";
      }
      return next;
    });
  }

  function updateEditForm(field: string, value: string) {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!selectedCase || Object.keys(editForm).length === 0) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(editForm)) {
        if (k === "height") {
          body[k] = v === "" || v === null ? null : parseInt(String(v), 10);
        } else {
          body[k] = v ?? null;
        }
      }
      const res = await fetch(`/api/admin/cases/${selectedCase.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedCase(updated);
        setEditForm({});
        fetchCases(page);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  const editableFields: { key: string; label: string }[] = [
    { key: "name", label: t.cases.name },
    { key: "gender", label: t.review.gender },
    { key: "birthDate", label: t.review.birthDate },
    { key: "lostDate", label: t.cases.lostDate },
    { key: "lostProvince", label: t.review.province },
    { key: "lostCity", label: t.review.city },
    { key: "lostDistrict", label: "区县" },
    { key: "lostAddress", label: "走失地址" },
    { key: "height", label: t.review.height },
    { key: "feature", label: "体貌特征" },
    { key: "submitterName", label: t.review.submitter_label },
    { key: "submitterContact", label: t.review.contact },
  ];

  function goToPage(p: number) {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    fetchCases(p);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">{t.cases.title}</h2>
        <span className="text-[12px] text-gray-400 dark:text-gray-500">
          {t.cases.showing.replace("{filtered}", String(filtered.length)).replace("{total}", String(total))}
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
          <>
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
                        <button
                          onClick={() => openDrawer(item.id)}
                          className="text-[12px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
                        >
                          {t.cases.viewDetail}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-[#1f1f1f]">
              <span className="text-[12px] text-gray-400 dark:text-gray-500">
                {t.cases.showing.replace("{filtered}", String(filtered.length)).replace("{total}", String(total))}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="px-2.5 py-1 text-[12px] rounded-md border border-gray-200 dark:border-[#1f1f1f] text-gray-500 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-[#141414] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ←
                </button>
                <span className="text-[12px] text-gray-500 dark:text-gray-500 px-1 tabular-nums">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className="px-2.5 py-1 text-[12px] rounded-md border border-gray-200 dark:border-[#1f1f1f] text-gray-500 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-[#141414] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  →
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Drawer */}
      <Drawer open={drawerOpen} onClose={closeDrawer} title={t.cases.drawerTitle}>
        {selectedCase && (
          <div className="space-y-5 text-[13px]">
            {/* Photos */}
            {parsePhotos(selectedCase.photoUrls).length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {parsePhotos(selectedCase.photoUrls).map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className="w-24 h-24 object-cover rounded-lg border border-gray-100 dark:border-[#1f1f1f] flex-shrink-0"
                  />
                ))}
              </div>
            )}

            {/* Editable fields */}
            {editableFields.map(({ key, label }) => {
              const isEditing = key in editForm;
              const value = isEditing ? editForm[key] : (selectedCase as unknown as Record<string, unknown>)[key];

              return (
                <div key={key} className="flex flex-col gap-1">
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">{label}</span>
                  {isEditing ? (
                    <input
                      type={key === "height" ? "number" : "text"}
                      value={value === null || value === undefined ? "" : String(value)}
                      onChange={(e) => updateEditForm(key, e.target.value)}
                      className="px-2.5 py-1.5 text-[13px] border border-gray-200 dark:border-[#1f1f1f] rounded-md bg-white dark:bg-[#0d0d0d] text-gray-900 dark:text-gray-100 outline-none focus:border-gray-400 dark:focus:border-gray-600"
                    />
                  ) : (
                    <div className="flex items-center justify-between group">
                      <span className="text-gray-700 dark:text-gray-300">
                        {value === null || value === undefined || value === "" ? (
                          <span className="text-gray-300 dark:text-gray-600">-</span>
                        ) : (
                          String(value)
                        )}
                      </span>
                      <button
                        onClick={() => startEdit(key, value as string | number | null)}
                        className="text-[11px] text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        {t.cases.edit}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Read-only fields */}
            <div className="pt-4 border-t border-gray-100 dark:border-[#1f1f1f] space-y-3">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-gray-400 dark:text-gray-500">ID</span>
                <span className="text-[12px] text-gray-400 dark:text-gray-600 font-mono">{selectedCase.id}</span>
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">{t.cases.status}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 inline-block w-fit">
                    {statusLabels[selectedCase.status] || selectedCase.status}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">{t.cases.source}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 inline-block w-fit">
                    {sourceLabels[selectedCase.source] || selectedCase.source}
                  </span>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">创建时间</span>
                  <span className="text-gray-600 dark:text-gray-400">{new Date(selectedCase.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">更新时间</span>
                  <span className="text-gray-600 dark:text-gray-400">{new Date(selectedCase.updatedAt).toLocaleString()}</span>
                </div>
              </div>
              {selectedCase.reviewedBy && (
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">审核人</span>
                  <span className="text-gray-600 dark:text-gray-400">{selectedCase.reviewedBy} · {selectedCase.reviewedAt || "-"}</span>
                </div>
              )}
            </div>

            {/* Save / Cancel */}
            {Object.keys(editForm).length > 0 && (
              <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-[#1f1f1f]">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-1.5 text-[12px] rounded-md bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? "..." : t.cases.save}
                </button>
                <button
                  onClick={() => setEditForm({})}
                  className="px-4 py-1.5 text-[12px] rounded-md border border-gray-200 dark:border-[#1f1f1f] text-gray-500 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-[#141414] transition-colors"
                >
                  {t.cases.cancel}
                </button>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
