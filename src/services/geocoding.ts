import { apiRequest } from './api';

const GOOGLE_PLACES_URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json';

export interface PlaceResult {
  formatted_address: string;
  geometry: { location: { lat: number; lng: number } };
}

export async function geocode(query: string, apiKey: string): Promise<PlaceResult[]> {
  try {
    const res = await apiRequest<{ results: PlaceResult[] }>({
      method: 'GET',
      url: GOOGLE_PLACES_URL,
      params: { query, key: apiKey },
    });
    return res.results;
  } catch (e) {
    console.warn('Geocoding failed, use manual location');
    return [];
  }
}
