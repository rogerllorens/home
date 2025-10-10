'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type TooltipSide = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  label: string;
  children: React.ReactNode;
  className?: string;
  side?: TooltipSide;
}

const sideToPosition: Record<TooltipSide, string> = {
  top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
  bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
  left: 'right-full mr-2 top-1/2 -translate-y-1/2',
  right: 'left-full ml-2 top-1/2 -translate-y-1/2'
};

export function Tooltip({ label, children, className, side = 'top' }: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <span
      className={cn('relative inline-flex items-center', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open ? (
        <span
          role="tooltip"
          className={cn(
            'pointer-events-none absolute whitespace-nowrap rounded-full bg-surface/95 px-3 py-1 text-xs text-text shadow-lg',
            sideToPosition[side]
          )}
        >
          {label}
        </span>
      ) : null}
    </span>
  );
}
