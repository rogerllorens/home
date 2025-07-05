import axios, { AxiosRequestConfig } from 'axios';
import { capture } from './errorReporting';

export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const { data } = await axios(config);
    return data as T;
  } catch (err) {
    capture(err as Error);
    throw err;
  }
}
