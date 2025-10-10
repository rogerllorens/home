import { importSPKI, jwtVerify, type JWTPayload, type KeyLike } from 'jose';

let cachedKey: KeyLike | Uint8Array | null = null;
let cachedAlgorithm: 'RS256' | 'HS256' | null = null;

async function getVerificationKey(): Promise<{ key: KeyLike | Uint8Array; algorithm: 'RS256' | 'HS256' }> {
  if (cachedKey && cachedAlgorithm) {
    return { key: cachedKey, algorithm: cachedAlgorithm };
  }

  const publicKey = process.env.JWT_PUBLIC_KEY;
  if (publicKey) {
    cachedKey = await importSPKI(publicKey, 'RS256');
    cachedAlgorithm = 'RS256';
    return { key: cachedKey, algorithm: cachedAlgorithm };
  }

  const secret = process.env.API_JWT_SECRET;
  if (!secret) {
    throw new Error('JWT verification secret not configured. Set JWT_PUBLIC_KEY or API_JWT_SECRET.');
  }
  cachedKey = new TextEncoder().encode(secret);
  cachedAlgorithm = 'HS256';
  return { key: cachedKey, algorithm: cachedAlgorithm };
}

export interface VerifiedAccessToken extends JWTPayload {
  scope?: string;
  sessionId?: string;
}

export async function verifyAccessToken(token: string): Promise<VerifiedAccessToken> {
  const { key, algorithm } = await getVerificationKey();
  const { payload } = await jwtVerify(token, key, { algorithms: [algorithm] });
  return payload as VerifiedAccessToken;
}
