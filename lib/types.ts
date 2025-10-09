export type SessionScope = 'guest' | 'user' | 'admin' | 'mod';

export interface AuthSession {
  scope: SessionScope;
  username?: string;
  sessionId?: string;
  ageConfirmed?: boolean;
  countryCode?: string;
  languageTags?: string[];
}
