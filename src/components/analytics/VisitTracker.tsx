"use client";

import { useEffect } from "react";

// 根布局只在整份文档加载时挂载一次，客户端路由跳转不会重挂，
// 所以「刷新一次 = 一次访问」这条规则由挂载次数天然保证。
let reported = false;

export function VisitTracker() {
  useEffect(() => {
    // React 严格模式下 effect 会跑两遍，模块级标记保证一次加载只上报一次
    if (reported) return;
    reported = true;

    const path = window.location.pathname;
    if (path.startsWith("/admin")) return;

    const payload = JSON.stringify({ path });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/track/visit",
        new Blob([payload], { type: "application/json" })
      );
      return;
    }

    fetch("/api/track/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }, []);

  return null;
}
