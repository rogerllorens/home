import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { BadgeVariant } from "@/types";

const variants: Record<BadgeVariant, string> = {
  default: "border-slate-200 bg-white text-slate-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-red-200 bg-red-50 text-red-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
  ai: "border-transparent bg-gradient-to-br from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/20",
};

export function Badge({ className, variant = "default", children, ...props }: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant; children: ReactNode }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold", variants[variant], className)} {...props}>{children}</span>;
}
