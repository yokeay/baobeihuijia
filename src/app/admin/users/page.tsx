"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Badge,
  EmptyState,
  IconButton,
  PageHeader,
  Pagination,
  Panel,
  SearchField,
  Table,
  TableSkeleton,
  Td,
  Th,
  Tr,
} from "@/components/ui/admin/kit";
import { RefreshIcon, UsersIcon } from "@/components/ui/Icon";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  const fetchUsers = useCallback(async (p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "20" });
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/users?${params}`);
    const data = await res.json();
    setUsers(data.items || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [search]);

  useEffect(() => { setPage(1); fetchUsers(1); }, [fetchUsers]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <PageHeader
        title="用户管理"
        description={`平台注册用户，当前共 ${total.toLocaleString()} 人`}
        actions={
          <IconButton label="刷新" onClick={() => fetchUsers(page)}>
            <RefreshIcon size={16} />
          </IconButton>
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <SearchField
          value={search}
          onChange={setSearch}
          onSubmit={() => fetchUsers(1)}
          placeholder="搜索手机号或用户名…"
          className="w-full sm:w-80"
        />
      </div>

      <Panel>
        {loading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : users.length === 0 ? (
          <EmptyState title="暂无用户" icon={<UsersIcon size={20} />} />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>手机号</Th>
                  <Th>用户名</Th>
                  <Th>地区</Th>
                  <Th>微信</Th>
                  <Th>QQ</Th>
                  <Th align="right">注册时间</Th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <Tr key={u.id}>
                    <Td className="font-mono text-[12.5px] tabular-nums whitespace-nowrap">{u.phone}</Td>
                    <Td className="font-medium">{u.username}</Td>
                    <Td>
                      <Badge tone={u.region === "overseas" ? "info" : "neutral"}>
                        {u.region === "overseas" ? "海外" : "大陆"}
                      </Badge>
                    </Td>
                    <Td muted className="text-[12.5px]">{u.contactWechat || "—"}</Td>
                    <Td muted className="text-[12.5px]">{u.contactQq || "—"}</Td>
                    <Td muted align="right" className="whitespace-nowrap tabular-nums text-[12.5px]">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString("zh-CN") : "—"}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={page} totalPages={totalPages} total={total} onChange={(p) => { setPage(p); fetchUsers(p); }} />
          </>
        )}
      </Panel>
    </div>
  );
}
