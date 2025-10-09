import { MatchPanel } from '@/components/match/match-panel';
import { FeatureGate } from '@/components/shared/feature-gate';

export const metadata = {
  title: 'Match | TKN Social'
};

export default function MatchPage() {
  return (
    <FeatureGate flag="FEATURE_GUEST" fallback={<p>El modo invitado está deshabilitado.</p>}>
      <MatchPanel />
    </FeatureGate>
  );
}
