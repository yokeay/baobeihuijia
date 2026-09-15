"use client";

import { useState, useEffect, useCallback } from "react";
import Drawer from "@/components/ui/Drawer";
import {
  Badge,
  EmptyState,
  IconButton,
  PageHeader,
  Pagination,
  Panel,
  Segmented,
  Table,
  TableSkeleton,
  Td,
  Th,
  Tr,
  statusTone,
} from "@/components/ui/admin/kit";
import CaseDetailPanel from "@/components/ui/admin/CaseDetailPanel";
import { RefreshIcon, CheckIcon, CloseIcon, HelpIcon } from "@/components/ui/Icon";

const STATUS_TABS = [
  { value: "", label: "全部" },
  { value: "pending", label: "待审核" },
  { value: "approved", label: "已通过" },
  { value: "rejected", label: "已拒绝" },
] as const;

const STATUS_LABELS: Record<string, string> = {
  approved: "已通过",
  rejected: "已拒绝",
  pending: "待审核",
};

export default function QuestionsPage() {
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
    const res = await fetch(`/api/admin/questions?${params}`);
    const data = await res.json();
    setItems(data.items || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [filter]);

  useEffect(() => { setPage(1); fetchData(1); }, [fetchData]);

  async function handleAction(id: string, action: string) {
    await fetch("/api/admin/questions", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: action }),
    });
    fetchData(page);
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <PageHeader
        title="疑问管理"
        description="用户针对寻亲帖提交的疑问，审核通过后前台可见"
        actions={
          <IconButton label="刷新" onClick={() => fetchData(page)}>
            <RefreshIcon size={16} />
          </IconButton>
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Segmented value={filter} onChange={setFilter} options={STATUS_TABS} />
      </div>

      <Panel>
        {loading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : items.length === 0 ? (
          <EmptyState title="暂无疑问" icon={<HelpIcon size={20} />} />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>提交者</Th>
                  <Th>关联案例</Th>
                  <Th>疑问内容</Th>
                  <Th>状态</Th>
                  <Th>时间</Th>
                  <Th align="right">操作</Th>
                </tr>
              </thead>
              <tbody>
                {items.map((q: any) => (
                  <Tr key={q.id}>
                    <Td className="font-medium whitespace-nowrap">{q.submitterName || "匿名"}</Td>
                    <Td>
                      {q.caseName ? (
                        <button
                          type="button"
                          onClick={() => { setDrawerCase(q.caseData); setDrawerOpen(true); }}
                          className="text-left text-[#175cd3] dark:text-[#60a5fa] hover:underline underline-offset-2 font-medium"
                        >
                          {q.caseName}
                        </button>
                      ) : (
                        <span className="text-[#98a2b3]">—</span>
                      )}
                    </Td>
                    <Td muted className="max-w-[260px]">
                      <div className="truncate">{q.content}</div>
                    </Td>
                    <Td>
                      <Badge tone={statusTone(q.status)}>{STATUS_LABELS[q.status] || q.status}</Badge>
                    </Td>
                    <Td muted className="whitespace-nowrap tabular-nums text-[12px]">
                      {new Date(q.createdAt).toLocaleString("zh-CN")}
                    </Td>
                    <Td align="right">
                      {q.status === "pending" ? (
                        <div className="flex gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => handleAction(q.id, "approved")}
                            className="inline-flex items-center gap-1 h-8 px-3 rounded-lg cursor-pointer bg-[#e60012] text-white text-[12px] font-medium shadow-[0_1px_2px_rgba(230,0,18,0.28)] hover:bg-[#c1000f] active:scale-[0.97] transition-all duration-200"
                          >
                            <CheckIcon size={14} />
                            通过
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAction(q.id, "rejected")}
                            className="inline-flex items-center gap-1 h-8 px-3 rounded-lg cursor-pointer bg-white dark:bg-transparent border border-black/[0.08] dark:border-white/[0.10] text-[#475467] dark:text-[#98a2b3] text-[12px] font-medium hover:text-[#b42318] hover:border-[#f04438]/30 hover:bg-[#fef3f2] dark:hover:bg-[#f04438]/[0.10] active:scale-[0.97] transition-all duration-200"
                          >
                            <CloseIcon size={14} />
                            拒绝
                          </button>
                        </div>
                      ) : (
                        <span className="text-[12px] text-[#d0d5dd] dark:text-[#475467]">—</span>
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={page} totalPages={totalPages} total={total} onChange={(p) => { setPage(p); fetchData(p); }} />
          </>
        )}
      </Panel>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="案例详情">
        {drawerCase && <CaseDetailPanel data={drawerCase} />}
      </Drawer>
    </div>
  );
}
