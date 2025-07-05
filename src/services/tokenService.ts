import EncryptedStorage from 'react-native-encrypted-storage';
import { apiRequest } from './api';

const TOKEN_KEY = 'auth_token';
const REFRESH_KEY = 'refresh_token';

export async function storeToken(token: string) {
  await EncryptedStorage.setItem(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  try {
    return await EncryptedStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function removeToken() {
  try { await EncryptedStorage.removeItem(TOKEN_KEY); } catch {}
}

export async function storeRefresh(token: string) {
  await EncryptedStorage.setItem(REFRESH_KEY, token);
}

export async function getRefresh(): Promise<string | null> {
  try {
    return await EncryptedStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export async function removeRefresh() {
  try { await EncryptedStorage.removeItem(REFRESH_KEY); } catch {}
}

export async function refreshToken(): Promise<string | null> {
  const refresh = await getRefresh();
  if (!refresh) return null;
  try {
    const res = await apiRequest<{ token: string; newRefresh: string }>({
      method: 'POST',
      url: 'https://example.com/refresh',
      data: { refresh },
    });
    const { token, newRefresh } = res;
    if (token) await storeToken(token);
    if (newRefresh) await storeRefresh(newRefresh);
    return token;
  } catch {
    return null;
  }
}
