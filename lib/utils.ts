import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const randomChunk = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

export const createCorrelationId = (scope: string = 'req', parent?: string) => {
  const base = randomChunk();
  if (parent) {
    return `${scope}-${parent}-${base}`;
  }
  return `${scope}-${base}`;
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const readFlag = (key: string, fallback: boolean) => {
  if (typeof process === 'undefined' || !process.env) return fallback;
  const value = process.env[`NEXT_PUBLIC_${key}`] ?? process.env[key];
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
};

export const FEATURE_FLAGS = {
  FEATURE_GUEST: readFlag('FEATURE_GUEST', true),
  FEATURE_GROUPS: readFlag('FEATURE_GROUPS', true),
  FEATURE_FORUM: readFlag('FEATURE_FORUM', true),
  FEATURE_PASSES: readFlag('FEATURE_PASSES', true),
  FEATURE_SSO: readFlag('FEATURE_SSO', true),
  FEATURE_LIVE: readFlag('FEATURE_LIVE', false),
  FEATURE_RECORDING: readFlag('FEATURE_RECORDING', false),
  FEATURE_PAYOUTS: readFlag('FEATURE_PAYOUTS', true),
  PAYOUTS_REQUIRE_KYC: readFlag('PAYOUTS_REQUIRE_KYC', false),
  ROOMS_MASSIVE: readFlag('ROOMS_MASSIVE', false),
  ROOMS_TOPICS: readFlag('ROOMS_TOPICS', false),
  ROOMS_POLLS: readFlag('ROOMS_POLLS', false),
  ROOMS_TOKEN_TRANSFER: readFlag('ROOMS_TOKEN_TRANSFER', false),
  ROOMS_GIFTS: readFlag('ROOMS_GIFTS', false),
  ROOMS_INLINE_TOPUP: readFlag('ROOMS_INLINE_TOPUP', false)
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

export const CREDIT_LABEL = 'Créditos (TKN)';
export const CREDIT_RATE_NOTE = '100 TKN ≈ 1 €';

export const TOKEN_PACKS = [
  { id: 'pack-s', name: 'Pack S', amount: 500, price: 4.99 },
  { id: 'pack-m', name: 'Pack M', amount: 1200, price: 9.99 },
  { id: 'pack-l', name: 'Pack L', amount: 3000, price: 24.99 },
  { id: 'pack-xl', name: 'Pack XL', amount: 6500, price: 49.99 },
  { id: 'pack-xxl', name: 'Pack XXL', amount: 14000, price: 99.99 }
] as const;

export const GIFT_CATALOGUE = [
  { id: 'heart', name: 'Heart', cost: 20 },
  { id: 'kiss', name: 'Kiss', cost: 50 },
  { id: 'rose', name: 'Rose', cost: 100 },
  { id: 'fireworks', name: 'Fireworks', cost: 500 },
  { id: 'supernova', name: 'Supernova', cost: 1000 },
  { id: 'meteor', name: 'Meteor Shower', cost: 5000 }
] as const;

export const CREATOR_TIERS = [
  { id: 'bronze', label: 'Bronce', minTokens: 0 },
  { id: 'silver', label: 'Plata', minTokens: 25000 },
  { id: 'gold', label: 'Oro', minTokens: 75000 },
  { id: 'platinum', label: 'Platino', minTokens: 150000 }
] as const;

export const resolveCreatorTier = (totalEarningsTokens: number) => {
  const tier = [...CREATOR_TIERS].reverse().find((item) => totalEarningsTokens >= item.minTokens);
  return tier ?? CREATOR_TIERS[0];
};

export const DEFAULT_PRICE_SUGGESTIONS = {
  ppv: [499, 999, 1499],
  pass: 1499,
  vipTicket: 300,
  payPerMinute: 150
} as const;

export const PRICE_LIMITS = {
  ppv: { min: 199, max: 1999 },
  pass: { min: 499, max: 2999 },
  payPerMinute: { min: 50, max: 500 },
  vipTicket: { min: 100, max: 1000 }
} as const;

export type Visibility = 'free' | 'ppv' | 'pass_only';

export interface MediaAsset {
  id: string;
  type: 'image' | 'video';
  title?: string;
  sizeMb: number;
  visibility: Visibility;
  price?: number;
  url: string;
}

export interface ProfileSummary {
  username: string;
  bio: string;
  isOnline: boolean;
  avatar: string;
  preferences: string[];
  passPrice: number;
  hasPendingEarnings: number;
  media: MediaAsset[];
}

export interface ForumCategory {
  id: string;
  name: string;
  description: string;
  threads: number;
  posts: number;
}

export type RoomTab = 'trending' | 'random' | 'topics';

export interface RoomSummary {
  id: string;
  title: string;
  type: 'random' | 'topic';
  tags: string[];
  participants: number;
  messagesPerMinute: number;
  isNsfw: boolean;
  slowModeSeconds?: number;
  topSupporters?: Array<{ username: string; amountTokens: number }>;
}

export interface RoomMessage {
  id: string;
  roomId: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    role: 'owner' | 'mod' | 'helper' | 'member';
  };
  text?: string;
  replyTo?: string;
  createdAt: string;
  reactions: Record<string, number>;
  mentions?: string[];
  media?: Array<{
    id: string;
    type: 'image' | 'video';
    url: string;
    thumbnailUrl?: string;
    status: 'pending' | 'ok' | 'blocked';
  }>;
  poll?: {
    id: string;
    question: string;
    options: Array<{ id: string; label: string; votes: number; voted?: boolean }>;
    closesAt?: string;
  };
  pinned?: boolean;
  myReactions?: string[];
  status?: 'sent' | 'delivered' | 'read';
}

export interface RoomPresenceSummary {
  online: number;
  slowModeSeconds?: number;
  slowModeReason?: string;
}

export const MASSIVE_ROOM_REACTION_OPTIONS = ['❤️', '😂', '🔥', '👍'] as const;

export const MASSIVE_ROOM_TOPIC_CHIPS = [
  { id: 'fresh', label: 'Nuevos' },
  { id: 'music', label: 'Música' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'travel', label: 'Viajes' },
  { id: 'wellness', label: 'Bienestar' },
  { id: 'kink', label: 'Kink 🔥', nsfw: true },
  { id: 'lgbtq', label: 'LGBTQ+' },
  { id: 'spanish', label: 'Español' },
  { id: 'english', label: 'English' }
] as const;

export interface VipGroup {
  id: string;
  title: string;
  description: string;
  price: number;
  isVip: boolean;
  membersOnline: number;
}

export interface MatchPreference {
  id: string;
  label: string;
  description: string;
}

export const MATCH_PREFERENCES: MatchPreference[] = [
  {
    id: 'soft',
    label: 'Charla soft',
    description: 'Conversaciones ligeras, sin desnudos ni juguetes.'
  },
  {
    id: 'toys',
    label: 'Juguetes',
    description: 'Uso de juguetes. Señala límites y pide consentimiento previo.'
  },
  {
    id: 'roles',
    label: 'Roles X/Y',
    description: 'Role play consensuado. Define palabras seguras antes de empezar.'
  },
  {
    id: 'sfw',
    label: 'SFW',
    description: 'Sin contenido sexual explícito. Perfecto para conocer gente.'
  },
  {
    id: 'nsfw',
    label: 'NSFW',
    description: 'Contenido explícito. Confirma que ambos lo desean antes de seguir.'
  }
];

export interface CountryOption {
  code: string;
  name: string;
  languages: string[];
}

export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: 'ES', name: 'España', languages: ['es'] },
  { code: 'MX', name: 'México', languages: ['es'] },
  { code: 'AR', name: 'Argentina', languages: ['es'] },
  { code: 'US', name: 'Estados Unidos', languages: ['en', 'es'] },
  { code: 'CO', name: 'Colombia', languages: ['es'] },
  { code: 'CL', name: 'Chile', languages: ['es'] },
  { code: 'PE', name: 'Perú', languages: ['es'] },
  { code: 'VE', name: 'Venezuela', languages: ['es'] },
  { code: 'BR', name: 'Brasil', languages: ['pt', 'es'] },
  { code: 'FR', name: 'Francia', languages: ['fr', 'en'] }
];

