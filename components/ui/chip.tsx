import React from 'react';
import { cn } from '@/lib/utils';

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export const Chip: React.FC<ChipProps> = ({ selected, className, children, ...props }) => {
  return (
    <button
      className={cn(
        'rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        selected
          ? 'border-accent bg-accent/20 text-accent shadow'
          : 'border-transparent bg-muted/40 text-text-muted hover:text-text hover:bg-muted/60'
      )}
      {...props}
    >
      {children}
    </button>
  );
};
