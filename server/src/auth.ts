import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import { nanoid } from 'nanoid';
import { JWT_SECRET, REFRESH_EXPIRATION, TOKEN_EXPIRATION } from './config.js';
import { Scope, Session, User } from './types.js';
import { getSession, upsertSession, createUser, getUserByEmail, getUserByUsername } from './store.js';

interface TokenPayload {
  sub: string;
  scope: Scope;
  sessionId: string;
}

const refreshTokens = new Map<string, { sessionId: string; expiresAt: number }>();

export function signAccessToken(session: Session): string {
  const payload: TokenPayload = { sub: session.userId ?? session.id, scope: session.scope, sessionId: session.id };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });
}

export function signRefreshToken(session: Session): string {
  const token = nanoid();
  refreshTokens.set(token, { sessionId: session.id, expiresAt: Date.now() + REFRESH_EXPIRATION * 1000 });
  return token;
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    return false;
  }
}

export async function registerUser(params: {
  username: string;
  email?: string;
  password: string;
  ageConfirmed: boolean;
  countryCode?: string;
  languageTags?: string[];
  referralCode?: string;
}): Promise<Session> {
  if (getUserByUsername(params.username)) {
    throw new Error('USERNAME_TAKEN');
  }
  if (params.email && getUserByEmail(params.email)) {
    throw new Error('EMAIL_TAKEN');
  }
  const user = createUser({
    username: params.username,
    email: params.email,
    passHash: await hashPassword(params.password),
    role: 'user',
    countryCode: params.countryCode,
    languageTags: params.languageTags ?? []
  });
  const session: Session = {
    id: nanoid(),
    userId: user.id,
    scope: 'user',
    ageConfirmed: params.ageConfirmed,
    countryCode: params.countryCode,
    languageTags: params.languageTags ?? [],
    createdAt: Date.now(),
    lastSeen: Date.now()
  };
  upsertSession(session);
  return session;
}

export async function loginUser(params: { usernameOrEmail: string; password: string }): Promise<Session> {
  const lookup = params.usernameOrEmail.includes('@')
    ? getUserByEmail(params.usernameOrEmail)
    : getUserByUsername(params.usernameOrEmail);
  if (!lookup || !lookup.passHash) {
    throw new Error('INVALID_CREDENTIALS');
  }
  const valid = await verifyPassword(lookup.passHash, params.password);
  if (!valid) {
    throw new Error('INVALID_CREDENTIALS');
  }
  const session: Session = {
    id: nanoid(),
    userId: lookup.id,
    scope: lookup.role,
    ageConfirmed: true,
    countryCode: lookup.countryCode,
    languageTags: lookup.languageTags,
    createdAt: Date.now(),
    lastSeen: Date.now()
  };
  upsertSession(session);
  return session;
}

export function createGuestSession(params: {
  ageConfirmed: boolean;
  countryCode?: string;
  languageTags?: string[];
}): Session {
  const session: Session = {
    id: nanoid(),
    scope: 'guest',
    ageConfirmed: params.ageConfirmed,
    countryCode: params.countryCode,
    languageTags: params.languageTags ?? [],
    createdAt: Date.now(),
    lastSeen: Date.now()
  };
  upsertSession(session);
  return session;
}

export async function upgradeGuestSession(sessionId: string, params: {
  username: string;
  email?: string;
  password: string;
  countryCode?: string;
  languageTags?: string[];
}): Promise<Session> {
  const session = getSession(sessionId);
  if (!session) {
    throw new Error('SESSION_NOT_FOUND');
  }
  if (session.userId) {
    throw new Error('SESSION_ALREADY_UPGRADED');
  }
  if (getUserByUsername(params.username)) {
    throw new Error('USERNAME_TAKEN');
  }
  if (params.email && getUserByEmail(params.email)) {
    throw new Error('EMAIL_TAKEN');
  }
  const passHash = await hashPassword(params.password);
  const user = createUser({
    username: params.username,
    email: params.email,
    passHash,
    role: 'user',
    countryCode: params.countryCode,
    languageTags: params.languageTags ?? []
  });
  session.userId = user.id;
  session.scope = 'user';
  session.countryCode = params.countryCode;
  session.languageTags = params.languageTags ?? [];
  session.lastSeen = Date.now();
  upsertSession(session);
  return session;
}

export function refreshAccessToken(token: string): Session {
  const entry = refreshTokens.get(token);
  if (!entry) {
    throw new Error('INVALID_REFRESH');
  }
  if (entry.expiresAt < Date.now()) {
    refreshTokens.delete(token);
    throw new Error('REFRESH_EXPIRED');
  }
  const session = getSession(entry.sessionId);
  if (!session) {
    refreshTokens.delete(token);
    throw new Error('SESSION_NOT_FOUND');
  }
  session.lastSeen = Date.now();
  upsertSession(session);
  return session;
}

export function revokeRefreshToken(token: string): void {
  refreshTokens.delete(token);
}
