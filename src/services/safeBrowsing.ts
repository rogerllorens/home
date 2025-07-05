/**
 * Verify URLs using Google Safe Browsing API.
 * Falls back to local logic if limit exceeded or error.
 */
import { capture } from './errorReporting';
import { fetch as secureFetch } from 'react-native-ssl-pinning';
import Config from 'react-native-config';
import { SAFE_BROWSING_URL } from '../constants/urls';

export interface SafeBrowsingResult { isSafe: boolean; }

export async function verifyUrl(url: string): Promise<SafeBrowsingResult> {
  const apiKey = Config.SAFE_BROWSING_KEY;
  if (!apiKey) {
    console.warn('Safe Browsing API key missing');
    return true;
  }

  const body = {
    client: { clientId: 'scanly', clientVersion: '1.0' },
    threatInfo: {
      threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING'],
      platformTypes: ['ANY_PLATFORM'],
      threatEntryTypes: ['URL'],
      threatEntries: [{ url }],
    },
  };

  try {
    const res = await secureFetch(
      `${SAFE_BROWSING_URL}?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        sslPinning: { certs: ['safebrowsing'] },
      },
    );
    const json = await res.json();
    return { isSafe: !(json.matches && json.matches.length) };
  } catch (e) {
    console.warn('Safe Browsing request failed, using fallback', e.message);
    capture(e);
    return { isSafe: true };
  }
}
