import create from 'zustand';
import { get, set, STORAGE_KEYS } from '../services/storageService';
import autoTag from '../utils/autoTag';
import type { ScanRecord } from '../types';

interface HistoryState {
  history: ScanRecord[];
  setHistory: (h: ScanRecord[]) => void;
}

export const useHistoryStore = create<HistoryState>(set => ({
  history: [],
  setHistory: (history) => set({ history }),
}));

export async function loadHistoryStore() {
  const raw = await get<ScanRecord[]>(STORAGE_KEYS.SCAN_HISTORY);
  const history = raw || [];
  history.forEach(h => {
    if (!h.tags) h.tags = autoTag(h.content);
  });
  const days = await get<number>(STORAGE_KEYS.DELETE_AFTER);
  const now = Date.now();
  const kept = days
    ? history.filter(h => now - new Date(h.date).getTime() <= days * 86400000)
    : history;
  if (kept.length !== history.length) {
    await set(STORAGE_KEYS.SCAN_HISTORY, kept);
  }
  useHistoryStore.getState().setHistory(kept);
  return kept;
}
