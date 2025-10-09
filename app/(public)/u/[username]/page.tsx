import { ProfileFeed } from '@/components/profile/profile-feed';
import { FeatureGate } from '@/components/shared/feature-gate';

export const metadata = {
  title: 'Perfil | TKN Social'
};

export default function UserProfilePage() {
  return (
    <FeatureGate flag="FEATURE_PASSES" fallback={<p>Los pases están deshabilitados temporalmente.</p>}>
      <ProfileFeed />
    </FeatureGate>
  );
}
