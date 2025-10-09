import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "group rounded-3xl border border-white/5 bg-white/[0.04] p-6 shadow-soft backdrop-blur-xl transition hover:-translate-y-1 hover:border-white/20",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn("text-xl font-semibold tracking-tight", className)} {...props} />
);

const CardDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("mt-2 text-sm text-muted", className)} {...props} />
);

export { Card, CardTitle, CardDescription };
