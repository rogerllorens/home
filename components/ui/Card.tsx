import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { CardVariant } from "@/types";

const variants: Record<CardVariant, string> = {
  default: "border border-slate-200 bg-white shadow-sm",
  elevated: "border border-slate-200 bg-white shadow-xl shadow-slate-200/70",
  dark: "border border-white/10 bg-slate-950 text-white shadow-2xl shadow-slate-950/30",
  gradient: "border border-blue-200/70 bg-gradient-to-br from-white via-blue-50 to-violet-50 shadow-xl shadow-blue-200/40",
};

export function Card({ className, variant = "default", children, ...props }: HTMLAttributes<HTMLDivElement> & { variant?: CardVariant; children: ReactNode }) {
  return <div className={cn("rounded-[1.35rem] p-6 transition duration-200", variants[variant], className)} {...props}>{children}</div>;
}
