"use client";

import type { ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import {
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  InboxIcon,
  CloseIcon,
} from "@/components/ui/Icon";

/* ------------------------------------------------------------------ *
 * 后台设计系统（Admin Kit）
 *
 * 只提供展示原语，不含任何数据逻辑。
 * 后台所有菜单页面统一从这里取组件，禁止再各写各的内联样式。
 *
 * 设计约定：
 *   卡片圆角 16px / 控件圆角 12px / 徽章全圆角
 *   控件高度 36px，单元格 padding px-4 py-3
 *   品牌色 #e60012 只用于「选中态 / 主操作 / 聚焦态」
 *   语义色只用低饱和 tint 底 + ring 描边
 * ------------------------------------------------------------------ */

/* ---------------------------- 容器 ---------------------------- */

export const surfaceClass =
  "bg-white dark:bg-[#121316] border border-black/[0.06] dark:border-white/[0.07] rounded-2xl " +
  "shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-16px_rgba(16,24,40,0.18)]";

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn(surfaceClass, "overflow-hidden", className)}>{children}</section>;
}

/* ---------------------------- 页头 ---------------------------- */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 mb-6">
      <div className="min-w-0">
        <h1 className="text-[19px] font-semibold leading-tight tracking-[-0.01em] text-[#101828] dark:text-white truncate">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-[12.5px] leading-5 text-[#98a2b3] dark:text-[#667085]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2 flex-shrink-0">{actions}</div> : null}
    </header>
  );
}

/* --------------------------- 交互控件 --------------------------- */

export function Toolbar({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("flex flex-wrap items-center gap-2.5 mb-4", className)}>{children}</div>;
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly { value: T; label: ReactNode }[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 p-0.5 rounded-xl bg-[#f1f3f6] dark:bg-white/[0.05]",
        "border border-black/[0.04] dark:border-white/[0.06]",
        className
      )}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "h-7 px-3 rounded-[9px] text-[12px] font-medium whitespace-nowrap cursor-pointer",
              "transition-all duration-200",
              active
                ? "bg-white dark:bg-[#22252a] text-[#101828] dark:text-white shadow-[0_1px_2px_rgba(16,24,40,0.10)]"
                : "text-[#7a8494] dark:text-[#667085] hover:text-[#101828] dark:hover:text-[#d0d5dd]"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function SelectField({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { className?: string }) {
  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <select
        {...rest}
        className={cn(
          "appearance-none h-9 pl-3 pr-8 rounded-xl cursor-pointer",
          "bg-white dark:bg-[#121316] border border-black/[0.08] dark:border-white/[0.08]",
          "text-[12.5px] font-medium text-[#344054] dark:text-[#d0d5dd] outline-none",
          "transition-all duration-200",
          "hover:border-black/[0.16] dark:hover:border-white/[0.16]",
          "focus:border-[#e60012]/40 focus:shadow-[0_0_0_3px_rgba(230,0,18,0.08)]"
        )}
      >
        {children}
      </select>
      <ChevronDownIcon size={15} className="pointer-events-none absolute right-2.5 text-[#98a2b3]" />
    </div>
  );
}

export function IconButton({
  label,
  onClick,
  children,
  className,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex items-center justify-center w-9 h-9 rounded-xl cursor-pointer",
        "bg-white dark:bg-[#121316] border border-black/[0.08] dark:border-white/[0.08]",
        "text-[#667085] dark:text-[#98a2b3]",
        "transition-all duration-200 active:scale-[0.97]",
        "hover:text-[#101828] dark:hover:text-white hover:border-black/[0.16] dark:hover:border-white/[0.16]",
        "hover:shadow-[0_2px_8px_-2px_rgba(16,24,40,0.12)]",
        className
      )}
    >
      {children}
    </button>
  );
}