export const INTEREST_TAGS = [
  'música',
  'gaming',
  'idiomas',
  'cine',
  'fitness',
  'viajes',
  'arte',
  'kink',
  'charla soft',
  'experiencias'
];

export const resolveDefaultCountry = () => {
  if (typeof navigator !== 'undefined' && navigator.language) {
    const locale = navigator.language.toUpperCase();
    const match = COUNTRY_OPTIONS.find((country) =>
      locale.includes(country.code)
    );
    if (match) return match.code;
  }
  return 'ES';
};

export const resolveLanguagesForCountry = (code: string) =>
  COUNTRY_OPTIONS.find((country) => country.code === code)?.languages ?? ['es'];

export const formatTokens = (amount: number) =>
  `${amount.toLocaleString('es-ES')} ${CREDIT_LABEL}`;

const DEFAULT_LOCALE = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().locale : 'es-ES';

const FX_RATES: Record<string, number> = {
  EUR: 1,
  USD: 1.08,
  GBP: 0.86,
  MXN: 19.8
};

export type CurrencyCode = keyof typeof FX_RATES;

export const SUPPORTED_CURRENCIES = Object.keys(FX_RATES) as CurrencyCode[];

export const formatFiat = (
  amountTokens: number,
  currency: CurrencyCode = 'EUR',
  locale: string = DEFAULT_LOCALE
) => {
  const baseEur = amountTokens / 100;
  const rate = FX_RATES[currency] ?? 1;
  const converted = baseEur * rate;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(converted);
};

