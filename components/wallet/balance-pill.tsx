'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Wallet2, Plus } from 'lucide-react';
import { useSession } from '@/components/session-provider';
import { CREDIT_RATE_NOTE, formatTokens } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function BalancePill() {
  const t = useTranslations('wallet');
  const { tokenBalance } = useSession();

  return (
    <div className="flex items-center gap-3 rounded-3xl border border-accent/30 bg-surface/80 px-4 py-2 shadow-lg">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent/20 text-accent">
        <Wallet2 className="h-4 w-4" aria-hidden />
      </span>
      <div className="flex flex-col text-xs text-text-muted">
        <span className="font-semibold uppercase tracking-wide">{t('balance')}</span>
        <span className="text-sm font-semibold text-text">{formatTokens(tokenBalance)}</span>
        <span className="text-[0.65rem] text-text-muted/70">{CREDIT_RATE_NOTE}</span>
      </div>
      <Button asChild size="sm" variant="secondary" className="ml-2 rounded-full">
        <Link href="/wallet" className="flex items-center gap-1">
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Recargar
        </Link>
      </Button>
    </div>
  );
}
