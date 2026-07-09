"use client";

import { useState, useEffect, useCallback } from "react";
import Drawer from "@/components/ui/Drawer";
import { RefreshButton } from "@/components/ui/RefreshButton";

const th = "text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-500";
const td = "py-2.5 px-4 text-gray-900 dark:text-gray-100";
const tdMuted = "py-2.5 px-4 text-gray-500 dark:text-gray-500";
const trClass = "border-b border-gray-50 dark:border-[#1a1a1a] hover:bg-gray-50/50 dark:hover:bg-[#141414]";

function CaseDetail({ data }: { data: any }) {
  const photos: string[] = (() => { try { return JSON.parse(data.photoUrls || "[]"); } catch { return []; } })();
  return (
    <div className="space-y-4 text-[13px]">
      {photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {photos.map((url: string, i: number) => (
            <img key={i} src={url} alt="" className="w-24 h-24 rounded-lg object-cover flex-shrink-0" />
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div><span className="text-gray-400 text-[11px]">姓名</span><p className="text-gray-900 dark:text-gray-100">{data.name}</p></div>
        <div><span className="text-gray-400 text-[11px]">性别</span><p className="text-gray-900 dark:text-gray-100">{data.gender || "-"}</p></div>
        <div><span className="text-gray-400 text-[11px]">出生日期</span><p className="text-gray-900 dark:text-gray-100">{data.birthDate || "-"}</p></div>
        <div><span className="text-gray-400 text-[11px]">失踪日期</span><p className="text-gray-900 dark:text-gray-100">{data.lostDate || "-"}</p></div>
        <div><span className="text-gray-400 text-[11px]">身高</span><p className="text-gray-900 dark:text-gray-100">{data.height ? `${data.height}cm` : "-"}</p></div>
        <div><span className="text-gray-400 text-[11px]">地区</span><p className="text-gray-900 dark:text-gray-100">{[data.lostProvince, data.lostCity, data.lostDistrict].filter(Boolean).join(" ") || "-"}</p></div>
      </div>
      {data.lostAddress && <div><p className="text-[11px] text-gray-400 mb-1">失踪地址</p><p className="text-gray-700 dark:text-gray-300">{data.lostAddress}</p></div>}
      {data.feature && <div><p className="text-[11px] text-gray-400 mb-1">体貌特征</p><p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{data.feature}</p></div>}
      <div className="text-[11px] text-gray-400 pt-3 border-t border-gray-100 dark:border-[#1f1f1f]">
        <p>ID: {data.id}</p>
      </div>
    </div>
  );
}

export default function CluesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("pending");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerCase, setDrawerCase] = useState<any>(null);

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "20" });
    if (filter) params.set("status", filter);
    const res = await fetch(`/api/admin/clues?${params}`);
    const data = await res.json();
    setItems(data.items || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [filter]);

  useEffect(() => { setPage(1); fetchData(1); }, [fetchData]);

  async function handleAction(id: string, action: string) {
    await fetch("/api/admin/clues/review", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: action }),
    });
    fetchData(page);
  }

  const totalPages = Math.ceil(total / 20);
  const selectClass = "px-3 py-1.5 border border-gray-200 dark:border-[#2a2a2a] rounded-lg text-sm bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100";

  return (
    <div>
      <h1 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100 mb-4">线索管理</h1>
      <div className="flex items-center gap-2 mb-4">
        <RefreshButton onClick={() => fetchData(page)} />
        <select value={filter} onChange={e => setFilter(e.target.value)} className={selectClass}>
          <option value="">全部</option>
          <option value="pending">待审核</option>
          <option value="approved">已通过</option>
          <option value="rejected">已拒绝</option>
        </select>
        <span className="px-3 py-1.5 text-sm text-gray-400 dark:text-gray-600">共 {total} 条</span>
      </div>

      {loading ? <p className="text-sm text-gray-400 dark:text-gray-600">加载中...</p> : (
        <>
          <div className="rounded-xl border border-gray-100 dark:border-[#1f1f1f] bg-white dark:bg-[#0d0d0d] overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#1f1f1f]">
                  <th className={th}>提交者</th>
                  <th className={th}>关联案例</th>
                  <th className={th}>线索内容</th>
                  <th className={th}>状态</th>
                  <th className={th}>时间</th>
                  <th className={th}>操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c: any) => (
                  <tr key={c.id} className={trClass}>
                    <td className={td}>{c.submitterName || "匿名"}</td>
                    <td className={td}>
                      {c.caseName ? (
                        <button onClick={() => { setDrawerCase(c.caseData); setDrawerOpen(true); }}
                          className="text-blue-600 dark:text-blue-400 hover:underline text-left">
                          {c.caseName}
                        </button>
                      ) : "-"}
                    </td>
                    <td className={td} style={{ maxWidth: 250 }}><div className="truncate">{c.content}</div></td>
                    <td className={td}>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        c.status === "approved" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        : c.status === "rejected" ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                        : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                      }`}>
                        {c.status === "approved" ? "已通过" : c.status === "rejected" ? "已拒绝" : "待审核"}
                      </span>
                    </td>
                    <td className={tdMuted + " whitespace-nowrap text-xs"}>
                      {new Date(c.createdAt).toLocaleString("zh-CN")}
                    </td>
                    <td className="py-2.5 px-4">
                      {c.status === "pending" && (
                        <div className="flex gap-1.5">
                          <button onClick={() => handleAction(c.id, "approved")}
                            className="px-2.5 py-1 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50">通过</button>
                          <button onClick={() => handleAction(c.id, "rejected")}
                            className="px-2.5 py-1 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50">拒绝</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400 dark:text-gray-600">暂无线索</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => { setPage(i + 1); fetchData(i + 1); }}
                  className={`px-3 py-1 rounded text-sm ${page === i + 1 ? "bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900" : "bg-gray-100 dark:bg-[#1f1f1f] text-gray-600 dark:text-gray-400"}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="案例详情">
        {drawerCase && <CaseDetail data={drawerCase} />}
      </Drawer>
    </div>
  );
}
