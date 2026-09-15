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
  SearchField,
  SelectField,
  Table,
  TableSkeleton,
  Td,
  Th,
  Tr,
  type Tone,
} from "@/components/ui/admin/kit";
import CaseDetailPanel from "@/components/ui/admin/CaseDetailPanel";
import { RefreshIcon, ActivityIcon } from "@/components/ui/Icon";

const ACTION_LABELS: Record<string, string> = {
  login: "登录",
  logout: "退出登录",
  follow: "关注",
  unfollow: "取消关注",
  update_contact: "完善联系方式",
  submit_clue: "提交线索",
  submit_case: "提交寻亲帖",
  submit_question: "提交疑问",
};

const ACTION_TONES: Record<string, Tone> = {
  login: "info",
  logout: "neutral",
  follow: "brand",
  unfollow: "neutral",
  update_contact: "success",
  submit_clue: "warning",
  submit_case: "warning",
  submit_question: "warning",
};

export default function UserLogsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerCase, setDrawerCase] = useState<any>(null);

  const fetchLogs = useCallback(async (p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "50" });
    if (action) params.set("action", action);
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/user-logs?${params}`);
    const data = await res.json();
    setItems(data.items || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [action, search]);

  useEffect(() => { setPage(1); fetchLogs(1); }, [fetchLogs]);

  const totalPages = Math.ceil(total / 50);

  const isCaseAction = (a: string) => ["follow", "unfollow"].includes(a);

  return (
    <div>
      <PageHeader
        title="用户日志"
        description="前台用户的行为记录，可按操作类型筛选"
        actions={
          <IconButton label="刷新" onClick={() => fetchLogs(page)}>
            <RefreshIcon size={16} />
          </IconButton>
        }
      />

      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <SelectField value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="">全部操作</option>
          {Object.entries(ACTION_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </SelectField>
        <SearchField
          value={search}
          onChange={setSearch}
          onSubmit={() => fetchLogs(1)}
          placeholder="搜索用户 / 目标…"
          className="w-full sm:w-72"
        />
      </div>

      <Panel>
        {loading ? (
          <TableSkeleton rows={10} cols={5} />
        ) : items.length === 0 ? (
          <EmptyState title="暂无记录" icon={<ActivityIcon size={20} />} />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>时间</Th>
                  <Th>用户</Th>
                  <Th>操作</Th>
                  <Th>目标</Th>
                  <Th>详情</Th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any) => (
                  <Tr key={item.id}>
                    <Td muted className="whitespace-nowrap tabular-nums text-[12px]">
                      {new Date(item.createdAt).toLocaleString("zh-CN")}
                    </Td>
                    <Td className="font-medium whitespace-nowrap">{item.username}</Td>
                    <Td>
                      <Badge tone={ACTION_TONES[item.action] || "neutral"}>
                        {ACTION_LABELS[item.action] || item.action}
                      </Badge>
                    </Td>
                    <Td>
                      {item.target && isCaseAction(item.action) && item.caseData ? (
                        <button
                          type="button"
                          onClick={() => { setDrawerCase(item.caseData); setDrawerOpen(true); }}
                          className="text-left text-[#175cd3] dark:text-[#60a5fa] hover:underline underline-offset-2 font-medium"
                        >
                          {item.target}
                        </button>
                      ) : (
                        item.target || <span className="text-[#98a2b3]">—</span>
                      )}
                    </Td>
                    <Td muted className="text-[12px]">{item.detail || "—"}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={page} totalPages={totalPages} total={total} onChange={(p) => { setPage(p); fetchLogs(p); }} />
          </>
        )}
      </Panel>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="案例详情">
        {drawerCase && <CaseDetailPanel data={drawerCase} />}
      </Drawer>
    </div>
  );
}
