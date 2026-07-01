"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "../context";
import { showToast, ToastContainer } from "@/components/ui/Toast";
import Drawer from "@/components/ui/Drawer";

interface CaseItem {
  id: string;
  name: string;
  gender: string | null;
  lostDate: string | null;
  lostProvince: string | null;
  lostCity: string | null;
  lostDistrict: string | null;
  status: string;
  source: string;
  createdAt: string;
  photoUrls: string;
  submitterName: string | null;
  submitterContact: string | null;
  lostAddress: string | null;
  feature: string | null;
  birthDate: string | null;
  height: number | null;
}

interface ClueItem {
  id: string;
  caseId: string;
  caseName: string;
  content: string;
  photoUrls: string;
  submitterName: string | null;
  submitterContact: string | null;
  status: string;
  createdAt: string;
}

export default function AdminReviewPage() {
  const { t } = useAdmin();
  const [tab, setTab] = useState<"cases" | "clues">("cases");
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [clues, setClues] = useState<ClueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [casePage, setCasePage] = useState(1);
  const [cluePage, setCluePage] = useState(1);
  const [caseTotal, setCaseTotal] = useState(0);
  const [clueTotal, setClueTotal] = useState(0);
  const [caseTotalPages, setCaseTotalPages] = useState(0);
  const [clueTotalPages, setClueTotalPages] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerItem, setDrawerItem] = useState<CaseItem | ClueItem | null>(null);
  const limit = 20;

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: "pending", limit: String(limit), page: String(casePage) });
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/admin/cases?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCases(data.items);
        setCaseTotal(data.total);
        setCaseTotalPages(data.totalPages);
      }
    } catch {
      showToast(t.review.loadFailed, "error");
    } finally {
      setLoading(false);
    }
  }, [casePage, search, t.review.loadFailed]);

  const fetchClues = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: "pending", limit: String(limit), page: String(cluePage) });
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/admin/clues?${params}`);
      if (res.ok) {
        const data = await res.json();
        setClues(data.items);
        setClueTotal(data.total);
        setClueTotalPages(data.totalPages);
      }
    } catch {
      showToast(t.review.loadFailed, "error");
    } finally {
      setLoading(false);
    }
  }, [cluePage, search, t.review.loadFailed]);

  useEffect(() => {
    if (tab === "cases") fetchCases();
    else fetchClues();
  }, [tab, fetchCases, fetchClues]);

  // Reset pagination when tab or search changes
  useEffect(() => {
    setCasePage(1);
    setCluePage(1);
  }, [tab, search]);

  async function handleClueReview(id: string, status: "approved" | "rejected") {
    try {
      const res = await fetch("/api/admin/clues/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        showToast(status === "approved" ? t.review.approvedToast : t.review.rejectedToast, "success");
        fetchClues();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || t.review.operationFailed, "error");
      }
    } catch {
      showToast(t.review.operationFailed, "error");
    }
  }

  async function handleReview(id: string, status: "approved" | "rejected") {
    try {
      const res = await fetch("/api/admin/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        showToast(status === "approved" ? t.review.approvedToast : t.review.rejectedToast, "success");
        fetchCases();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || t.review.operationFailed, "error");
      }
    } catch {
      showToast(t.review.operationFailed, "error");
    }
  }

  function openDrawer(item: CaseItem | ClueItem) {
    setDrawerItem(item);
    setDrawerOpen(true);
  }

  const isCaseItem = (item: CaseItem | ClueItem): item is CaseItem => {
    return "lostProvince" in item;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1">
          <h2 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 mr-4">{t.review.title}</h2>
          <div className="flex rounded-lg bg-gray-100 dark:bg-[#1a1a1a] p-0.5">
            <button
              onClick={() => setTab("cases")}
              className={`px-3 py-1 text-[12px] rounded-md font-medium transition-colors ${
                tab === "cases"
                  ? "bg-white dark:bg-[#0d0d0d] text-gray-900 dark:text-gray-100 shadow-sm"
                  : "text-gray-500 dark:text-gray-500"
              }`}
            >
              {t.review.title}
            </button>
            <button
              onClick={() => setTab("clues")}
              className={`px-3 py-1 text-[12px] rounded-md font-medium transition-colors ${
                tab === "clues"
                  ? "bg-white dark:bg-[#0d0d0d] text-gray-900 dark:text-gray-100 shadow-sm"
                  : "text-gray-500 dark:text-gray-500"
              }`}
            >
              {t.review.cluesTab}
            </button>
          </div>
        </div>
        <span className="text-[12px] text-gray-400 dark:text-gray-500">
          {t.review.count.replace("{count}", String(tab === "cases" ? caseTotal : clueTotal))}
        </span>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.review.searchPlaceholder}
          className="w-full max-w-sm px-3.5 py-2 text-[13px] rounded-lg border border-gray-200 dark:border-[#1f1f1f] bg-white dark:bg-[#0d0d0d] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-800"
        />
      </div>

      {loading ? (
        <p className="text-[13px] text-gray-400 py-16 text-center">{t.review.loading}</p>
      ) : tab === "cases" ? (
        cases.length === 0 ? (
          <div className="rounded-xl border border-gray-100 dark:border-[#1f1f1f] bg-white dark:bg-[#0d0d0d] py-16 text-center">
            <p className="text-[13px] text-gray-400">{t.review.empty}</p>
            <p className="text-[11px] text-gray-300 dark:text-gray-600 mt-1">{t.review.emptyHint}</p>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-gray-100 dark:border-[#1f1f1f] bg-white dark:bg-[#0d0d0d] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-[#1f1f1f]">
                      <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-500">{t.dashboard.name}</th>
                      <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-500">{t.review.gender}</th>
                      <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-500">{t.review.height}</th>
                      <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-500">{t.dashboard.lostLocation}</th>
                      <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-500">{t.review.lostDate}</th>
                      <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-500">{t.dashboard.source}</th>
                      <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-500">{t.dashboard.submitter}</th>
                      <th className="text-center py-2.5 px-4 font-medium text-gray-500 dark:text-gray-500">{t.dashboard.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.map((item) => (
                      <tr key={item.id} className="border-b border-gray-50 dark:border-[#1a1a1a] hover:bg-gray-50/50 dark:hover:bg-[#141414]">
                        <td className="py-2.5 px-4 font-medium whitespace-nowrap">{item.name}</td>
                        <td className="py-2.5 px-4 text-gray-500 dark:text-gray-500">{item.gender || "-"}</td>
                        <td className="py-2.5 px-4 text-gray-500 dark:text-gray-500">{item.height ? `${item.height}cm` : "-"}</td>
                        <td className="py-2.5 px-4 text-gray-500 dark:text-gray-500 max-w-[160px] truncate">
                          {[item.lostProvince, item.lostCity, item.lostDistrict].filter(Boolean).join(" ") || "-"}
                        </td>
                        <td className="py-2.5 px-4 text-gray-500 dark:text-gray-500 whitespace-nowrap">{item.lostDate || "-"}</td>
                        <td className="py-2.5 px-4">
                          <span className="text-[11px] px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            {item.source === "user_submit" ? t.cases.sourceUser : item.source}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-gray-500 dark:text-gray-500">{item.submitterName || "-"}</td>
                        <td className="py-2.5 px-4">
                          <div className="flex gap-1.5 justify-center items-center">
                            <button
                              onClick={() => openDrawer(item)}
                              className="px-2.5 py-1.5 text-[11px] rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1f1f1f] transition-colors"
                            >
                              {t.review.detail}
                            </button>
                            <button
                              onClick={() => handleReview(item.id, "approved")}
                              className="px-3 py-1.5 text-[12px] rounded-md bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 font-medium transition-colors"
                            >
                              {t.review.approve}
                            </button>
                            <button
                              onClick={() => handleReview(item.id, "rejected")}
                              className="px-3 py-1.5 text-[12px] rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-colors"
                            >
                              {t.review.reject}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <Pagination
              page={casePage}
              totalPages={caseTotalPages}
              total={caseTotal}
              onPrev={() => setCasePage((p) => Math.max(1, p - 1))}
              onNext={() => setCasePage((p) => p + 1)}
              t={t}
            />
          </>
        )
      ) : (
        clues.length === 0 ? (
          <div className="rounded-xl border border-gray-100 dark:border-[#1f1f1f] bg-white dark:bg-[#0d0d0d] py-16 text-center">
            <p className="text-[13px] text-gray-400">{t.review.clueNoPending}</p>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-gray-100 dark:border-[#1f1f1f] bg-white dark:bg-[#0d0d0d] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-[#1f1f1f]">
                      <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-500">{t.review.clueAssociateCase}</th>
                      <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-500">{t.review.clueContent}</th>
                      <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-500">{t.dashboard.submitter}</th>
                      <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-500">{t.review.contact}</th>
                      <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-500">{t.auditLog.time}</th>
                      <th className="text-center py-2.5 px-4 font-medium text-gray-500 dark:text-gray-500">{t.dashboard.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clues.map((clue) => (
                      <tr key={clue.id} className="border-b border-gray-50 dark:border-[#1a1a1a] hover:bg-gray-50/50 dark:hover:bg-[#141414]">
                        <td className="py-2.5 px-4 font-medium whitespace-nowrap">{clue.caseName || "-"}</td>
                        <td className="py-2.5 px-4 text-gray-500 dark:text-gray-500 max-w-[240px] truncate">{clue.content}</td>
                        <td className="py-2.5 px-4 text-gray-500 dark:text-gray-500 whitespace-nowrap">{clue.submitterName || "-"}</td>
                        <td className="py-2.5 px-4 text-gray-500 dark:text-gray-500 whitespace-nowrap">{clue.submitterContact || "-"}</td>
                        <td className="py-2.5 px-4 text-gray-500 dark:text-gray-500 whitespace-nowrap">{new Date(clue.createdAt).toLocaleDateString("zh-CN")}</td>
                        <td className="py-2.5 px-4">
                          <div className="flex gap-1.5 justify-center items-center">
                            <button
                              onClick={() => openDrawer(clue)}
                              className="px-2.5 py-1.5 text-[11px] rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1f1f1f] transition-colors"
                            >
                              {t.review.detail}
                            </button>
                            <button
                              onClick={() => handleClueReview(clue.id, "approved")}
                              className="px-3 py-1.5 text-[12px] rounded-md bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 font-medium transition-colors"
                            >
                              {t.review.approve}
                            </button>
                            <button
                              onClick={() => handleClueReview(clue.id, "rejected")}
                              className="px-3 py-1.5 text-[12px] rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-colors"
                            >
                              {t.review.reject}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <Pagination
              page={cluePage}
              totalPages={clueTotalPages}
              total={clueTotal}
              onPrev={() => setCluePage((p) => Math.max(1, p - 1))}
              onNext={() => setCluePage((p) => p + 1)}
              t={t}
            />
          </>
        )
      )}

      {/* Detail Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={drawerItem && isCaseItem(drawerItem) ? t.review.detailDrawerTitle : t.review.detailDrawerClueTitle}
      >
        {drawerItem && (
          isCaseItem(drawerItem) ? (
            <CaseDrawerContent item={drawerItem} t={t} />
          ) : (
            <ClueDrawerContent item={drawerItem} t={t} />
          )
        )}
      </Drawer>

      <ToastContainer />
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  onPrev,
  onNext,
  t,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  t: any;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 text-[12px]">
      <span className="text-gray-400 dark:text-gray-500">
        {t.review.page.replace("{page}", String(page)).replace("{total}", String(totalPages))}
      </span>
      <div className="flex gap-2">
        <button
          onClick={onPrev}
          disabled={page <= 1}
          className="px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1f1f1f] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {t.review.previous}
        </button>
        <button
          onClick={onNext}
          disabled={page >= totalPages}
          className="px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1f1f1f] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {t.review.next}
        </button>
      </div>
    </div>
  );
}

function CaseDrawerContent({ item, t }: { item: CaseItem; t: any }) {
  const photos: string[] = (() => {
    try { return JSON.parse(item.photoUrls || "[]"); } catch { return []; }
  })();

  return (
    <div className="space-y-5">
      {photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {photos.map((url, i) => (
            <img key={i} src={url} alt="" className="w-24 h-24 rounded-lg object-cover flex-shrink-0" />
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
        <DetailItem label={t.review.submitter_label} value={item.submitterName} />
        <DetailItem label={t.review.contact} value={item.submitterContact} />
        <DetailItem label={t.review.birthDate} value={item.birthDate} />
        <DetailItem label={t.review.lostDate} value={item.lostDate} />
        <DetailItem label={t.review.gender} value={item.gender} />
        <DetailItem label={t.review.height} value={item.height ? `${item.height}cm` : null} />
        <DetailItem label={t.review.province} value={item.lostProvince} />
        <DetailItem label={t.review.city} value={item.lostCity} />
      </div>

      {item.lostAddress && (
        <div>
          <p className="text-[11px] text-gray-400 dark:text-gray-600 mb-1">{t.review.lostAddress}</p>
          <p className="text-[13px] text-gray-700 dark:text-gray-300">{item.lostAddress}</p>
        </div>
      )}

      {item.feature && (
        <div>
          <p className="text-[11px] text-gray-400 dark:text-gray-600 mb-1">{t.review.feature}</p>
          <p className="text-[13px] text-gray-700 dark:text-gray-300">{item.feature}</p>
        </div>
      )}

      <div className="text-[11px] text-gray-400 dark:text-gray-600 pt-3 border-t border-gray-100 dark:border-[#1f1f1f]">
        <p>ID: {item.id}</p>
        <p>{new Date(item.createdAt).toLocaleString("zh-CN")}</p>
      </div>
    </div>
  );
}

function ClueDrawerContent({ item, t }: { item: ClueItem; t: any }) {
  const photos: string[] = (() => {
    try { return JSON.parse(item.photoUrls || "[]"); } catch { return []; }
  })();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] text-gray-400 dark:text-gray-600 mb-1">{t.review.clueAssociateCase}</p>
        <p className="text-[14px] font-medium text-gray-900 dark:text-gray-100">{item.caseName || "-"}</p>
      </div>

      <div>
        <p className="text-[11px] text-gray-400 dark:text-gray-600 mb-1">{t.review.clueContent}</p>
        <p className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{item.content}</p>
      </div>

      {photos.length > 0 && (
        <div>
          <p className="text-[11px] text-gray-400 dark:text-gray-600 mb-2">{t.review.cluePhotos}</p>
          <div className="flex gap-2 flex-wrap">
            {photos.map((url, i) => (
              <img key={i} src={url} alt="" className="w-24 h-24 rounded-lg object-cover" />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
        <DetailItem label={t.review.submitter_label} value={item.submitterName} />
        <DetailItem label={t.review.contact} value={item.submitterContact} />
      </div>

      <div className="text-[11px] text-gray-400 dark:text-gray-600 pt-3 border-t border-gray-100 dark:border-[#1f1f1f]">
        <p>ID: {item.id}</p>
        <p>{new Date(item.createdAt).toLocaleString("zh-CN")}</p>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <span className="text-gray-400 dark:text-gray-600 text-[11px]">{label}</span>
      <p className="text-[13px] mt-0.5 text-gray-900 dark:text-gray-100">{value || "-"}</p>
    </div>
  );
}
