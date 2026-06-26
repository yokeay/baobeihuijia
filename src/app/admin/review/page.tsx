"use client";

import { useState, useEffect, useCallback } from "react";
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
  submitterContact: string | null;
  lostAddress: string | null;
  feature: string | null;
  birthDate: string | null;
  height: number | null;
}

export default function AdminReviewPage() {
  const { t } = useAdmin();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cases");
      if (res.ok) {
        const data = await res.json();
        setCases(data.filter((c: CaseItem) => c.status === "pending"));
      }
    } catch {
      showToast(t.review.loadFailed, "error");
    } finally {
      setLoading(false);
    }
  }, [t.review.loadFailed]);

  useEffect(() => { fetchCases(); }, [fetchCases]);

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">{t.review.title}</h2>
        <span className="text-[12px] text-gray-400 dark:text-gray-500">
          {t.review.count.replace("{count}", String(cases.length))}
        </span>
      </div>

      {loading ? (
        <p className="text-[13px] text-gray-400 py-16 text-center">{t.review.loading}</p>
      ) : cases.length === 0 ? (
        <div className="rounded-xl border border-gray-100 dark:border-[#1f1f1f] bg-white dark:bg-[#0d0d0d] py-16 text-center">
          <p className="text-[13px] text-gray-400">{t.review.empty}</p>
          <p className="text-[11px] text-gray-300 dark:text-gray-600 mt-1">{t.review.emptyHint}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {cases.map((item) => {
            const photos: string[] = JSON.parse(item.photoUrls || "[]");
            const isOpen = expanded === item.id;

            return (
              <div key={item.id} className="rounded-xl border border-gray-100 dark:border-[#1f1f1f] bg-white dark:bg-[#0d0d0d] overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  {photos[0] && (
                    <img
                      src={photos[0]}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium">{item.name}</span>
                      <span className="text-[11px] text-gray-400">
                        {item.gender || t.review.unknown} {item.height ? `${item.height}${t.review.cm}` : ""}
                      </span>
                    </div>
                    <p className="text-[12px] text-gray-500 dark:text-gray-500 truncate">
                      {t.review.lost}{[item.lostProvince, item.lostCity, item.lostAddress]
                        .filter(Boolean)
                        .join(" ") || t.review.unknown}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 text-[11px] text-gray-400 dark:text-gray-600">
                      <span>{t.review.submitter_label}{item.submitterName || t.review.anonymous}</span>
                      <span>{item.source === "user_submit" ? t.review.userSubmit : item.source}</span>
                      <span>{item.lostDate}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpanded(isOpen ? null : item.id)}
                    className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-2 py-1 transition-colors"
                  >
                    {isOpen ? t.review.collapse : t.review.expand}
                  </button>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleReview(item.id, "approved")}
                      className="px-4 py-2 text-[12px] rounded-md bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 font-medium transition-colors"
                    >
                      {t.review.approve}
                    </button>
                    <button
                      onClick={() => handleReview(item.id, "rejected")}
                      className="px-4 py-2 text-[12px] rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-colors"
                    >
                      {t.review.reject}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-gray-50 dark:border-[#1a1a1a] pt-3">
                    <div className="grid grid-cols-3 gap-3 text-[12px]">
                      <DetailItem label={t.review.birthDate} value={item.birthDate} />
                      <DetailItem label={t.review.lostDate} value={item.lostDate} />
                      <DetailItem label={t.review.gender} value={item.gender} />
                      <DetailItem label={t.review.height} value={item.height ? `${item.height}${t.review.cm}` : null} />
                      <DetailItem label={t.review.province} value={item.lostProvince} />
                      <DetailItem label={t.review.city} value={item.lostCity} />
                      <DetailItem label={t.review.contact} value={item.submitterContact} />
                    </div>
                    {(item.lostAddress || item.feature) && (
                      <div className="mt-3 space-y-1 text-[12px]">
                        {item.lostAddress && (
                          <p><span className="text-gray-400">{t.review.lostAddress}</span>{item.lostAddress}</p>
                        )}
                        {item.feature && (
                          <p><span className="text-gray-400">{t.review.feature}</span>{item.feature}</p>
                        )}
                      </div>
                    )}
                    {photos.length > 1 && (
                      <div className="flex gap-2 mt-3">
                        {photos.map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt=""
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <ToastContainer />
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <span className="text-gray-400 dark:text-gray-600">{label}：</span>
      <span>{value || "-"}</span>
    </div>
  );
}
