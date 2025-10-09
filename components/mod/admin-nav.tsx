'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Users2,
  ShieldAlert,
  Film,
  Coins,
  HandCoins,
  MessageSquareText
} from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/admin', icon: LayoutDashboard, key: 'dashboard' },
  { href: '/admin/users', icon: Users2, key: 'users' },
  { href: '/admin/reports', icon: ShieldAlert, key: 'reports' },
  { href: '/admin/content', icon: Film, key: 'content' },
  { href: '/admin/economy', icon: Coins, key: 'economy' },
  { href: '/admin/payouts', icon: HandCoins, key: 'payouts' },
  { href: '/admin/forum', icon: MessageSquareText, key: 'forum' }
] as const;

export function AdminNav() {
  const pathname = usePathname();
  const t = useTranslations('admin.nav');

  return (
    <aside className="w-full rounded-3xl border border-muted/60 bg-surface/70 p-4 shadow-xl backdrop-blur lg:w-64">
      <div className="mb-3 text-xs uppercase tracking-widest text-text-muted">{t('label')}</div>
      <nav className="flex flex-col gap-2">
        {items.map(({ href, icon: Icon, key }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={key}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                isActive ? 'bg-accent/10 text-text shadow-inner ring-1 ring-accent' : 'text-text-muted hover:text-text'
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span>{t(key)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
