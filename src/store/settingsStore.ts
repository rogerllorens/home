import create from 'zustand';
import { get, set, STORAGE_KEYS } from '../services/storageService';

interface SettingsState {
  powerSaving: boolean;
  setPowerSaving: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>(set => ({
  powerSaving: false,
  setPowerSaving: (v) => { set({ powerSaving: v }); set(STORAGE_KEYS.POWER_SAVING, v ? '1' : '0'); },
}));

export async function loadSettings() {
  const val = await get<string>(STORAGE_KEYS.POWER_SAVING);
  if (val) useSettingsStore.setState({ powerSaving: val === '1' });
}
