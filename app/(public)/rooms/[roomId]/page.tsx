import { notFound } from 'next/navigation';
import { FeatureGate } from '@/components/shared/feature-gate';
import { MassiveRoomView } from '@/components/rooms/massive-room-view';
import { fetchMassiveRoom, fetchMassiveRoomHistory } from '@/lib/api';
import { FEATURE_FLAGS } from '@/lib/utils';
import { getTranslations } from 'next-intl/server';

interface RoomPageProps {
  params: { roomId: string };
}

export async function generateMetadata({ params }: RoomPageProps) {
  const room = await fetchMassiveRoom(params.roomId);
  return {
    title: room ? `${room.title} | Salas masivas` : 'Salas masivas | TKN Social'
  };
}

export default async function MassiveRoomPage({ params }: RoomPageProps) {
  if (!FEATURE_FLAGS.ROOMS_MASSIVE) {
    notFound();
  }
  const room = await fetchMassiveRoom(params.roomId);
  if (!room) {
    notFound();
  }
  const [messages, t] = await Promise.all([
    fetchMassiveRoomHistory(room.id),
    getTranslations('rooms')
  ]);

  return (
    <FeatureGate flag="ROOMS_MASSIVE" fallback={<p className="text-text-muted">{t('disabled')}</p>}>
      <MassiveRoomView
        room={room}
        initialMessages={messages}
        enableTokenTransfer={FEATURE_FLAGS.ROOMS_TOKEN_TRANSFER}
        enableGifts={FEATURE_FLAGS.ROOMS_GIFTS}
        enableInlineTopup={FEATURE_FLAGS.ROOMS_INLINE_TOPUP}
      />
    </FeatureGate>
  );
}
