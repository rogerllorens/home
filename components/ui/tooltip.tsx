'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export function Tooltip({ label, children, className }: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <span className={cn('relative inline-flex items-center', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open ? (
        <span role="tooltip" className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-surface/95 px-3 py-1 text-xs text-text shadow-lg">
          {label}
        </span>
      ) : null}
    </span>
  );
}
