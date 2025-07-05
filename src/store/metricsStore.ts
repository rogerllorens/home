import create from 'zustand';
import { get, set, STORAGE_KEYS } from '../services/storageService';
import type { Metric } from '../types';

interface MetricsState {
  metrics: Metric[];
  addMetric: (m: Metric) => void;
}

export const useMetricsStore = create<MetricsState>(set => ({
  metrics: [],
  addMetric: (metric) => set(state => {
    const updated = [...state.metrics, metric];
    set(STORAGE_KEYS.METRICS, updated);
    return { metrics: updated };
  }),
}));

export async function loadMetricsStore() {
  const raw = await get<Metric[]>(STORAGE_KEYS.METRICS);
  if (raw) useMetricsStore.setState({ metrics: raw });
}
