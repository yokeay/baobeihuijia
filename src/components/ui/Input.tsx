import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-[13px] font-medium text-[#1c1c1e]/60 dark:text-white/50 mb-1.5">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "w-full px-3.5 py-2.5 border border-black/10 dark:border-white/10 rounded-xl text-[14px] transition-all duration-200",
          "bg-white dark:bg-[#1a1a1a] text-[#1c1c1e] dark:text-[#e8e8e8]",
          "focus:outline-none focus:ring-2 focus:ring-[#e60012]/20 focus:border-[#e60012]/40",
          "placeholder:text-[#1c1c1e]/25 dark:placeholder:text-white/20",
          error && "border-red-500/50 focus:ring-red-500/20 focus:border-red-500",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-[12px] text-red-500">{error}</p>}
    </div>
  );
}

export function Textarea({
  label,
  error,
  className,
  id,
  ...props
}: InputProps & { rows?: number }) {
  const inputId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-[13px] font-medium text-[#1c1c1e]/60 dark:text-white/50 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          "w-full px-3.5 py-2.5 border border-black/10 dark:border-white/10 rounded-xl text-[14px] transition-all duration-200 resize-none",
          "bg-white dark:bg-[#1a1a1a] text-[#1c1c1e] dark:text-[#e8e8e8]",
          "focus:outline-none focus:ring-2 focus:ring-[#e60012]/20 focus:border-[#e60012]/40",
          "placeholder:text-[#1c1c1e]/25 dark:placeholder:text-white/20",
          error && "border-red-500/50 focus:ring-red-500/20 focus:border-red-500",
          className
        )}
        rows={4}
        {...(props as any)}
      />
      {error && <p className="mt-1 text-[12px] text-red-500">{error}</p>}
    </div>
  );
}
