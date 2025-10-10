'use client';

import { useState } from 'react';
import { Drawer } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/stores/ui-store';
import { useSession } from '@/components/session-provider';
import { getStaticCatalog } from '@/components/session-provider';
import { toast } from 'sonner';
import { sendGift } from '@/lib/api';
import { formatTokens } from '@/lib/utils';

export function GiftDrawer() {
  const { isGiftDrawerOpen, toggleGiftDrawer, registerGiftEvent } = useUiStore();
  const session = useSession();
  const { gifts } = getStaticCatalog();
  const [sendingId, setSendingId] = useState<string | null>(null);

  const handleSend = async (giftId: string) => {
    const gift = gifts.find((item) => item.id === giftId);
    if (!gift) return;
    setSendingId(giftId);
    const ok = await session.spend(gift.cost, `Gift ${gift.name}`, {
      execute: () =>
        sendGift({
          giftId,
          tokens: gift.cost,
          concept: gift.name
        })
    });
    setSendingId(null);
    if (!ok) return;
    toast.success('¡Enviado! 🎁', {
      description: `${gift.name} por ${formatTokens(gift.cost)}`
    });
    registerGiftEvent({ name: gift.name, tokens: gift.cost });
    session.addNotification({
      type: 'gift',
      message: `Enviaste ${gift.name} (${formatTokens(gift.cost)}).`
    });
    toggleGiftDrawer(false);
  };

  return (
    <Drawer open={isGiftDrawerOpen} onOpenChange={toggleGiftDrawer} title="Catálogo de regalos">
      <div className="space-y-4">
        {gifts.map((gift) => (
          <div key={gift.id} className="flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-3">
            <div>
              <p className="font-semibold">{gift.name}</p>
              <p className="text-xs text-text-muted">{formatTokens(gift.cost)}</p>
            </div>
            <Button size="sm" onClick={() => handleSend(gift.id)} disabled={sendingId === gift.id}>
              Enviar
            </Button>
          </div>
        ))}
      </div>
    </Drawer>
  );
}
