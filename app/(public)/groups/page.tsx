import { FeatureGate } from '@/components/shared/feature-gate';
import { GroupLobby } from '@/components/groups/group-lobby';
import { fetchGroups } from '@/lib/api';
import { getTranslations } from 'next-intl/server';

export const metadata = {
  title: 'Grupos | TKN Social'
};

export default async function GroupsPage() {
  const [tGroups, rooms] = await Promise.all([getTranslations('groups'), fetchGroups()]);
  return (
    <FeatureGate flag="FEATURE_GROUPS" fallback={<p>Los grupos están deshabilitados en esta build.</p>}>
      <div className="flex flex-col gap-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-heading font-bold text-text">{tGroups('title')}</h1>
          <p className="text-sm text-text-muted">Crea salas con tickets VIP, gifts y chat lateral.</p>
        </header>
        <GroupLobby initialRooms={rooms} />
      </div>
    </FeatureGate>
  );
}
