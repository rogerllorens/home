'use client';

import { Toaster as SonnerToaster, ToasterProps } from 'sonner';

export function Toaster(props: ToasterProps) {
  return <SonnerToaster theme="dark" toastOptions={{ className: 'rounded-2xl bg-surface text-text border border-muted/60 shadow-xl' }} {...props} />;
}
