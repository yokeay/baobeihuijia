"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "../context";
import {
  Badge,
  EmptyState,
  IconButton,
  PageHeader,
  Panel,
  Table,
  TableSkeleton,
  Td,
  Th,
  Tr,
  type Tone,
} from "@/components/ui/admin/kit";
import { RefreshIcon, ShieldIcon } from "@/components/ui/Icon";

interface AuditLogItem {
  id: string;
  adminId: string;
  adminUsername: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  detail: string | null;
  createdAt: string;
}

const ACTION_TONES: Record<string, Tone> = {
  login: "info",
  logout: "neutral",
  approve: "success",
  reject: "danger",
  sync: "warning",
  edit: "brand",
};

export default function AdminAuditLogPage() {
  const { t } = useAdmin();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/audit-logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const actionLabels: Record<string, string> = {
    login: t.auditLog.actionLogin,
    logout: t.auditLog.actionLogout,
    approve: t.auditLog.actionApprove,
    reject: t.auditLog.actionReject,
    sync: t.auditLog.actionSync,
    edit: t.auditLog.actionEdit,
  };

  const targetLabels: Record<string, string> = {
    case: t.auditLog.targetCase,
    system: t.auditLog.targetSystem,
  };

  function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString();
  }

  function parseDetail(detail: string | null) {
    if (!detail) return "—";
    try {
      const obj = JSON.parse(detail);
      return obj.caseName || obj.githubUsername || detail;
    } catch {
      return detail;
    }
  }

  return (
    <div>
      <PageHeader
        title={t.auditLog.title}
        description="管理员的关键操作留痕，仅记录不修改"
        actions={
          <IconButton label="刷新" onClick={fetchLogs}>
            <RefreshIcon size={16} />
          </IconButton>
        }
      />

      <Panel>
        {loading ? (
          <TableSkeleton rows={10} cols={5} />
        ) : logs.length === 0 ? (
          <EmptyState title={t.auditLog.noData} icon={<ShieldIcon size={20} />} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t.auditLog.action}</Th>
                <Th>{t.auditLog.operator}</Th>
                <Th>{t.auditLog.target}</Th>
                <Th>{t.auditLog.detail}</Th>
                <Th align="right">{t.auditLog.time}</Th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <Tr key={log.id}>
                  <Td>
                    <Badge tone={ACTION_TONES[log.action] || "neutral"}>
                      {actionLabels[log.action] || log.action}
                    </Badge>
                  </Td>
                  <Td className="font-medium whitespace-nowrap">{log.adminUsername}</Td>
                  <Td muted>
                    {log.targetType ? targetLabels[log.targetType] || log.targetType : "—"}
                  </Td>
                  <Td muted className="max-w-[240px] truncate text-[12.5px]">
                    {parseDetail(log.detail)}
                  </Td>
                  <Td muted align="right" className="whitespace-nowrap tabular-nums text-[11.5px]">
                    {formatTime(log.createdAt)}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>
    </div>
  );
}
