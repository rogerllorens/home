import { cn } from '@/lib/utils';
import * as React from 'react';

const badgeVariants = {
  default: 'bg-accent/15 text-accent',
  outline: 'border border-accent/40 text-accent',
  success: 'bg-success/15 text-success',
  warn: 'bg-warn/15 text-warn',
  destructive: 'bg-red-500/15 text-red-400',
  secondary: 'bg-muted/60 text-text'
};

type Variant = keyof typeof badgeVariants;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(({ className, variant = 'default', ...props }, ref) => (
  <span
    ref={ref}
    className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide', badgeVariants[variant], className)}
    {...props}
  />
));
Badge.displayName = 'Badge';