export function SearchField({
  value,
  onChange,
  onSubmit,
  placeholder,
  buttonLabel = "搜索",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  buttonLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-1.5 h-9 pl-3 pr-1 rounded-xl",
        "bg-white dark:bg-[#121316] border border-black/[0.08] dark:border-white/[0.08]",
        "transition-all duration-200",
        "focus-within:border-[#e60012]/35 focus-within:shadow-[0_0_0_3px_rgba(230,0,18,0.08)]",
        className
      )}
    >
      <SearchIcon
        size={15}
        className="flex-shrink-0 text-[#98a2b3] group-focus-within:text-[#e60012] transition-colors"
      />
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onSubmit) onSubmit();
        }}
        className={cn(
          "flex-1 min-w-0 h-full bg-transparent text-[13px] outline-none",
          "text-[#101828] dark:text-white",
          "placeholder:text-[#98a2b3] dark:placeholder:text-[#667085]"
        )}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="清空"
          className="flex-shrink-0 w-6 h-6 inline-flex items-center justify-center rounded-lg cursor-pointer text-[#98a2b3] hover:text-[#475467] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
        >
          <CloseIcon size={13} />
        </button>
      ) : null}
      {onSubmit ? (
        <button
          type="button"
          onClick={onSubmit}
          className={cn(
            "flex-shrink-0 h-7 px-3 rounded-lg cursor-pointer",
            "bg-[#e60012] text-white text-[12px] font-medium",
            "shadow-[0_1px_2px_rgba(230,0,18,0.25)]",
            "hover:bg-[#c1000f] active:scale-[0.97] transition-all duration-200"
          )}
        >
          {buttonLabel}
        </button>
      ) : null}
    </div>
  );
}

/* ---------------------------- 徽章 ---------------------------- */

export type Tone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

const badgeTones: Record<Tone, string> = {
  neutral:
    "bg-[#f2f4f7] text-[#475467] ring-black/[0.05] dark:bg-white/[0.06] dark:text-[#98a2b3] dark:ring-white/[0.08]",
  brand:
    "bg-[#e60012]/[0.07] text-[#c1000f] ring-[#e60012]/[0.12] dark:bg-[#e60012]/[0.14] dark:text-[#ff7a84] dark:ring-[#e60012]/[0.22]",
  success:
    "bg-[#ecfdf3] text-[#027a48] ring-[#027a48]/[0.12] dark:bg-[#12b76a]/[0.12] dark:text-[#4ade80] dark:ring-[#12b76a]/[0.22]",
  warning:
    "bg-[#fffaeb] text-[#b54708] ring-[#b54708]/[0.12] dark:bg-[#f79009]/[0.12] dark:text-[#fbbf24] dark:ring-[#f79009]/[0.22]",
  danger:
    "bg-[#fef3f2] text-[#b42318] ring-[#b42318]/[0.12] dark:bg-[#f04438]/[0.12] dark:text-[#f87171] dark:ring-[#f04438]/[0.22]",
  info: "bg-[#eff8ff] text-[#175cd3] ring-[#175cd3]/[0.12] dark:bg-[#2e90fa]/[0.12] dark:text-[#60a5fa] dark:ring-[#2e90fa]/[0.22]",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center h-[22px] px-2 rounded-full whitespace-nowrap",
        "text-[11px] font-medium ring-1 ring-inset",
        badgeTones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function statusTone(status: string | null | undefined): Tone {
  if (status === "approved") return "success";
  if (status === "rejected") return "danger";
  if (status === "pending") return "warning";
  return "neutral";
}

/* ---------------------------- 表格 ---------------------------- */

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full border-collapse text-[13px]", className)}>{children}</table>
    </div>
  );
}

