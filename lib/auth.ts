'use client';

import { create } from 'zustand';
import { AuthSession, SessionScope } from '@/lib/types';

const SCOPE_KEY = 'tkn:scope';
const AGE_KEY = 'tkn:age-confirmed';
const SESSION_ID_KEY = 'tkn:session-id';
const USERNAME_KEY = 'tkn:username';
const COUNTRY_KEY = 'tkn:auth-country';
const LANG_TAGS_KEY = 'tkn:auth-lang-tags';

interface AuthState extends AuthSession {
  setSession: (session: AuthSession) => void;
  markAgeConfirmed: () => void;
  clear: () => void;
}

function loadFromStorage<T>(key: string): T | undefined {
  if (typeof window === 'undefined') return undefined;
  const value = window.localStorage.getItem(key);
  return value ? (JSON.parse(value) as T) : undefined;
}

function persist(key: string, value: unknown | undefined) {
  if (typeof window === 'undefined') return;
  if (typeof value === 'undefined') {
    window.localStorage.removeItem(key);
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
}

export const useAuthStore = create<AuthState>((set) => ({
  scope: typeof window !== 'undefined' ? loadFromStorage<SessionScope>(SCOPE_KEY) ?? 'guest' : 'guest',
  username: typeof window !== 'undefined' ? loadFromStorage<string | undefined>(USERNAME_KEY) : undefined,
  sessionId:
    typeof window !== 'undefined' ? loadFromStorage<string | undefined>(SESSION_ID_KEY) : undefined,
  ageConfirmed: typeof window !== 'undefined' ? loadFromStorage<boolean>(AGE_KEY) ?? false : false,
  countryCode:
    typeof window !== 'undefined' ? loadFromStorage<string | undefined>(COUNTRY_KEY) : undefined,
  languageTags:
    typeof window !== 'undefined' ? loadFromStorage<string[] | undefined>(LANG_TAGS_KEY) ?? [] : [],
  setSession: ({ scope, sessionId, username, ageConfirmed, countryCode, languageTags }) => {
    set((state) => ({
      scope,
      sessionId: sessionId ?? state.sessionId,
      username: username ?? state.username,
      ageConfirmed: typeof ageConfirmed === 'boolean' ? ageConfirmed : state.ageConfirmed,
      countryCode: countryCode ?? state.countryCode,
      languageTags: languageTags ?? state.languageTags
    }));
    persist(SCOPE_KEY, scope);
    persist(SESSION_ID_KEY, sessionId);
    persist(USERNAME_KEY, username);
    if (typeof ageConfirmed === 'boolean') {
      persist(AGE_KEY, ageConfirmed);
    }
    if (countryCode) {
      persist(COUNTRY_KEY, countryCode);
    }
    if (languageTags) {
      persist(LANG_TAGS_KEY, languageTags);
    }
  },
  markAgeConfirmed: () => {
    set({ ageConfirmed: true });
    persist(AGE_KEY, true);
  },
  clear: () => {
    set({ scope: 'guest', sessionId: undefined, username: undefined, countryCode: undefined, languageTags: [] });
    persist(SCOPE_KEY, 'guest');
    persist(SESSION_ID_KEY, undefined);
    persist(USERNAME_KEY, undefined);
    persist(COUNTRY_KEY, undefined);
    persist(LANG_TAGS_KEY, undefined);
  }
}));
