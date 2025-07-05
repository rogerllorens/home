import AsyncStorage from '@react-native-async-storage/async-storage';
import EncryptedStorage from 'react-native-encrypted-storage';

export const STORAGE_KEYS = {
  SCAN_HISTORY: 'scan_history',
  BATCH_STATE: 'batch_state',
  USER_NAME: 'user_name',
  METRICS: 'metrics',
  TIP_SCAN: 'tip_shown_scan',
  TIP_BATCH: 'tip_shown_batch',
  TIP_MAP: 'map_tip_shown',
  BARCODE_TYPES: 'barcode_types',
  FOLDERS: 'folders',
  POWER_SAVING: 'power_saving',
  TAB_ORDER: 'tab_order',
  VAULT: 'vault_scans',
  DELETE_AFTER: 'auto_delete_days',
};

export async function get<T>(key: string): Promise<T | null> {
  const value = await AsyncStorage.getItem(key);
  return value ? JSON.parse(value) as T : null;
}

export async function getSecure<T>(key: string): Promise<T | null> {
  try {
    const value = await EncryptedStorage.getItem(key);
    return value ? JSON.parse(value) as T : null;
  } catch {
    return null;
  }
}

export async function set<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function setSecure<T>(key: string, value: T): Promise<void> {
  try {
    await EncryptedStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export async function remove(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

export async function removeSecure(key: string): Promise<void> {
  try {
    await EncryptedStorage.removeItem(key);
  } catch {}
}

export async function clearAll(): Promise<void> {
  await AsyncStorage.clear();
}

export async function saveToVault(id: string, data: any): Promise<void> {
  const vault = (await getSecure<Record<string, any>>(STORAGE_KEYS.VAULT)) || {};
  vault[id] = data;
  await setSecure(STORAGE_KEYS.VAULT, vault);
}

export async function getVault(): Promise<Record<string, any>> {
  return (await getSecure<Record<string, any>>(STORAGE_KEYS.VAULT)) || {};
}

export async function removeFromVault(id: string): Promise<void> {
  const vault = await getVault();
  delete vault[id];
  await setSecure(STORAGE_KEYS.VAULT, vault);
}
