"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "../context";
import Drawer from "@/components/ui/Drawer";
import {
  Badge,
  DetailField,
  DrawerSection,
  EmptyState,
  IconButton,
  MetaFooter,
  PageHeader,
  Pagination,
  Panel,
  PhotoStrip,
  SearchField,
  Segmented,
  Table,
  TableSkeleton,
  Td,
  Th,
  Tr,
  statusTone,
} from "@/components/ui/admin/kit";
import { RefreshIcon, PencilIcon, FolderIcon } from "@/components/ui/Icon";

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

  const editingCount = Object.keys(editForm).length;

  return (
    <div>
      <PageHeader
        title={t.cases.title}
        description={t.cases.showing.replace("{filtered}", String(filtered.length)).replace("{total}", String(total))}
        actions={
          <IconButton label="刷新" onClick={() => fetchCases(page)}>
            <RefreshIcon size={16} />
          </IconButton>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: t.cases.all },
              ...statusKeys.map((k) => ({ value: k, label: statusLabels[k] })),
            ]}
          />
          <Segmented
            value={sourceFilter}
            onChange={setSourceFilter}
            options={[
              { value: "all", label: t.cases.allSources },
              ...sourceKeys.map((k) => ({ value: k, label: sourceLabels[k] })),
            ]}
          />
        </div>
        <SearchField
          value={search}
          onChange={setSearch}
          onSubmit={() => fetchCases(1)}
          placeholder={t.cases.searchPlaceholder}
          className="w-full sm:w-72"
        />
      </div>

      {/* Table */}
      <Panel>
        {loading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : filtered.length === 0 ? (
          <EmptyState title={t.cases.noData} icon={<FolderIcon size={20} />} />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>{t.cases.name}</Th>
                  <Th>{t.cases.lostLocation}</Th>
                  <Th>{t.cases.lostDate}</Th>
                  <Th>{t.cases.source}</Th>
                  <Th>{t.cases.status}</Th>
                  <Th align="right">{t.cases.actions}</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <Tr key={item.id}>
                    <Td className="font-medium">{item.name}</Td>
                    <Td muted>
                      {[item.lostProvince, item.lostCity].filter(Boolean).join(" ") || "-"}
                    </Td>
                    <Td muted className="whitespace-nowrap tabular-nums">{item.lostDate || "-"}</Td>
                    <Td>
                      <Badge tone="neutral">{sourceLabels[item.source] || item.source}</Badge>
                    </Td>
                    <Td>
                      <Badge tone={statusTone(item.status)}>
                        {statusLabels[item.status] || item.status}
                      </Badge>
                    </Td>
                    <Td align="right">
                      <button
                        type="button"
                        onClick={() => openDrawer(item.id)}
                        className="inline-flex items-center h-8 px-3 rounded-lg cursor-pointer bg-white dark:bg-transparent border border-black/[0.08] dark:border-white/[0.10] text-[12px] font-medium text-[#475467] dark:text-[#98a2b3] hover:text-[#101828] dark:hover:text-white hover:border-black/[0.16] dark:hover:border-white/[0.20] active:scale-[0.97] transition-all duration-200"
                      >
                        {t.cases.viewDetail}
                      </button>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>

            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              onChange={goToPage}
              totalLabel={t.cases.showing.replace("{filtered}", String(filtered.length)).replace("{total}", String(total))}
            />
          </>
        )}
      </Panel>

      <Drawer open={drawerOpen} onClose={closeDrawer} title={t.cases.drawerTitle}>
        {selectedCase && (
          <div className="space-y-6">
            {/* Photos */}
            {parsePhotos(selectedCase.photoUrls).length > 0 && (
              <DrawerSection title="照片">
                <PhotoStrip photos={parsePhotos(selectedCase.photoUrls)} />
              </DrawerSection>
            )}

            {/* Editable fields */}
            <DrawerSection title="档案信息">
              <div className="space-y-1">
                {editableFields.map(({ key, label }) => {
                  const isEditing = key in editForm;
                  const value = isEditing ? editForm[key] : (selectedCase as unknown as Record<string, unknown>)[key];

                  if (isEditing) {
                    return (
                      <div
                        key={key}
                        className="rounded-xl border border-[#e60012]/25 bg-[#e60012]/[0.03] dark:bg-[#e60012]/[0.06] px-3 py-2.5"
                      >
                        <span className="block text-[11px] font-medium text-[#c1000f] dark:text-[#ff8a92]">{label}</span>
                        <input
                          type={key === "height" ? "number" : "text"}
                          value={value === null || value === undefined ? "" : String(value)}
                          onChange={(e) => updateEditForm(key, e.target.value)}
                          className="mt-1.5 w-full h-9 px-3 rounded-lg text-[13px] bg-white dark:bg-[#0d0e10] border border-black/[0.08] dark:border-white/[0.10] text-[#101828] dark:text-white outline-none focus:border-[#e60012]/40 focus:shadow-[0_0_0_3px_rgba(230,0,18,0.08)] transition-all"
                        />
                      </div>
                    );
                  }

                  return (
                    <div
                      key={key}
                      className="group flex items-start justify-between gap-3 rounded-xl px-3 py-2.5 hover:bg-black/[0.025] dark:hover:bg-white/[0.03] transition-colors"
                    >
                      <div className="min-w-0">
                        <span className="block text-[11px] text-[#98a2b3] dark:text-[#667085]">{label}</span>
                        <p className="mt-0.5 text-[13px] leading-5 break-words text-[#344054] dark:text-[#d0d5dd]">
                          {value === null || value === undefined || value === "" ? (
                            <span className="text-[#d0d5dd] dark:text-[#475467]">—</span>
                          ) : (
                            String(value)
                          )}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => startEdit(key, value as string | number | null)}
                        className="flex-shrink-0 inline-flex items-center gap-1 h-7 px-2 rounded-lg cursor-pointer text-[11px] font-medium text-[#98a2b3] hover:text-[#e60012] hover:bg-[#e60012]/[0.08] opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
                      >
                        <PencilIcon size={13} />
                        {t.cases.edit}
                      </button>
                    </div>
                  );
                })}
              </div>
            </DrawerSection>

            {/* Read-only fields */}
            <DrawerSection title="系统信息">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
                <DetailField label={t.cases.status} value={<Badge tone={statusTone(selectedCase.status)}>{statusLabels[selectedCase.status] || selectedCase.status}</Badge>} />
                <DetailField label={t.cases.source} value={<Badge tone="neutral">{sourceLabels[selectedCase.source] || selectedCase.source}</Badge>} />
                <DetailField label="创建时间" value={new Date(selectedCase.createdAt).toLocaleString()} />
                <DetailField label="更新时间" value={new Date(selectedCase.updatedAt).toLocaleString()} />
                {selectedCase.reviewedBy ? (
                  <DetailField
                    label="审核人"
                    value={`${selectedCase.reviewedBy} · ${selectedCase.reviewedAt || "-"}`}
                    className="col-span-2"
                  />
                ) : null}
              </div>
            </DrawerSection>

            <MetaFooter>
              <p>ID · {selectedCase.id}</p>
            </MetaFooter>

            {/* Save / Cancel */}
            {editingCount > 0 && (
              <div className="sticky bottom-0 -mx-5 -mb-5 px-5 py-3 bg-white/90 dark:bg-[#0d0e10]/90 backdrop-blur border-t border-black/[0.06] dark:border-white/[0.06] flex items-center gap-2">
                <span className="mr-auto text-[12px] text-[#98a2b3]">已修改 {editingCount} 项</span>
                <button
                  type="button"
                  onClick={() => setEditForm({})}
                  className="h-9 px-4 rounded-xl cursor-pointer text-[12.5px] font-medium bg-white dark:bg-transparent border border-black/[0.08] dark:border-white/[0.10] text-[#475467] dark:text-[#98a2b3] hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-colors"
                >
                  {t.cases.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="h-9 px-4 rounded-xl cursor-pointer text-[12.5px] font-medium bg-[#e60012] text-white shadow-[0_1px_2px_rgba(230,0,18,0.28)] hover:bg-[#c1000f] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {saving ? "保存中…" : t.cases.save}
                </button>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
