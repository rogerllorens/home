import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "w-full rounded-2xl border border-white/15 bg-[#111111] px-4 py-3 text-sm text-foreground shadow-inner transition placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/60",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