export function Th({
  children,
  align = "left",
  className,
}: {
  children?: ReactNode;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  return (
    <th
      className={cn(
        "bg-[#fafbfc] dark:bg-white/[0.02]",
        "border-b border-black/[0.06] dark:border-white/[0.06]",
        "px-4 py-2.5 whitespace-nowrap",
        "text-[11px] font-semibold uppercase tracking-[0.06em] text-[#98a2b3] dark:text-[#667085]",
        align === "left" && "text-left",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className
      )}
    >
      {children}
    </th>
  );
}

export function Tr({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "border-b border-black/[0.04] dark:border-white/[0.05] last:border-b-0",
        "transition-colors duration-150 hover:bg-[#fafbfc] dark:hover:bg-white/[0.02]",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </tr>
  );
}

export function Td({
  children,
  className,
  align = "left",
  muted = false,
  colSpan,
}: {
  children?: ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  muted?: boolean;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={cn(
        "px-4 py-3 align-middle",
        muted ? "text-[#667085] dark:text-[#98a2b3]" : "text-[#344054] dark:text-[#d0d5dd]",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className
      )}
    >
      {children}
    </td>
  );
}

export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-black/[0.04] dark:divide-white/[0.05]">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-3.5">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className={cn(
                "h-3 rounded-full bg-black/[0.055] dark:bg-white/[0.07] animate-pulse",
                c === 0 ? "w-[18%]" : c === cols - 1 ? "w-[10%]" : "flex-1"
              )}
              style={{ animationDelay: `${(r * cols + c) * 35}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  icon,
}: {
  title: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div
        className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center mb-3.5",
          "bg-[#f4f6f8] dark:bg-white/[0.04]",
          "border border-black/[0.05] dark:border-white/[0.06]",
          "text-[#98a2b3] dark:text-[#667085]"
        )}
      >
        {icon ?? <InboxIcon size={20} />}
      </div>
      <p className="text-[13px] font-medium text-[#475467] dark:text-[#d0d5dd]">{title}</p>
      {hint ? <p className="mt-1 text-[12px] text-[#98a2b3] dark:text-[#667085]">{hint}</p> : null}
    </div>
  );
}

/* ---------------------------- 分页 ---------------------------- */

function pageWindow(page: number, totalPages: number): (number | "gap")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const out: (number | "gap")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  if (start > 2) out.push("gap");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < totalPages - 1) out.push("gap");
  out.push(totalPages);
  return out;
}

function PageArrow({
  disabled,
  onClick,
  dir,
}: {
  disabled: boolean;
  onClick: () => void;
  dir: "left" | "right";
}) {
  const Icon = dir === "left" ? ChevronLeftIcon : ChevronRightIcon;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={dir === "left" ? "上一页" : "下一页"}
      className={cn(
        "inline-flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer",
        "text-[#667085] dark:text-[#98a2b3] transition-all duration-150",
        "hover:bg-black/[0.05] dark:hover:bg-white/[0.06] hover:text-[#101828] dark:hover:text-white",
        "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
      )}
    >
      <Icon size={15} />
    </button>
  );
}

export function Pagination({
  page,
  totalPages,
  total,
  onChange,
  totalLabel,
  className,
}: {
  page: number;
  totalPages: number;
  total: number;
  onChange: (p: number) => void;
  totalLabel?: string;
  className?: string;
}) {
  if (totalPages <= 1) return null;
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 px-4 py-3",
        "border-t border-black/[0.06] dark:border-white/[0.06]",
        "bg-[#fafbfc]/70 dark:bg-white/[0.015]",
        className
      )}
    >
      <span className="text-[12px] tabular-nums text-[#98a2b3] dark:text-[#667085]">
        {totalLabel ?? `共 ${total} 条`} · 第 {page} / {totalPages} 页
      </span>
      <div className="flex items-center gap-1">
        <PageArrow disabled={page <= 1} onClick={() => onChange(page - 1)} dir="left" />
        {pageWindow(page, totalPages).map((p, i) =>
          p === "gap" ? (
            <span key={`gap-${i}`} className="w-6 text-center text-[12px] text-[#98a2b3]">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className={cn(
                "min-w-8 h-8 px-2 rounded-lg cursor-pointer",
                "text-[12.5px] font-medium tabular-nums transition-all duration-150",
                p === page
                  ? "bg-[#e60012] text-white shadow-[0_1px_2px_rgba(230,0,18,0.28)]"
                  : "text-[#667085] dark:text-[#98a2b3] hover:bg-black/[0.05] dark:hover:bg-white/[0.06] hover:text-[#101828] dark:hover:text-white"
              )}
            >
              {p}
            </button>
          )
        )}
        <PageArrow disabled={page >= totalPages} onClick={() => onChange(page + 1)} dir="right" />
      </div>
    </div>
  );
}

/* --------------------------- 指标卡片 --------------------------- */

const statAccents: Record<Tone, { glow: string; icon: string }> = {
  neutral: { glow: "from-[#667085]/[0.10]", icon: "text-[#667085] dark:text-[#98a2b3]" },
  brand: { glow: "from-[#e60012]/[0.14]", icon: "text-[#e60012] dark:text-[#ff6b76]" },
  success: { glow: "from-[#12b76a]/[0.14]", icon: "text-[#027a48] dark:text-[#4ade80]" },
  warning: { glow: "from-[#f79009]/[0.16]", icon: "text-[#b54708] dark:text-[#fbbf24]" },
  danger: { glow: "from-[#f04438]/[0.14]", icon: "text-[#b42318] dark:text-[#f87171]" },
  info: { glow: "from-[#2e90fa]/[0.14]", icon: "text-[#175cd3] dark:text-[#60a5fa]" },
};

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
  icon,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  tone?: Tone;
  icon?: ReactNode;
}) {
  const accent = statAccents[tone];
  return (
    <div className={cn(surfaceClass, "relative overflow-hidden p-4")}>
      <div
        className={cn(
          "pointer-events-none absolute -top-10 -right-10 w-28 h-28 rounded-full bg-gradient-to-br to-transparent blur-2xl",
          accent.glow
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-[11.5px] font-medium tracking-[0.01em] text-[#667085] dark:text-[#98a2b3]">
          {label}
        </p>
        {icon ? (
          <span
            className={cn(
              "inline-flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0",
              "bg-black/[0.035] dark:bg-white/[0.06]",
              accent.icon
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p className="relative mt-2.5 text-[26px] leading-none font-semibold tabular-nums tracking-[-0.02em] text-[#101828] dark:text-white">
        {value}
      </p>
      {hint ? (
        <p className="relative mt-1.5 text-[11.5px] text-[#98a2b3] dark:text-[#667085]">{hint}</p>
      ) : null}
    </div>
  );
}

/* --------------------------- 详情（抽屉） --------------------------- */

export function DrawerSection({
  title,
  children,
  className,
}: {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-2.5", className)}>
      {title ? (
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#98a2b3] dark:text-[#667085]">
          {title}
        </h4>
      ) : null}
      {children}
    </section>
  );
}

export function DetailField({
  label,
  value,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  className?: string;
}) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div className={cn("min-w-0", className)}>
      <span className="block text-[11px] text-[#98a2b3] dark:text-[#667085]">{label}</span>
      <p className="mt-1 text-[13px] leading-5 break-words text-[#344054] dark:text-[#d0d5dd]">
        {empty ? <span className="text-[#d0d5dd] dark:text-[#475467]">—</span> : value}
      </p>
    </div>
  );
}

export function MetaFooter({ children }: { children: ReactNode }) {
  return (
    <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.06] space-y-1 font-mono text-[11px] text-[#98a2b3] dark:text-[#667085]">
      {children}
    </div>
  );
}

export function PhotoStrip({ photos }: { photos: string[] }) {
  if (photos.length === 0) return null;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {photos.map((url, i) => (
        <a
          key={i}
          href={url}
          target="_blank"
          rel="noreferrer"
          className={cn(
            "flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden",
            "border border-black/[0.06] dark:border-white/[0.08]",
            "bg-[#f2f4f7] dark:bg-white/[0.04]",
            "hover:ring-2 hover:ring-[#e60012]/25 transition-all duration-200"
          )}
        >
          <img src={url} alt="" className="w-full h-full object-cover" />
        </a>
      ))}
    </div>
  );
}
