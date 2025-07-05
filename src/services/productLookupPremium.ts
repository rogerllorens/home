import { fetch as secureFetch } from 'react-native-ssl-pinning';
import Config from 'react-native-config';
import { capture } from './errorReporting';

export interface PremiumProduct {
  title?: string;
  description?: string;
  price?: string;
  image?: string;
  url?: string;
}

const GOOGLE_URL = 'https://shopping.googleapis.com/content/v1/products';
const AMAZON_URL = 'https://webservices.amazon.com/paapi5/getitems';

export async function lookupUPCPremium(upc: string): Promise<PremiumProduct | null> {
  const googleKey = Config.GOOGLE_PRODUCTS_KEY;
  const amazonKey = Config.AMAZON_KEY;
  if (googleKey) {
    try {
      const res = await secureFetch(`${GOOGLE_URL}?key=${googleKey}&country=US&language=en&barcode=${upc}`, { method: 'GET', sslPinning: { certs: ['google'] } });
      const json = await res.json();
      const item = json.items && json.items[0];
      if (item) return { title: item.title, image: item.images?.[0]?.link, price: item.price?.value };
    } catch (e) {
      capture(e);
    }
  }
  if (amazonKey) {
    try {
      const res = await secureFetch(`${AMAZON_URL}?ItemIds=${upc}&Resources=Images,ItemInfo.Offers&PartnerTag=demo&PartnerType=Associates`, { method: 'GET', sslPinning: { certs: ['amazon'] }, headers: { 'x-api-key': amazonKey } });
      const json = await res.json();
      const item = json.ItemsResult?.Items?.[0];
      if (item) return { title: item.ItemInfo?.Title?.DisplayValue, image: item.Images?.Primary?.Small?.URL, price: item.Offers?.Listings?.[0]?.Price?.DisplayAmount, url: item.DetailPageURL };
    } catch (e) {
      capture(e);
    }
  }
  return null;
}
