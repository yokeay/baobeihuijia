"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ToastData {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

let addToastFn: ((t: ToastData) => void) | null = null;

export function showToast(message: string, type: ToastData["type"] = "info") {
  addToastFn?.({ id: Math.random().toString(36).slice(2), message, type });
}

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
          className={cn(
            "px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-right",
            t.type === "success" && "bg-green-500 text-white",
            t.type === "error" && "bg-red-500 text-white",
            t.type === "info" && "bg-gray-800 text-white"
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
