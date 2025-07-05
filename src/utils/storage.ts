import { get, set, STORAGE_KEYS } from '../services/storageService';
import autoTag from './autoTag';
import type { ScanRecord, Metric } from '../types';

export async function saveScan(record: ScanRecord): Promise<void> {
  try {
    const history = (await get<ScanRecord[]>(STORAGE_KEYS.SCAN_HISTORY)) || [];
    if (!record.tags) {
      record.tags = autoTag(record.content);
    }
    if (!record.comments) record.comments = [];
    history.unshift(record);
    await set(STORAGE_KEYS.SCAN_HISTORY, history);
  } catch (e) {
    console.error('Storage save error', e);
  }
}

export async function loadHistory(): Promise<ScanRecord[]> {
  try {
    const arr = (await get<ScanRecord[]>(STORAGE_KEYS.SCAN_HISTORY)) || [];
    arr.forEach(item => {
      if (!item.tags) item.tags = autoTag(item.content);
    });
    return arr;
  } catch (e) {
    console.error('Storage load error', e);
    return [];
  }
}

export async function toggleFavorite(index: number): Promise<ScanRecord[]> {
  const history = await loadHistory();
  if (history[index]) {
    history[index].favorite = !history[index].favorite;
    await set(STORAGE_KEYS.SCAN_HISTORY, history);
  }
  return history;
}

export async function incrementCount(content: string): Promise<ScanRecord[]> {
  const history = await loadHistory();
  const item = history.find(h => h.content === content);
  if (item) {
    item.count = (item.count || 0) + 1;
    await set(STORAGE_KEYS.SCAN_HISTORY, history);
  }
  return history;
}

export async function undoLastScan(): Promise<ScanRecord[]> {
  const history = await loadHistory();
  if (history.length) {
    history.shift();
    await set(STORAGE_KEYS.SCAN_HISTORY, history);
  }
  return history;
}

export async function addComment(index: number, text: string): Promise<ScanRecord[]> {
  const history = await loadHistory();
  const item = history[index];
  if (item) {
    item.comments = item.comments || [];
    item.comments.push({ id: Date.now().toString(), text, date: new Date().toISOString() });
    await set(STORAGE_KEYS.SCAN_HISTORY, history);
  }
  return history;
}

export async function moveToFolder(index: number, folderId: string): Promise<ScanRecord[]> {
  const history = await loadHistory();
  const item = history[index];
  if (item) {
    item.folderId = folderId;
    await set(STORAGE_KEYS.SCAN_HISTORY, history);
  }
  return history;
}

export async function recordMetric(command: string, value: any): Promise<void> {
  try {
    const metrics = (await get<Metric[]>(STORAGE_KEYS.METRICS)) || [];
    metrics.push({ command, value, date: Date.now() });
    await set(STORAGE_KEYS.METRICS, metrics);
  } catch (e) {
    console.error('Metrics save error', e);
  }
}

export async function loadFolders(): Promise<{id:string,name:string}[]> {
  return (await get<{id:string,name:string}[]>(STORAGE_KEYS.FOLDERS)) || [];
}

export async function addFolder(name: string): Promise<void> {
  const folders = await loadFolders();
  folders.push({ id: Date.now().toString(), name });
  await set(STORAGE_KEYS.FOLDERS, folders);
}
