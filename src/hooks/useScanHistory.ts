import { useState, useEffect } from 'react';
import { loadHistory, saveScan, toggleFavorite, undoLastScan, incrementCount } from '../utils/storage';
import type { ScanRecord } from '../types';

export default function useScanHistory() {
  const [history, setHistory] = useState<ScanRecord[]>([]);

  useEffect(() => {
    loadHistory().then(setHistory);
  }, []);

  async function add(record: ScanRecord) {
    await saveScan(record);
    setHistory(await loadHistory());
  }

  async function favorite(idx: number) {
    setHistory(await toggleFavorite(idx));
  }

  async function undo() {
    setHistory(await undoLastScan());
  }

  async function increment(content: string) {
    setHistory(await incrementCount(content));
  }

  return { history, add, favorite, undo, increment };
}
