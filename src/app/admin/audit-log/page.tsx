"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "../context";

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
    if (!detail) return "-";
    try {
      const obj = JSON.parse(detail);
      return obj.caseName || obj.githubUsername || detail;
    } catch {
      return detail;
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">{t.auditLog.title}</h2>
        <button
          onClick={fetchLogs}
          className="text-[12px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-gray-100 dark:border-[#1f1f1f] bg-white dark:bg-[#0d0d0d] overflow-hidden">
        {loading ? (
          <p className="text-[13px] text-gray-400 py-12 text-center">{t.auditLog.loading}</p>
        ) : logs.length === 0 ? (
          <p className="text-[13px] text-gray-400 py-12 text-center">{t.auditLog.noData}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#1f1f1f]">
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-500">{t.auditLog.action}</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-500">{t.auditLog.operator}</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-500">{t.auditLog.target}</th>
                  <th className="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-500">{t.auditLog.detail}</th>
                  <th className="text-right py-2.5 px-4 font-medium text-gray-500 dark:text-gray-500">{t.auditLog.time}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-50 dark:border-[#1a1a1a] hover:bg-gray-50/50 dark:hover:bg-[#141414]">
                    <td className="py-2.5 px-4">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full border ${
                        log.action === "login"
                          ? "border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                          : log.action === "approve"
                          ? "border-green-200 dark:border-green-800 text-green-600 dark:text-green-400"
                          : log.action === "reject"
                          ? "border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
                          : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                      }`}>
                        {actionLabels[log.action] || log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">{log.adminUsername}</td>
                    <td className="py-2.5 px-4 text-gray-500 dark:text-gray-500">
                      {log.targetType ? targetLabels[log.targetType] || log.targetType : "-"}
                    </td>
                    <td className="py-2.5 px-4 text-gray-500 dark:text-gray-500 max-w-[200px] truncate">
                      {parseDetail(log.detail)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-gray-400 dark:text-gray-600 text-[11px] tabular-nums">
                      {formatTime(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
