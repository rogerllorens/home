import { apiRequest } from './api';

const API_URL = 'https://libretranslate.de/translate';

export async function translate(text: string, target = 'en'): Promise<string | null> {
  try {
    const res = await apiRequest<{ translatedText: string }>({
      method: 'POST',
      url: API_URL,
      data: { q: text, source: 'auto', target, format: 'text' },
    });
    return res.translatedText;
  } catch (e) {
    console.warn('Translation failed', e.message);
    return null;
  }
}
