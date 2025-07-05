import { apiRequest } from './api';

export interface DynamicQrData {
  url: string;
  counts: { total: number; today: number };
}

const API_URL = 'https://example.com/api/dynamic-qr';

export interface DynamicQrOptions {
  password?: string;
  expiresAt?: string;
}

export async function createDynamicQr(data: any, options?: DynamicQrOptions): Promise<DynamicQrData | null> {
  try {
    const res = await apiRequest<DynamicQrData>({
      method: 'POST',
      url: API_URL,
      data: { data, ...options },
    });
    return res; // { url, counts: { total, today } }
  } catch (e) {
    console.warn('Dynamic QR creation failed', e.message);
    return null;
  }
}

export async function recordDynamicScan(id: string, info: any): Promise<void> {
  try {
    await apiRequest({ method: 'POST', url: `${API_URL}/${id}/scan`, data: info });
  } catch (e) {
    console.warn('record scan failed', e.message);
  }
}

export async function fetchDynamicStats(id: string): Promise<{total:number; today:number} | null> {
  try {
    return await apiRequest({ method: 'GET', url: `${API_URL}/${id}/stats` });
  } catch (e) {
    console.warn('stats fetch failed', e.message);
    return null;
  }
}
