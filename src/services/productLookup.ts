import { fetch as secureFetch } from 'react-native-ssl-pinning';
import { get, set } from './storageService';
import singleflight from '../utils/singleflight';
import { capture } from './errorReporting';

const UPCITEMDB_URL = 'https://api.upcitemdb.com/prod/trial/lookup';
const BARCODE_MONSTER_URL = 'https://barcode.monster/api/lookup';

export interface ProductData {
  title?: string;
  description?: string;
  [key: string]: any;
}

export async function lookupUPC(upc: string): Promise<ProductData | null> {
  const cacheKey = `prod_${upc}`;
  return singleflight(cacheKey, async () => {
    const cached = await get<string>(cacheKey);
    if (cached) return JSON.parse(cached);
    try {
      const res = await secureFetch(UPCITEMDB_URL + `?upc=${upc}`,{ method:'GET', sslPinning:{certs:['upcitemdb']} });
      const json = await res.json();
      const item = json.items && json.items[0];
      if (item) {
        await set(cacheKey, item);
        return item;
      }
    } catch (e: any) {
      console.warn('UPCitemdb failed, using barcode.monster', e.message);
      capture(e);
    }

    try {
      const res = await secureFetch(`${BARCODE_MONSTER_URL}/${upc}`,{method:'GET', sslPinning:{certs:['barcodemonster']}});
      const json = await res.json();
      await set(cacheKey, json);
      return json;
    } catch (e) {
      console.error('Barcode lookup failed', e);
      capture(e);
      return null;
    }
  });
}

export async function comparePrices(upc: string): Promise<{store:string,url:string}[]> {
  return [
    { store: 'Amazon', url: `https://www.amazon.com/s?k=${upc}` },
    { store: 'eBay', url: `https://www.ebay.com/sch/i.html?_nkw=${upc}` },
  ];
}
