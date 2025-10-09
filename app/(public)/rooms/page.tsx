import { FeatureGate } from '@/components/shared/feature-gate';
import { RoomsLobby } from '@/components/rooms/rooms-lobby';
import { fetchMassiveRooms } from '@/lib/api';
import { FEATURE_FLAGS } from '@/lib/utils';
import { getTranslations } from 'next-intl/server';

export const metadata = {
  title: 'Salas masivas | TKN Social'
};

export default async function RoomsPage() {
  const [t, initialResponse] = await Promise.all([
    getTranslations('rooms'),
    fetchMassiveRooms('trending')
  ]);
  const enableTopics = FEATURE_FLAGS.ROOMS_TOPICS;
  return (
    <FeatureGate flag="ROOMS_MASSIVE" fallback={<p className="text-text-muted">{t('disabled')}</p>}>
      <div className="flex flex-col gap-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-heading font-bold text-text">{t('title')}</h1>
          <p className="text-sm text-text-muted">{t('subtitle')}</p>
        </header>
        <RoomsLobby
          initialTab="trending"
          initialTopic={enableTopics ? 'all' : undefined}
          initialResponse={initialResponse}
          enableTopics={enableTopics}
        />
      </div>
    </FeatureGate>
  );
}
