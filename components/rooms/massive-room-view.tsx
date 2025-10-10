'use client';

import { useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Crown, Gift, MessageSquarePlus, ShieldAlert, Users } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  MASSIVE_ROOM_REACTION_OPTIONS,
  formatNumberCompact,
  formatTokens,
  CREDIT_RATE_NOTE,
  type RoomMessage,
  type RoomSummary
} from '@/lib/utils';
import { ChatPanel, type ChatMessage, type ChatParticipant } from '@/components/chat/chat-panel';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { pinMassiveRoomMessage, queryKeys, searchMassiveRoomMessages, sendMassiveRoomMessage } from '@/lib/api';

interface MassiveRoomViewProps {
  room: RoomSummary;
  initialMessages: RoomMessage[];
  enableTokenTransfer: boolean;
  enableGifts: boolean;
  enableInlineTopup: boolean;
}

export function MassiveRoomView({
  room,
  initialMessages,
  enableTokenTransfer,
  enableGifts,
  enableInlineTopup
}: MassiveRoomViewProps) {
  const t = useTranslations('rooms');
  const queryClient = useQueryClient();

  const toChatMessage = useCallback(
    (message: RoomMessage): ChatMessage => ({
      id: message.id,
      author: {
        id: message.author.id,
        username: message.author.username,
        avatar: message.author.avatarUrl,
        isMuted: message.author.role === 'helper',
        isSelf: false
      },
      body:
        message.text ??
        (message.poll
          ? `${message.poll.question}\n${message.poll.options
              .map((option) => `• ${option.label} (${option.votes})`)
              .join('\n')}`
          : ''),
      createdAt: message.createdAt,
      likes: Object.values(message.reactions ?? {}).reduce((acc, value) => acc + value, 0),
      pinned: Boolean(message.pinned),
      reactions: message.reactions,
      replyToId: message.replyTo,
      myReactions: message.myReactions ?? [],
      status: message.status ?? 'read'
    }),
    []
  );

  const participants: ChatParticipant[] = useMemo(
    () =>
      room.topSupporters?.map((supporter, index) => ({
        id: supporter.username,
        username: supporter.username,
        avatar: `https://placehold.co/48x48/121820/E5E7EB?text=${supporter.username.charAt(0).toUpperCase()}`,
        isMuted: index > 3
      })) ?? [],
    [room.topSupporters]
  );

  const chatMessages: ChatMessage[] = useMemo(
    () =>
      initialMessages.map((message, index) => ({
        ...toChatMessage(message),
        pinned: index === 0 || Boolean(message.pinned)
      })),
    [initialMessages, toChatMessage]
  );

  const handleSendMessage = useCallback(
    async (
      message: ChatMessage,
      helpers: { markDelivered: () => void; markRead: () => void; markFailed: (reason?: string) => void }
    ) => {
      try {
        const payload = await sendMassiveRoomMessage(room.id, {
          text: message.body,
          replyToId: message.replyToId ?? undefined
        });
        if (payload) {
          helpers.markDelivered();
          helpers.markRead();
          queryClient.setQueryData<RoomMessage[]>(queryKeys.roomHistory(room.id), (existing = []) => [payload, ...existing]);
        }
      } catch (error) {
        const reason = error instanceof Error ? error.message : undefined;
        helpers.markFailed(reason ?? 'No se pudo enviar el mensaje en la sala.');
      }
    },
    [queryClient, room.id]
  );

  const handleSearch = useCallback(
    async (term: string) => {
      if (!term.trim()) {
        return [];
      }
      const results = await searchMassiveRoomMessages(room.id, term);
      return results.map(toChatMessage);
    },
    [room.id, toChatMessage]
  );

  const handlePinToggle = useCallback(
    async (messageId: string, pinned: boolean) => {
      await pinMassiveRoomMessage(room.id, messageId, pinned);
      queryClient.invalidateQueries({ queryKey: queryKeys.roomHistory(room.id) });
    },
    [queryClient, room.id]
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-muted/40 bg-muted/10 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-heading font-semibold text-text">{room.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-text-muted">
            <span className="inline-flex items-center gap-1">
              <Users className="h-4 w-4" aria-hidden />
              {formatNumberCompact(room.participants)} {t('online')}
            </span>
            <span>· {formatNumberCompact(room.messagesPerMinute)} msg/min</span>
            {room.slowModeSeconds ? <span>· ⏱️ {room.slowModeSeconds}s slow-mode</span> : null}
            <span className="inline-flex items-center gap-1">
              <ShieldAlert className="h-4 w-4" aria-hidden />
              {t('modProtected')}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-text-muted">
            {room.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-muted/70 px-3 py-1 text-text">
                #{tag}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-3 text-right text-xs text-text-muted">
          <span>{CREDIT_RATE_NOTE}</span>
          {room.topSupporters && room.topSupporters.length > 0 ? (
            <div className="flex flex-col items-end gap-1 text-sm text-text">
              <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-accent">
                <Crown className="h-4 w-4" aria-hidden /> {t('topSupporters')}
              </span>
              <ul className="space-y-1 text-xs text-text">
                {room.topSupporters.slice(0, 3).map((supporter) => (
                  <li key={supporter.username} className="flex items-center gap-2">
                    <span>@{supporter.username}</span>
                    <span className="font-semibold">{formatTokens(supporter.amountTokens)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="rounded-3xl border border-muted/40 bg-surface/70 p-4">
          <ChatPanel
            context="group"
            participants={participants}
            initialMessages={chatMessages}
            slowModeSeconds={room.slowModeSeconds}
            reactionsOptions={MASSIVE_ROOM_REACTION_OPTIONS}
            allowDirectTip={enableTokenTransfer}
            showInlineTopup={enableInlineTopup}
            onMessageSend={handleSendMessage}
            onSearch={handleSearch}
            onPinToggle={handlePinToggle}
          />
        </Card>
        <aside className="space-y-4">
          <Card className="space-y-3 rounded-3xl border border-muted/40 bg-surface/70 p-5 text-sm text-text-muted">
            <h2 className="text-base font-heading font-semibold text-text">{t('rulesTitle')}</h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>{t('ruleRespect')}</li>
              <li>{t('ruleNoSpam')}</li>
              <li>{t('ruleNoLeaks')}</li>
            </ol>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => toast.success(t('reportThanks'))}
            >
              {t('reportButton')}
            </Button>
          </Card>
          {enableGifts ? (
            <Card className="space-y-3 rounded-3xl border border-accent/40 bg-accent/5 p-5 text-sm text-text">
              <h2 className="text-base font-heading font-semibold text-accent">{t('giftBarTitle')}</h2>
              <p className="text-xs text-text-muted">{t('giftBarDescription')}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {room.topSupporters?.slice(0, 4).map((supporter) => (
                  <div
                    key={`gift-${supporter.username}`}
                    className="flex items-center gap-2 rounded-2xl bg-surface/70 px-3 py-2 shadow-sm"
                  >
                    <Gift className="h-4 w-4 text-accent" aria-hidden />
                    <div>
                      <p className="font-semibold text-text">@{supporter.username}</p>
                      <p className="text-[0.7rem] text-text-muted">{formatTokens(supporter.amountTokens)}</p>
                    </div>
                  </div>
                )) ?? <span className="text-text-muted">{t('giftBarEmpty')}</span>}
              </div>
              <Button size="sm" className="w-full rounded-full" onClick={() => toast(t('giftCta'))}>
                <Gift className="mr-2 h-4 w-4" aria-hidden /> {t('sendGift')}
              </Button>
            </Card>
          ) : null}
          <Card className="space-y-3 rounded-3xl border border-muted/40 bg-surface/70 p-5 text-xs text-text-muted">
            <h2 className="text-base font-heading font-semibold text-text">{t('moderationPanel')}</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>{t('slowMode')}</span>
                <Badge variant="outline">{room.slowModeSeconds ? `${room.slowModeSeconds}s` : t('off')}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>{t('reports')}</span>
                <Badge variant="outline">0</Badge>
              </div>
            </div>
            <Button variant="secondary" size="sm" className="w-full" onClick={() => toast.info(t('requestMod'))}>
              <MessageSquarePlus className="mr-2 h-4 w-4" aria-hidden /> {t('requestMod')}
            </Button>
          </Card>
        </aside>
      </div>
    </div>
  );
}
