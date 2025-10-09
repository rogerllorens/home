'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { FEATURE_FLAGS, type FeatureFlagKey } from '@/lib/utils';

interface FeatureFlagContextValue {
  flags: Record<FeatureFlagKey, boolean>;
}

const FeatureFlagContext = createContext<FeatureFlagContextValue>({ flags: FEATURE_FLAGS });

export const FeatureFlagProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useMemo(() => ({ flags: FEATURE_FLAGS }), []);
  return <FeatureFlagContext.Provider value={value}>{children}</FeatureFlagContext.Provider>;
};

export const useFeatureFlag = (key: FeatureFlagKey) => {
  const { flags } = useContext(FeatureFlagContext);
  return flags[key];
};

export const useFeatureFlags = () => useContext(FeatureFlagContext);
