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
} from "@/components/ui/admin/kit";
import { RefreshIcon, CheckIcon, InboxIcon } from "@/components/ui/Icon";

const STATUS_TABS = [
  { value: "", label: "全部" },
  { value: "pending", label: "待处理" },
  { value: "handled", label: "已处理" },
] as const;

const STATUS_LABELS: Record<string, string> = {
  pending: "待处理",
  handled: "已处理",
};

interface FeedbackItem {
  id: string;
  title: string;
  content: string;
  userName: string | null;
  status: string;
  createdAt: string;
}

export default function FeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerItem, setDrawerItem] = useState<FeedbackItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (filter) params.set("status", filter);
      const res = await fetch(`/api/admin/feedback?${params}`);
      const data = await res.json();
      if (cancelled) return;
      setItems(data.items || []);
      setTotal(data.total || 0);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [page, filter, reloadKey]);

  const reload = useCallback(() => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  function changeFilter(v: string) {
    setLoading(true);
    setFilter(v);
    setPage(1);
  }

  function changePage(p: number) {
    setLoading(true);
    setPage(p);
  }

  async function handleAction(id: string, status: string) {
    await fetch("/api/admin/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    reload();
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <PageHeader
        title="反馈管理"
        description="用户在前台「反馈与建议」里提交的内容，只有标题和正文，不含图片"
        actions={
          <IconButton label="刷新" onClick={reload}>
            <RefreshIcon size={16} />
          </IconButton>
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Segmented value={filter} onChange={changeFilter} options={STATUS_TABS} />
      </div>

      <Panel>
        {loading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : items.length === 0 ? (
          <EmptyState title="暂无反馈" icon={<InboxIcon size={20} />} />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>标题</Th>
                  <Th>反馈内容</Th>
                  <Th>提交者</Th>
                  <Th>状态</Th>
                  <Th>时间</Th>
                  <Th align="right">操作</Th>
                </tr>
              </thead>
              <tbody>
                {items.map((f) => (
                  <Tr key={f.id}>
                    <Td className="font-medium max-w-[200px]">
                      <button
                        type="button"
                        onClick={() => { setDrawerItem(f); setDrawerOpen(true); }}
                        className="block max-w-full truncate text-left text-[#175cd3] dark:text-[#60a5fa] hover:underline underline-offset-2 font-medium"
                      >
                        {f.title}
                      </button>
                    </Td>
                    <Td muted className="max-w-[320px]">
                      <button
                        type="button"
                        onClick={() => { setDrawerItem(f); setDrawerOpen(true); }}
                        className="block max-w-full truncate text-left"
                      >
                        {f.content}
                      </button>
                    </Td>
                    <Td muted className="whitespace-nowrap">{f.userName || "游客"}</Td>
                    <Td>
                      <Badge tone={f.status === "handled" ? "success" : "warning"}>
                        {STATUS_LABELS[f.status] || f.status}
                      </Badge>
                    </Td>
                    <Td muted className="whitespace-nowrap tabular-nums text-[12px]">
                      {new Date(f.createdAt).toLocaleString("zh-CN")}
                    </Td>
                    <Td align="right">
                      {f.status === "handled" ? (
                        <button
                          type="button"
                          onClick={() => handleAction(f.id, "pending")}
                          className="text-[12px] text-[#667085] dark:text-[#98a2b3] hover:text-[#101828] dark:hover:text-white hover:underline"
                        >
                          重新打开
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAction(f.id, "handled")}
                          className="inline-flex items-center gap-1 h-8 px-3 rounded-lg cursor-pointer bg-[#e60012] text-white text-[12px] font-medium shadow-[0_1px_2px_rgba(230,0,18,0.28)] hover:bg-[#c1000f] active:scale-[0.97] transition-all duration-200"
                        >
                          <CheckIcon size={14} />
                          标记已处理
                        </button>
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={page} totalPages={totalPages} total={total} onChange={changePage} />
          </>
        )}
      </Panel>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="反馈详情">
        {drawerItem && (
          <div className="space-y-5">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#98a2b3] mb-1.5">
                标题
              </div>
              <div className="text-[14px] font-medium text-[#101828] dark:text-white break-words">
                {drawerItem.title}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#98a2b3] mb-1.5">
                反馈内容
              </div>
              <div className="text-[13.5px] leading-6 text-[#344054] dark:text-[#d0d5dd] whitespace-pre-wrap break-words">
                {drawerItem.content}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#98a2b3] mb-1.5">
                提交者
              </div>
              <div className="text-[13px] text-[#475467] dark:text-[#98a2b3]">
                {drawerItem.userName || "游客（未登录）"}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#98a2b3] mb-1.5">
                提交时间
              </div>
              <div className="text-[13px] tabular-nums text-[#475467] dark:text-[#98a2b3]">
                {new Date(drawerItem.createdAt).toLocaleString("zh-CN")}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
