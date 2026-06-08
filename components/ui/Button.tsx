import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  href?: string;
  children: ReactNode;
};

const variants: Record<Variant, string> = {
  primary: "bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-600/20 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-600/20",
  secondary: "border border-slate-200 bg-white text-slate-900 shadow-sm hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
  danger: "bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600",
  success: "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600",
};

export function Button({ className, variant = "primary", href, children, ...props }: ButtonProps) {
  const classes = cn("inline-flex min-h-11 items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-semibold transition duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60", variants[variant], className);

  if (href) {
    return <Link className={classes} href={href}>{children}</Link>;
  }

  return <button className={classes} {...props}>{children}</button>;
}
