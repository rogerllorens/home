import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline" | "glass";
}

export const Badge = ({ className, variant = "default", ...props }: BadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
      variant === "default" && "bg-[#FF7A00]/90 text-black",
      variant === "outline" && "border border-white/30 text-foreground",
      variant === "glass" && "bg-white/10 text-foreground backdrop-blur",
      className
    )}
    {...props}
  />
);