export const formatFiatFromEur = (
  amountEur: number,
  currency: CurrencyCode = 'EUR',
  locale: string = DEFAULT_LOCALE
) => {
  const rate = FX_RATES[currency] ?? 1;
  const converted = amountEur * rate;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(converted);
};

export const calculateEffectiveRate = (amountTokens: number, priceEur: number) => {
  if (!amountTokens || !priceEur) return 0;
  return priceEur / (amountTokens / 100);
};

export const euroEquivalent = (amount: number) => {
  return `≈ ${formatFiat(amount, 'EUR', 'es-ES')}`;
};

export const resolveCurrencyFromLocale = (locale: string | undefined) => {
  if (!locale) return 'EUR';
  if (locale.startsWith('en-US')) return 'USD';
  if (locale.startsWith('en-GB')) return 'GBP';
  if (locale.startsWith('es-MX')) return 'MXN';
  return 'EUR';
};

const DEFAULT_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.tuweb.com';

export const getSiteUrl = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return DEFAULT_SITE_URL;
};

export const buildReferralLink = (username: string) => {
  const baseUrl = new URL(getSiteUrl());
  baseUrl.searchParams.set('ref', username);
  baseUrl.searchParams.set('utm_source', 'referral');
  baseUrl.searchParams.set('utm_medium', 'share');
  baseUrl.searchParams.set('utm_campaign', 'creator_program');
  return baseUrl.toString();
};

export const formatNumberCompact = (value: number, locale: string = 'es-ES') => {
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
};

export const formatRelativeTime = (value: string | number | Date, locale: string = 'es-ES') => {
  const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
  const diffMs = date.getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const divisions: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, 'seconds'],
    [60, 'minutes'],
    [24, 'hours'],
    [7, 'days'],
    [4.34524, 'weeks'],
    [12, 'months'],
    [Number.POSITIVE_INFINITY, 'years']
  ];
  let duration = diffMs / 1000;
  for (const [amount, unit] of divisions) {
    if (Math.abs(duration) < amount) {
      return rtf.format(Math.round(duration), unit);
    }
    duration /= amount;
  }
  return rtf.format(Math.round(duration), 'years');
};

export interface ShareConfig {
  url?: string;
  title: string;
  description?: string;
  hashtags?: string[];
}

export interface ShareLinks {
  x: string;
  telegram: string;
  reddit: string;
}

