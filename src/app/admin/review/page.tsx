"use client";

import { useState, useEffect, useCallback } from "react";
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
      showToast("加载失败", "error");
    } finally {
      setLoading(false);
    }
  }, []);

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">审核队列</h2>
        <span className="text-sm text-gray-400">
          共 {cases.length} 条待审核
        </span>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm py-12 text-center">加载中...</p>
      ) : cases.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm py-16 text-center">
          <p className="text-gray-400">暂无待审核案件</p>
          <p className="text-xs text-gray-300 mt-1">用户提交的案件将出现在这里</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map((item) => {
            const photos: string[] = JSON.parse(item.photoUrls || "[]");
            const isOpen = expanded === item.id;

            return (
              <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Summary row */}
                <div className="flex items-center gap-4 p-4">
                  {photos[0] && (
                    <img
                      src={photos[0]}
                      alt=""
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-xs text-gray-400">
                        {item.gender || "未知"} {item.height ? `${item.height}cm` : ""}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      走失：{[item.lostProvince, item.lostCity, item.lostAddress]
                        .filter(Boolean)
                        .join(" ") || "未知"}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>提交者：{item.submitterName || "匿名"}</span>
                      <span>{item.source === "user_submit" ? "用户提交" : item.source}</span>
                      <span>{item.lostDate}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpanded(isOpen ? null : item.id)}
                    className="text-xs text-gray-400 hover:text-primary px-2 py-1"
                  >
                    {isOpen ? "收起" : "详情"}
                  </button>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleReview(item.id, "approved")}
                      className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      通过
                    </button>
                    <button
                      onClick={() => handleReview(item.id, "rejected")}
                      className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      拒绝
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {isOpen && (
                  <div className="px-4 pb-4 border-t border-gray-50 pt-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                      <DetailItem label="出生日期" value={item.birthDate} />
                      <DetailItem label="走失日期" value={item.lostDate} />
                      <DetailItem label="性别" value={item.gender} />
                      <DetailItem label="身高" value={item.height ? `${item.height}cm` : null} />
                      <DetailItem label="省份" value={item.lostProvince} />
                      <DetailItem label="城市" value={item.lostCity} />
                      <DetailItem label="联系方式" value={item.submitterContact} />
                    </div>
                    {(item.lostAddress || item.feature) && (
                      <div className="mt-3 space-y-1 text-sm">
                        {item.lostAddress && (
                          <p><span className="text-gray-400">走失地址：</span>{item.lostAddress}</p>
                        )}
                        {item.feature && (
                          <p><span className="text-gray-400">体貌特征：</span>{item.feature}</p>
                        )}
                      </div>
                    )}
                    {/* All photos */}
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
      <span className="text-gray-400">{label}：</span>
      <span>{value || "-"}</span>
    </div>
  );
}
