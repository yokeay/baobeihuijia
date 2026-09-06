import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const variants = {
  primary: "bg-[#e60012] text-white hover:bg-[#c1000f] shadow-sm",
  secondary: "bg-black/5 dark:bg-white/10 text-[#1c1c1e]/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/20",
  outline: "border border-black/10 dark:border-white/10 text-[#1c1c1e]/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5",
  ghost: "text-[#1c1c1e]/50 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/5",
  danger: "bg-red-500 text-white hover:bg-red-600",
};

const sizes = {
  sm: "px-3 py-1.5 text-[12px] rounded-lg",
  md: "px-4 py-2 text-[13px] rounded-xl",
  lg: "px-6 py-3 text-[14px] rounded-xl",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#e60012]/30 disabled:opacity-40 disabled:pointer-events-none cursor-pointer",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