export const createShareLinks = ({ url, title, description, hashtags = [] }: ShareConfig): ShareLinks => {
  const rawUrl = url ?? getSiteUrl();
  const shareUrl = new URL(rawUrl, getSiteUrl());
  if (!shareUrl.searchParams.has('utm_source')) {
    shareUrl.searchParams.set('utm_source', 'share');
  }
  if (!shareUrl.searchParams.has('utm_medium')) {
    shareUrl.searchParams.set('utm_medium', 'social');
  }
  if (!shareUrl.searchParams.has('utm_campaign')) {
    shareUrl.searchParams.set('utm_campaign', 'growth');
  }
  const targetUrl = encodeURIComponent(shareUrl.toString());
  const shareText = encodeURIComponent(description ? `${title}\n${description}` : title);
  const hashtagParam = hashtags.length ? `&hashtags=${encodeURIComponent(hashtags.join(','))}` : '';
  return {
    x: `https://twitter.com/intent/tweet?text=${shareText}&url=${targetUrl}${hashtagParam}`,
    telegram: `https://t.me/share/url?url=${targetUrl}&text=${shareText}`,
    reddit: `https://www.reddit.com/submit?url=${targetUrl}&title=${encodeURIComponent(title)}`
  };
};

export const copyToClipboard = async (value: string) => {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return true;
  }
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    return true;
  } finally {
    document.body.removeChild(textarea);
  }
};

export interface UserBadgeDefinition {
  id: string;
  label: string;
  description: string;
}

export const BADGE_CATALOG: UserBadgeDefinition[] = [
  { id: 'newbie', label: 'Nuevo', description: 'Publicó su primer post.' },
  { id: 'active', label: 'Activo', description: 'Al menos 10 publicaciones.' },
  { id: 'top-contributor', label: 'Top Contributor', description: 'Superó 100 likes recibidos.' },
  { id: 'inviter', label: 'Invitador', description: 'Refirió a 3 amigos que compraron créditos (TKN).' }
];

interface BadgeStatsInput {
  posts: number;
  likes: number;
  gifts: number;
  referrals: number;
}

export const resolveBadgesFromStats = (stats: BadgeStatsInput) => {
  const badges: string[] = [];
  if (stats.posts >= 1) badges.push('newbie');
  if (stats.posts >= 10) badges.push('active');
  if (stats.likes >= 100) badges.push('top-contributor');
  if (stats.referrals >= 3) badges.push('inviter');
  return badges;
};

export type SpendFailureReason =
  | 'PURCHASES_SUSPENDED'
  | 'INSUFFICIENT_FUNDS'
  | 'DAILY_LIMIT'
  | 'MONTHLY_LIMIT'
  | 'SERVICE_ERROR';

interface SpendFailureContext {
  dailyRemaining?: number;
  monthlyRemaining?: number;
}

export const getSpendFailureCopy = (
  reason: SpendFailureReason,
  context: SpendFailureContext = {}
) => {
  switch (reason) {
    case 'PURCHASES_SUSPENDED':
      return {
        title: 'Compras suspendidas',
        description: 'Contacta con soporte para reactivar las compras de créditos.'
      };
    case 'INSUFFICIENT_FUNDS':
      return {
        title: 'Saldo insuficiente',
        description: 'Te faltan créditos (TKN). Compra un pack en 10 segundos.'
      };
    case 'DAILY_LIMIT': {
      const remaining = context.dailyRemaining ?? 0;
      return {
        title: 'Límite diario alcanzado',
        description:
          remaining > 0
            ? `Ajusta tu límite diario o espera al siguiente día. Te quedan ${formatTokens(remaining)} disponibles.`
            : 'Ajusta tu límite diario o espera al siguiente día para seguir gastando.'
      };
    }
    case 'MONTHLY_LIMIT': {
      const remaining = context.monthlyRemaining ?? 0;
      return {
        title: 'Límite mensual alcanzado',
        description:
          remaining > 0
            ? `Ajusta tu límite mensual o espera al mes siguiente. Te quedan ${formatTokens(remaining)} disponibles.`
            : 'Ajusta tu límite mensual o espera al mes siguiente para continuar.'
      };
    }
    case 'SERVICE_ERROR':
      return {
        title: 'No se pudo completar la operación',
        description: 'Intenta de nuevo en unos segundos o contacta con soporte si el problema persiste.'
      };
    default:
      return {
        title: 'Operación no disponible',
        description: 'No ha sido posible completar el gasto. Inténtalo de nuevo en unos minutos.'
      };
  }
};
