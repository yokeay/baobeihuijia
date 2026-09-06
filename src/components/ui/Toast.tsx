"use client";

import { useEffect, useState } from "react";

interface ToastData {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

let addToastFn: ((t: ToastData) => void) | null = null;

export function showToast(message: string, type: ToastData["type"] = "info") {
  addToastFn?.({ id: Math.random().toString(36).slice(2), message, type });
}

// Toast 用设计 token 而不是 Tailwind 任意色阶：success/danger 必须和全站
// 同一个绿、同一个深红，否则 error 提示会跟品牌红撞色。
const TOAST_BG: Record<ToastData["type"], string> = {
  success: "var(--success)",
  error: "var(--danger)",
  info: "#17181A",
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    addToastFn = (t) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, 3000);
    };
    return () => { addToastFn = null; };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white animate-in slide-in-from-right"
          style={{ background: TOAST_BG[t.type] }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
