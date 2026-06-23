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
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
          "placeholder:text-gray-400",
          error && "border-red-500 focus:ring-red-500/30 focus:border-red-500",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
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
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm transition-colors resize-none",
          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
          "placeholder:text-gray-400",
          error && "border-red-500 focus:ring-red-500/30 focus:border-red-500",
          className
        )}
        rows={4}
        {...(props as any)}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
