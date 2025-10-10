'use client';

import { type ComponentType, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Flame, Loader2, Radio, Sparkles, Users } from 'lucide-react';
import {
  MASSIVE_ROOM_TOPIC_CHIPS,
  type RoomSummary,
  type RoomTab,
  formatNumberCompact,
  formatTokens,
  CREDIT_RATE_NOTE
} from '@/lib/utils';
import { fetchMassiveRooms, queryKeys } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface RoomsLobbyProps {
  initialTab: RoomTab;
  initialTopic?: string;
  initialResponse: { rooms: RoomSummary[]; nextCursor?: string };
  enableTopics: boolean;
}

const TABS: Array<{ id: RoomTab; icon: ComponentType<{ className?: string }>; labelKey: string }> = [
  { id: 'trending', icon: Flame, labelKey: 'trending' },
  { id: 'random', icon: Radio, labelKey: 'random' },
  { id: 'topics', icon: Sparkles, labelKey: 'topics' }
];

export function RoomsLobby({ initialTab, initialTopic = 'all', initialResponse, enableTopics }: RoomsLobbyProps) {
  const t = useTranslations('rooms');
  const [tab, setTab] = useState<RoomTab>(initialTab);
  const [topic, setTopic] = useState<string>(initialTopic);

  const queryKey = queryKeys.roomsLobby(tab, enableTopics ? topic : undefined);

  const { data, isFetching } = useQuery({
    queryKey,
    queryFn: () => fetchMassiveRooms(tab, enableTopics ? topic : undefined),
    staleTime: 30_000,
    initialData:
      tab === initialTab && (!enableTopics || topic === initialTopic)
        ? initialResponse
        : undefined
  });

  const rooms = data?.rooms ?? [];

  const tabs = useMemo(
    () =>
      TABS.filter((item) => (item.id === 'topics' ? enableTopics : true)).map((item) => ({
        id: item.id,
        label: (
          <span className="flex items-center gap-2">
            <item.icon className="h-4 w-4" aria-hidden />
            {t(item.labelKey)}
          </span>
        ),
        content: null
      })),
    [enableTopics, t]
  );

  const handleTabChange = (next: RoomTab) => {
    setTab(next);
    if (next !== 'topics') {
      setTopic('all');
    }
  };

  return (
    <div className="space-y-6">
      <Tabs tabs={tabs} selected={tab} onChange={handleTabChange} />
      {tab === 'topics' && enableTopics ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTopic('all')}
            className={cn(
              'rounded-full border px-3 py-1 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              topic === 'all' ? 'border-accent bg-accent/10 text-accent' : 'border-muted/40 text-text-muted hover:border-accent/40'
            )}
          >
            {t('allTopics')}
          </button>
          {MASSIVE_ROOM_TOPIC_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setTopic(chip.id)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                topic === chip.id ? 'border-accent bg-accent/10 text-accent' : 'border-muted/40 text-text-muted hover:border-accent/40'
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} isTrending={tab === 'trending'} />
        ))}
        {rooms.length === 0 ? (
          <Card className="col-span-full flex flex-col items-center justify-center gap-2 rounded-3xl border-dashed py-12 text-center text-text-muted">
            <Users className="h-8 w-8" aria-hidden />
            <p>{t('empty')}</p>
          </Card>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-3xl border border-muted/40 bg-muted/10 px-4 py-3 text-xs text-text-muted">
        <span>{t('conversionNote')}</span>
        <span className="font-semibold text-text">{CREDIT_RATE_NOTE}</span>
      </div>
      {isFetching ? (
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          {t('loading')}
        </div>
      ) : null}
    </div>
  );
}

interface RoomCardProps {
  room: RoomSummary;
  isTrending: boolean;
}

function RoomCard({ room, isTrending }: RoomCardProps) {
  const t = useTranslations('rooms');
  return (
    <Card className="flex h-full flex-col justify-between gap-4 rounded-3xl border border-muted/40 bg-surface/80 p-5 shadow-lg transition hover:border-accent/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-heading font-semibold text-text">{room.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
            <Badge variant={room.isNsfw ? 'destructive' : 'outline'}>{room.isNsfw ? t('nsfw') : t('sfw')}</Badge>
            <span>{formatNumberCompact(room.participants)} online</span>
            <span>· {formatNumberCompact(room.messagesPerMinute)} msg/min</span>
            {room.slowModeSeconds ? <span>· ⏱️ {room.slowModeSeconds}s slow</span> : null}
          </div>
        </div>
        {isTrending ? (
          <Badge className="bg-accent/20 text-accent">🔥 {t('trendingBadge')}</Badge>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-text-muted">
        {room.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-muted/40 px-3 py-1">
            #{tag}
          </span>
        ))}
      </div>
      {room.topSupporters && room.topSupporters.length > 0 ? (
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-3 text-xs">
          <p className="mb-2 font-semibold text-accent">{t('topSupporters')}</p>
          <ul className="space-y-1">
            {room.topSupporters.map((supporter) => (
              <li key={supporter.username} className="flex items-center justify-between">
                <span>@{supporter.username}</span>
                <span className="font-semibold text-text">
                  {formatTokens(supporter.amountTokens)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-3">
        <div className="text-[0.75rem] text-text-muted">
          {t('ctaDescription')}
        </div>
        <Button asChild size="sm" className="rounded-full px-5">
          <Link href={`/rooms/${room.id}`}>{t('join')}</Link>
        </Button>
      </div>
    </Card>
  );
}
