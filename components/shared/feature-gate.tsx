import React from 'react';
import { useFeatureFlag } from '@/components/feature-flag-provider';

interface Props {
  flag: Parameters<typeof useFeatureFlag>[0];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const FeatureGate: React.FC<Props> = ({ flag, fallback = null, children }) => {
  const enabled = useFeatureFlag(flag);
  if (!enabled) return <>{fallback}</>;
  return <>{children}</>;
};
