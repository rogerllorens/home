import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[#FF6A00] via-[#FF7A00] to-[#FFA800] text-black shadow-glow hover:brightness-110 active:brightness-95",
        secondary: "bg-[#141414]/80 text-foreground border border-white/10 hover:border-white/30",
        ghost: "bg-transparent text-foreground hover:bg-white/10",
        outline: "border border-white/20 text-foreground hover:border-white/60"
      },
      size: {
        default: "px-5 py-3",
        sm: "px-4 py-2 text-xs",
        lg: "px-6 py-3 text-base",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => {
  return (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
});
Button.displayName = "Button";

export { Button, buttonVariants };
