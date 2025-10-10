'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Compass, MessageCircle, Users, Wallet2, Sparkles, Shield, Gift, Flame, Menu, Radio } from 'lucide-react';
import { useFeatureFlag } from '@/components/feature-flag-provider';
import { BalancePill } from '@/components/wallet/balance-pill';
import { useSession } from '@/components/session-provider';
import { Button } from '@/components/ui/button';
import { cn, formatNumberCompact } from '@/lib/utils';
import { NotificationMenu } from '@/components/layout/notification-menu';
import { GlobalSearch } from '@/components/layout/global-search';
import { ShareMenu } from '@/components/shared/share-menu';
import { MobileSidebar, type MobileNavItem } from '@/components/layout/mobile-sidebar';
import { useUiStore } from '@/stores/ui-store';

const iconMap = {
  discover: Compass,
  forum: Sparkles,
  match: MessageCircle,
  rooms: Radio,
  groups: Users,
  wallet: Wallet2,
  admin: Shield
};

type NavKey = keyof typeof iconMap;

const navOrder: NavKey[] = ['discover', 'forum', 'match', 'rooms', 'groups', 'wallet', 'admin'];

export function AppHeader() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const brand = useTranslations('brand');
  const session = useSession();
  const tCta = useTranslations('cta');
  const showGroups = useFeatureFlag('FEATURE_GROUPS');
  const showForum = useFeatureFlag('FEATURE_FORUM');
  const showMassiveRooms = useFeatureFlag('ROOMS_MASSIVE');
  const showPasses = useFeatureFlag('FEATURE_PASSES');

  const navItems = navOrder.filter((key) => {
    if (key === 'rooms') return showMassiveRooms;
    if (key === 'groups') return showGroups;
    if (key === 'forum') return showForum;
    if (key === 'wallet') return true;
    if (key === 'admin') return session.scope === 'admin' || session.scope === 'mod';
    return true;
  });

  const entries: MobileNavItem[] = navItems.map((key) => {
    const href = (() => {
      if (key === 'discover') return '/';
      if (key === 'wallet') return '/wallet';
      if (key === 'rooms') return '/rooms';
      if (key === 'admin') return '/admin';
      return `/${key}`;
    })();
    const Icon = iconMap[key];
    return {
      key,
      label: t(key),
      href,
      Icon
    };
  });

  const toggleMobileNav = useUiStore((state) => state.toggleMobileNav);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-muted/60 bg-surface/75 backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between gap-6 px-4">
        <div className="flex items-center gap-3 lg:gap-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Abrir menú"
            onClick={() => toggleMobileNav(true)}
          >
            <Menu className="h-5 w-5" aria-hidden />
          </Button>
          <Link href="/" className="flex items-center gap-3 text-lg font-heading font-semibold">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-accent text-sm font-bold text-bg shadow-lg">
              TKN
            </span>
            <span>{brand('name')}</span>
          </Link>
          <nav className="hidden items-center gap-2 lg:flex">
            {entries.map(({ key, href, Icon, label }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={key}
                  href={href}
                  className={cn(
                    'flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                    isActive ? 'bg-muted/80 text-text shadow' : 'text-text-muted hover:text-text'
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <GlobalSearch />
          <NotificationMenu />
          <div className="hidden sm:block">
            <BalancePill />
          </div>
          <div className="hidden flex-col text-right text-xs text-text-muted sm:flex">
            <span className="font-semibold uppercase tracking-wide">
              {session.scope === 'guest'
                ? 'Invitado'
                : session.scope === 'admin'
                ? 'Admin'
                : session.scope === 'mod'
                ? 'Moderador'
                : 'Usuario'}
            </span>
            <span className="flex items-center justify-end gap-1 text-text-muted/80">
              <Gift className="h-3.5 w-3.5 text-accent" aria-hidden />
              {formatNumberCompact(session.stats.gifts)} gifts ·
              <Flame className="h-3.5 w-3.5 text-accent" aria-hidden />
              {session.stats.referrals}
              <span>referidos</span>
            </span>
          </div>
          <ShareMenu
            title={`Únete a TKN con @${session.username}`}
            description="Recibe créditos (TKN) de bienvenida y acceso instantáneo al match 1:1."
            url={session.referralLink}
            hashtags={['TKN', 'VideochatSeguro']}
            buttonLabel="Invitar"
          />
          <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
            <Link href="/auth/register">{tCta('createAccount')}</Link>
          </Button>
        </div>
      </div>
      <div className="px-4 pb-4 sm:hidden">
        <BalancePill />
      </div>
      <MobileSidebar items={entries} />
    </header>
  );
}
