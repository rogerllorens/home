'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/drawer';
import { useUiStore } from '@/stores/ui-store';
import { BalancePill } from '@/components/wallet/balance-pill';
import { ShareMenu } from '@/components/shared/share-menu';
import { useSession } from '@/components/session-provider';

export interface MobileNavItem {
  key: string;
  label: string;
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
}

interface MobileSidebarProps {
  items: MobileNavItem[];
}

export function MobileSidebar({ items }: MobileSidebarProps) {
  const session = useSession();
  const { isMobileNavOpen, toggleMobileNav } = useUiStore((state) => ({
    isMobileNavOpen: state.isMobileNavOpen,
    toggleMobileNav: state.toggleMobileNav
  }));

  return (
    <Drawer open={isMobileNavOpen} onOpenChange={(value) => toggleMobileNav(value)} title="Navegación">
      <div className="space-y-6">
        <BalancePill />
        <div className="grid gap-2">
          {items.map(({ key, label, href, Icon }) => (
            <Link
              key={key}
              href={href}
              className="flex items-center gap-3 rounded-2xl border border-muted/40 bg-muted/20 px-4 py-3 text-sm font-semibold text-text"
              onClick={() => toggleMobileNav(false)}
            >
              <Icon className="h-4 w-4 text-accent" aria-hidden />
              {label}
            </Link>
          ))}
        </div>
        <div className="rounded-3xl border border-muted/40 bg-muted/30 p-4 text-xs text-text-muted">
          <p className="font-semibold text-text">Saldo visible siempre</p>
          <p className="mt-1">Recarga créditos (TKN), revisa historial y consulta tus límites de gasto diarios y mensuales.</p>
          <Button asChild className="mt-3 w-full">
            <Link href="/wallet" onClick={() => toggleMobileNav(false)}>
              Abrir wallet
            </Link>
          </Button>
        </div>
        <ShareMenu
          title={`Únete a TKN con @${session.username}`}
          description="Comparte tu link personal. Si tus referidos compran créditos recibes +500 Créditos (TKN)."
          url={session.referralLink}
          buttonLabel="Compartir link"
          hashtags={['TKN', 'VideochatSeguro']}
        />
      </div>
    </Drawer>
  );
}
