import {
  GIFT_CATALOGUE,
  MATCH_PREFERENCES,
  TOKEN_PACKS,
  MASSIVE_ROOM_TOPIC_CHIPS,
  createCorrelationId,
  type RoomSummary,
  type RoomMessage,
  type RoomTab
} from '@/lib/utils';
import { AuthSession } from '@/lib/types';

export enum MediaVisibility {
  FREE = 'FREE',
  PPV = 'PPV',
  PASS_ONLY = 'PASS_ONLY'
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.tuweb.com';

const MOCKS_ENABLED = process.env.NEXT_PUBLIC_ENABLE_MOCKS === 'true';

export const createRequestHeaders = (requestId: string = createCorrelationId()) => ({
  'X-Request-ID': requestId
});

class ApiError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, options: { code?: string; status?: number } = {}) {
    super(message);
    this.code = options.code;
    this.status = options.status;
  }
}

async function parseErrorResponse(response: Response) {
  try {
    const payload = await response.json();
    if (payload?.error) {
      return {
        message: payload.error.message ?? response.statusText,
        code: payload.error.code as string | undefined
      };
    }
    return { message: payload?.message ?? response.statusText };
  } catch (error) {
    return { message: response.statusText };
  }
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    ...createRequestHeaders(),
    ...(init.headers ?? {})
  };
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include'
  });
  if (!response.ok) {
    const { message, code } = await parseErrorResponse(response);
    throw new ApiError(message || 'Error inesperado en la API', { code, status: response.status });
  }
  if (response.status === 204) {
    return undefined as T;
  }
  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new ApiError('No se pudo interpretar la respuesta del servidor');
  }
}

async function withFallback<T>(factory: () => Promise<T>, fallback: () => T): Promise<T> {
  try {
    return await factory();
  } catch (error) {
    if (!MOCKS_ENABLED) {
      throw error;
    }
    console.warn('[api] falling back to mock response for', factory.name || 'request', error);
    return fallback();
  }
}

function extractListFromResponse<T>(payload: unknown, candidates: string[]): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }
  if (payload && typeof payload === 'object') {
    for (const key of candidates) {
      const value = (payload as Record<string, unknown>)[key];
      if (Array.isArray(value)) {
        return value as T[];
      }
    }
  }
  return [];
}

export const queryKeys = {
  featuredProfiles: ['featured-profiles'] as const,
  profile: (username: string) => ['profile', username] as const,
  forumCategories: ['forum-categories'] as const,
  forumThread: (threadId: string) => ['forum-thread', threadId] as const,
  groups: ['groups'] as const,
  roomsLobby: (tab: RoomTab, topic?: string) =>
    ['rooms', 'lobby', tab, topic ?? 'all'] as const,
  roomHistory: (roomId: string) => ['rooms', 'history', roomId] as const,
  wallet: ['wallet'] as const,
  walletHistory: ['wallet-history'] as const,
  adminDashboard: ['admin', 'dashboard'] as const,
  adminUsers: ['admin', 'users'] as const,
  adminReports: ['admin', 'reports'] as const,
  adminContent: ['admin', 'content'] as const,
  adminEconomy: ['admin', 'economy'] as const,
  adminPayouts: ['admin', 'payouts'] as const,
  adminForum: ['admin', 'forum'] as const
};

type LoginPayload = {
  usernameOrEmail: string;
  password: string;
  totp?: string;
};

type RegisterPayload = {
  username: string;
  email?: string;
  password: string;
  ageConfirmed: boolean;
  countryCode: string;
  languageTags?: string[];
};

type UpgradeGuestPayload = {
  sessionId: string;
  username: string;
  email?: string;
  password: string;
  countryCode: string;
  languageTags?: string[];
};

interface WalletCheckoutResponse {
  checkoutUrl?: string;
  message?: string;
}

interface GiftPayload {
  giftId: string;
  tokens: number;
  concept: string;
  targetUserId?: string;
  roomId?: string;
  postId?: string;
}

interface ApiAuthResponse extends AuthSession {
  accessToken?: string;
  refreshToken?: string;
}

const demoSession: AuthSession = {
  scope: 'user',
  username: 'demo-user',
  sessionId: 'demo-session',
  ageConfirmed: true,
  countryCode: 'ES',
  languageTags: ['es']
};

export async function login(payload: LoginPayload): Promise<ApiAuthResponse> {
  return withFallback(
    () =>
      apiRequest<ApiAuthResponse>('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }),
    () => ({ ...demoSession, username: payload.usernameOrEmail || demoSession.username })
  );
}

export async function registerAccount(payload: RegisterPayload): Promise<ApiAuthResponse> {
  return withFallback(
    () =>
      apiRequest<ApiAuthResponse>('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }),
    () => ({
      ...demoSession,
      username: payload.username,
      ageConfirmed: payload.ageConfirmed,
      countryCode: payload.countryCode,
      languageTags: payload.languageTags
    })
  );
}

export async function upgradeGuest(payload: UpgradeGuestPayload): Promise<ApiAuthResponse> {
  return withFallback(
    () =>
      apiRequest<ApiAuthResponse>('/guest/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }),
    () => ({
      ...demoSession,
      username: payload.username,
      sessionId: payload.sessionId || demoSession.sessionId,
      countryCode: payload.countryCode,
      languageTags: payload.languageTags
    })
  );
}

export async function createWalletCheckout(packId: string): Promise<WalletCheckoutResponse> {
  return withFallback(
    () =>
      apiRequest<WalletCheckoutResponse>('/wallet/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId })
      }),
    () => ({
      checkoutUrl: '#checkout-demo',
      message: 'Checkout simulado en entorno de desarrollo.'
    })
  );
}

export async function sendGift(payload: GiftPayload): Promise<void> {
  await withFallback(
    () =>
      apiRequest<void>('/gifts/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }),
    () => undefined
  );
}

export async function unlockMedia(mediaId: string): Promise<void> {
  await withFallback(
    () =>
      apiRequest<void>(`/media/${encodeURIComponent(mediaId)}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }),
    () => undefined
  );
}

export async function buyProfilePass(sellerUsername: string, priceTokens: number): Promise<void> {
  await withFallback(
    () =>
      apiRequest<void>(`/passes/${encodeURIComponent(sellerUsername)}/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price_tokens: priceTokens })
      }),
    () => undefined
  );
}

export interface DiscoverProfileCard {
  username: string;
  displayName: string;
  avatarUrl: string;
  tags: string[];
  passPrice: number;
  isOnline: boolean;
  giftsToday?: number;
  ppvUnlocks?: number;
  referralCount?: number;
}

export interface ForumThreadSummary {
  id: string;
  title: string;
  author: string;
  replies: number;
  createdAt: string;
  categoryId: string;
}

export interface ForumThreadDetail extends ForumThreadSummary {
  body: string;
  posts: {
    id: string;
    author: string;
    body: string;
    createdAt: string;
    mediaThumb?: string;
  }[];
}

export interface ForumCategorySummary {
  id: string;
  name: string;
  description?: string;
  threads: number;
  posts?: number;
  prompt?: string;
}

export interface GroupRoomSummary {
  id: string;
  title: string;
  participants: number;
  vipPrice?: number;
  preview: { username: string; avatar: string; isMuted?: boolean }[];
  nowPlaying?: string;
}

export interface WalletSummary {
  balance: number;
  pending: number;
  available: number;
  dailyLimit: number;
  monthlyLimit: number;
  spentToday: number;
  spentMonth: number;
  purchasesSuspended: boolean;
  preferredCurrency: string;
}

export interface SearchDirectoryResult {
  users: { username: string; bio: string; avatar: string; isFollowed: boolean }[];
  tags: { tag: string; matches: number }[];
  threads: { id: string; title: string; replies: number }[];
}

export type WalletTransactionItem = {
  id: string;
  concept: string;
  delta: number;
  createdAt: string;
};

export interface AdminDashboardMetrics {
  dau: number;
  tokensPurchased: number;
  tokensSpent: number;
  gmvTokens: number;
  gsvTokens: number;
  platformFee: number;
  packConversion: number;
  topSources: { source: string; percent: number }[];
  chargebackRate: number;
  highRiskPurchasers: number;
  spendLimitBreaches: number;
  guestToUserConversion: number;
  userToBuyerConversion: number;
  forumActiveUsers: number;
  tokenSpendBreakdown: { gifts: number; ppv: number; passes: number };
  topSharedPosts: { id: string; title: string; externalClicks: number }[];
  topReferrers: { username: string; referrals: number; tokensEarned: number }[];
  chargebackAlerts: AdminChargebackAlert[];
  charts: {
    period: '24h' | '7d' | '30d';
    points: { timestamp: string; purchases: number; spends: number }[];
  }[];
}

export interface AdminChargebackAlert {
  id: string;
  username: string;
  amountTokens: number;
  incidents: number;
  lastIncidentAt: string;
  riskLevel: 'medium' | 'high';
}

export interface AdminUserRow {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  balance: number;
  pending: number;
  available: number;
  flags: { ban: boolean; shadowban: boolean; purchasesSuspended: boolean };
  reports: number;
  chargebackRate: number;
}

export interface AdminReportItem {
  id: string;
  status: 'OPEN' | 'REVIEW' | 'CLOSED';
  targetType: 'user' | 'post' | 'media';
  targetId: string;
  reason: string;
  createdAt: string;
  count: number;
  preview?: { thumbnail?: string; blurred?: boolean; metadata?: string };
}

export interface AdminContentItem {
  id: string;
  owner: string;
  visibility: MediaVisibility;
  title?: string;
  sizeMb: number;
  createdAt: string;
  priceTokens?: number;
  tags: string[];
  status: 'active' | 'removed' | 'sensitive';
}

export interface AdminEconomyConfig {
  packs: { id: string; name: string; amount: number; price: number }[];
  gifts: { id: string; name: string; tokens: number; animKey: string; isActive: boolean }[];
  ranges: {
    ppv: { min: number; max: number };
    pass: { min: number; max: number };
    payPerMinute: { min: number; max: number };
    vipTicket: { min: number; max: number };
  };
  promotions: { id: string; description: string }[];
  minimumPayPerMinute: number;
}

export interface AdminPayoutRequest {
  id: string;
  user: string;
  amountTokens: number;
  euroEquivalent: number;
  method: string;
  status: 'requested' | 'paid' | 'rejected';
  requestedAt: string;
  processedAt?: string;
  reference?: string;
  reason?: string;
}

export interface AdminForumCategory {
  id: string;
  name: string;
  threads: number;
  moderators: string[];
  isPinned: boolean;
}

const featuredProfiles: DiscoverProfileCard[] = [
  {
    username: 'luna',
    displayName: 'Luna',
    avatarUrl: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=200&q=80',
    tags: ['cosplay', 'soft'],
    passPrice: 1499,
    isOnline: true,
    giftsToday: 24,
    ppvUnlocks: 18,
    referralCount: 4
  },
  {
    username: 'zen',
    displayName: 'Zenith',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
    tags: ['nsfw', 'fitness'],
    passPrice: 1999,
    isOnline: false,
    giftsToday: 15,
    ppvUnlocks: 22,
    referralCount: 3
  },
  {
    username: 'noir',
    displayName: 'Noir',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    tags: ['art', 'sfw'],
    passPrice: 999,
    isOnline: true,
    giftsToday: 19,
    ppvUnlocks: 9,
    referralCount: 6
  }
];

const forumCategories = [
  {
    id: 'general',
    name: 'General',
    description: 'Presentaciones, noticias y avisos.',
    threads: 124,
    posts: 874,
    prompt: 'Preséntate con foto 🔥 y cuéntanos qué buscas en la comunidad.'
  },
  {
    id: 'creators',
    name: 'Creadores',
    description: 'Consejos sobre monetización y contenido premium.',
    threads: 98,
    posts: 654,
    prompt: 'Comparte tu experiencia más hot o truco para fidelizar fans.'
  },
  {
    id: 'support',
    name: 'Soporte',
    description: 'Dudas técnicas, reportes y feedback.',
    threads: 45,
    posts: 210,
    prompt: '¿Tuviste algún problema con un match o compra? Cuéntanos.'
  },
  {
    id: 'busquedas',
    name: '¿Qué buscas aquí?',
    description: 'Encuentra personas con gustos similares usando consent chips.',
    threads: 76,
    posts: 312,
    prompt: 'Escribe qué tipo de conexión buscas (SFW, soft, juguetes, roles…).'
  }
];

const forumThreads: ForumThreadDetail[] = [
  {
    id: 'thr-1',
    title: 'Tips para vender PPV',
    author: 'luna',
    replies: 12,
    createdAt: new Date().toISOString(),
    categoryId: 'creators',
    body: 'Comparte tus mejores prácticas para maximizar ingresos con PPV.',
    posts: [
      {
        id: 'post-1',
        author: 'zen',
        body: 'Yo agrupo fotos en bundles y uso descuentos temporales.',
        createdAt: new Date().toISOString(),
        mediaThumb: 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&fit=crop&w=300&q=80'
      },
      {
        id: 'post-2',
        author: 'luna',
        body: 'Gracias por el tip, voy a probarlo esta semana.',
        createdAt: new Date().toISOString()
      }
    ]
  },
  {
    id: 'thr-2',
    title: 'Configura tu primera sala VIP',
    author: 'noir',
    replies: 5,
    createdAt: new Date().toISOString(),
    categoryId: 'general',
    body: 'Qué precio recomiendan para salas VIP de 6 plazas?',
    posts: []
  }
];

const groupRooms: GroupRoomSummary[] = [
  {
    id: 'grp-1',
    title: 'After hours',
    participants: 3,
    vipPrice: 300,
    preview: [
      { username: 'luna', avatar: 'https://placehold.co/48x48/121820/E5E7EB?text=L' },
      { username: 'zen', avatar: 'https://placehold.co/48x48/0B0F14/E5E7EB?text=Z', isMuted: true },
      { username: 'noir', avatar: 'https://placehold.co/48x48/1B2330/E5E7EB?text=N' }
    ],
    nowPlaying: 'Charla abierta · Consentimientos soft/nsfw'
  },
  {
    id: 'grp-2',
    title: 'Charla soft',
    participants: 2,
    preview: [
      { username: 'aria', avatar: 'https://placehold.co/48x48/121820/E5E7EB?text=A' },
      { username: 'sol', avatar: 'https://placehold.co/48x48/0B0F14/E5E7EB?text=S', isMuted: true }
    ],
    nowPlaying: 'Presentaciones y gustos SFW'
  },
  {
    id: 'grp-3',
    title: 'Club VIP',
    participants: 6,
    vipPrice: 750,
    preview: [
      { username: 'dune', avatar: 'https://placehold.co/48x48/1B2330/E5E7EB?text=D' },
      { username: 'nova', avatar: 'https://placehold.co/48x48/121820/E5E7EB?text=N' },
      { username: 'irys', avatar: 'https://placehold.co/48x48/0B0F14/E5E7EB?text=I' },
      { username: 'kaia', avatar: 'https://placehold.co/48x48/1B2330/E5E7EB?text=K' },
      { username: 'milo', avatar: 'https://placehold.co/48x48/121820/E5E7EB?text=M', isMuted: true },
      { username: 'vega', avatar: 'https://placehold.co/48x48/0B0F14/E5E7EB?text=V' }
    ],
    nowPlaying: 'Q&A con creadores premium'
  }
];

const massiveRooms: Record<RoomTab, RoomSummary[]> = {
  trending: [
    {
      id: 'rm-1',
      title: 'Lobby 🔥 Español',
      type: 'random',
      tags: ['es', '🔥', 'nuevos'],
      participants: 3120,
      messagesPerMinute: 240,
      isNsfw: true,
      slowModeSeconds: 3,
      topSupporters: [
        { username: 'luna', amountTokens: 7400 },
        { username: 'zen', amountTokens: 5100 },
        { username: 'noir', amountTokens: 3200 }
      ]
    },
    {
      id: 'rm-2',
      title: 'OnlyFams Creators',
      type: 'topic',
      tags: ['creadores', 'tips', 'ppv'],
      participants: 1680,
      messagesPerMinute: 95,
      isNsfw: false,
      slowModeSeconds: 5
    },
    {
      id: 'rm-3',
      title: 'After party internacional',
      type: 'random',
      tags: ['global', 'english', 'es'],
      participants: 2840,
      messagesPerMinute: 180,
      isNsfw: true
    }
  ],
  random: [
    {
      id: 'rm-4',
      title: 'Deck suave',
      type: 'random',
      tags: ['sfw', 'soft'],
      participants: 980,
      messagesPerMinute: 75,
      isNsfw: false
    },
    {
      id: 'rm-5',
      title: 'NSFW consentido',
      type: 'random',
      tags: ['nsfw', '18+'],
      participants: 2200,
      messagesPerMinute: 130,
      isNsfw: true,
      slowModeSeconds: 4
    }
  ],
  topics: MASSIVE_ROOM_TOPIC_CHIPS.map((chip, index) => ({
    id: `topic-${chip.id}`,
    title: chip.label,
    type: 'topic',
    tags: [chip.id],
    participants: 480 + index * 120,
    messagesPerMinute: 40 + index * 10,
    isNsfw: Boolean((chip as { nsfw?: boolean }).nsfw)
  }))
};

const massiveRoomMessages: Record<string, RoomMessage[]> = {
  'rm-1': Array.from({ length: 16 }).map((_, idx) => ({
    id: `msg-rm1-${idx}`,
    roomId: 'rm-1',
    author: {
      id: idx % 3 === 0 ? 'mod-zen' : `user-${idx}`,
      username: idx % 3 === 0 ? 'zen' : `fan${idx}`,
      displayName: idx % 3 === 0 ? 'Zen (mod)' : `Fan ${idx}`,
      avatarUrl: 'https://placehold.co/48x48/121820/E5E7EB?text=Z',
      role: idx % 3 === 0 ? 'mod' : 'member'
    },
    text:
      idx % 5 === 0
        ? '¿Quién se apunta a bundle PPV? Estoy regalando Supernova a quien desbloquee mis posts 🔥'
        : 'Buenas noches crew, ¿ya hicieron match hoy?',
    createdAt: new Date(Date.now() - idx * 25_000).toISOString(),
    reactions: {
      '❤️': Math.floor(Math.random() * 12),
      '🔥': Math.floor(Math.random() * 4)
    },
    mentions: idx % 4 === 0 ? ['luna'] : undefined
  })),
  'rm-2': [
    {
      id: 'msg-rm2-1',
      roomId: 'rm-2',
      author: {
        id: 'owner-luna',
        username: 'luna',
        displayName: 'Luna',
        avatarUrl: 'https://placehold.co/48x48/0B0F14/E5E7EB?text=L',
        role: 'owner'
      },
      text: 'Recordad fijar reglas claras para PPV: precio, bundle y preview blur 🔒',
      createdAt: new Date().toISOString(),
      reactions: { '👍': 18 },
      poll: {
        id: 'poll-prices',
        question: '¿Qué precio por defecto usas en PPV?',
        options: [
          { id: 'opt-1', label: '499 Créditos', votes: 34 },
          { id: 'opt-2', label: '999 Créditos', votes: 56, voted: true },
          { id: 'opt-3', label: '1499 Créditos', votes: 22 }
        ]
      }
    }
  ]
};

const walletSummary: WalletSummary = {
  balance: 1200,
  pending: 4200,
  available: 2800,
  dailyLimit: 5000,
  monthlyLimit: 20_000,
  spentToday: 620,
  spentMonth: 4800,
  purchasesSuspended: false,
  preferredCurrency: 'EUR'
};

const walletHistory: WalletTransactionItem[] = [
  { id: 'tx-1', concept: 'Compra Pack M', delta: 1200, createdAt: new Date().toISOString() },
  { id: 'tx-2', concept: 'Gift Rose a @luna', delta: -100, createdAt: new Date(Date.now() - 3600_000).toISOString() },
  { id: 'tx-3', concept: 'PPV de @zen', delta: -499, createdAt: new Date(Date.now() - 86_400_000).toISOString() }
];

const adminDashboard: AdminDashboardMetrics = {
  dau: 1840,
  tokensPurchased: 320_000,
  tokensSpent: 287_500,
  gmvTokens: 320_000,
  gsvTokens: 287_500,
  platformFee: 65_200,
  packConversion: 0.18,
  topSources: [
    { source: 'match', percent: 0.42 },
    { source: 'foro', percent: 0.27 },
    { source: 'perfiles', percent: 0.2 },
    { source: 'referidos', percent: 0.11 }
  ],
  chargebackRate: 0.012,
  highRiskPurchasers: 7,
  spendLimitBreaches: 5,
  guestToUserConversion: 0.34,
  userToBuyerConversion: 0.27,
  forumActiveUsers: 920,
  tokenSpendBreakdown: { gifts: 0.46, ppv: 0.38, passes: 0.16 },
  topSharedPosts: [
    { id: 'thread-pres', title: 'Preséntate con foto 🔥', externalClicks: 480 },
    { id: 'post-nsfw', title: 'Top perfiles de hoy', externalClicks: 365 },
    { id: 'thread-exper', title: 'Comparte tu experiencia más hot', externalClicks: 290 }
  ],
  topReferrers: [
    { username: 'luna', referrals: 18, tokensEarned: 9000 },
    { username: 'zenith', referrals: 11, tokensEarned: 5500 },
    { username: 'nova', referrals: 9, tokensEarned: 4500 }
  ],
  chargebackAlerts: [
    {
      id: 'cb-1',
      username: 'aurum',
      amountTokens: 9500,
      incidents: 2,
      lastIncidentAt: new Date(Date.now() - 3 * 24 * 60 * 60_000).toISOString(),
      riskLevel: 'high'
    },
    {
      id: 'cb-2',
      username: 'selene',
      amountTokens: 4200,
      incidents: 1,
      lastIncidentAt: new Date(Date.now() - 6 * 24 * 60 * 60_000).toISOString(),
      riskLevel: 'medium'
    }
  ],
  charts: ['24h', '7d', '30d'].map((period) => ({
    period: period as '24h' | '7d' | '30d',
    points: Array.from({ length: period === '24h' ? 12 : period === '7d' ? 7 : 6 }).map((_, idx) => ({
      timestamp: new Date(Date.now() - idx * (period === '24h' ? 2 * 60 * 60_000 : 24 * 60 * 60_000)).toISOString(),
      purchases: Math.floor(Math.random() * 30_000) + 10_000,
      spends: Math.floor(Math.random() * 25_000) + 8000
    }))
  }))
};

const adminUsers: AdminUserRow[] = [
  {
    id: 'usr-1',
    username: 'luna',
    email: 'luna@example.com',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60_000).toISOString(),
    balance: 2200,
    pending: 12_400,
    available: 6800,
    flags: { ban: false, shadowban: false, purchasesSuspended: false },
    reports: 1,
    chargebackRate: 0.01
  },
  {
    id: 'usr-2',
    username: 'zen',
    email: 'zen@example.com',
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60_000).toISOString(),
    balance: 540,
    pending: 7200,
    available: 3100,
    flags: { ban: false, shadowban: true, purchasesSuspended: true },
    reports: 5,
    chargebackRate: 0.06
  },
  {
    id: 'usr-3',
    username: 'noir',
    email: 'noir@example.com',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60_000).toISOString(),
    balance: 1400,
    pending: 1200,
    available: 900,
    flags: { ban: false, shadowban: false, purchasesSuspended: false },
    reports: 0,
    chargebackRate: 0
  }
];

const searchDirectoryMock: SearchDirectoryResult = {
  users: [
    {
      username: 'luna',
      bio: 'Performer indie · bundles PPV cada semana',
      avatar: 'https://placehold.co/64x64/121820/E5E7EB?text=L',
      isFollowed: true
    },
    {
      username: 'zen',
      bio: 'Entrenador y creador NSFW · focus en juguetes',
      avatar: 'https://placehold.co/64x64/0B0F14/E5E7EB?text=Z',
      isFollowed: false
    },
    {
      username: 'sol',
      bio: 'Charlas soft y tips de autocuidado',
      avatar: 'https://placehold.co/64x64/1B2330/E5E7EB?text=S',
      isFollowed: false
    }
  ],
  tags: [
    { tag: 'soft', matches: 128 },
    { tag: 'vip', matches: 72 },
    { tag: 'bundles', matches: 44 }
  ],
  threads: [
    { id: 'thr-1', title: 'Tips para vender PPV', replies: 12 },
    { id: 'thr-3', title: 'Consentimientos y límites saludables', replies: 34 }
  ]
};

const adminReports: AdminReportItem[] = [
  {
    id: 'rep-1',
    status: 'OPEN',
    targetType: 'media',
    targetId: 'media-3',
    reason: 'Contenido no consensuado',
    createdAt: new Date().toISOString(),
    count: 3,
    preview: {
      thumbnail: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
      blurred: true,
      metadata: 'Video 45s · PPV 999 TKN'
    }
  },
  {
    id: 'rep-2',
    status: 'REVIEW',
    targetType: 'user',
    targetId: 'usr-5',
    reason: 'Spam repetido',
    createdAt: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
    count: 7,
    preview: { metadata: 'Usuario @heatwave · 7 reportes en 24h' }
  },
  {
    id: 'rep-3',
    status: 'CLOSED',
    targetType: 'post',
    targetId: 'post-2',
    reason: 'Lenguaje de odio',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60_000).toISOString(),
    count: 2,
    preview: { metadata: 'Post texto · eliminado' }
  }
];

const adminContent: AdminContentItem[] = [
  {
    id: 'media-1',
    owner: 'luna',
    visibility: MediaVisibility.FREE,
    title: 'Galería cosplay',
    sizeMb: 12,
    createdAt: new Date(Date.now() - 6 * 60 * 60_000).toISOString(),
    tags: ['cosplay', 'sfw'],
    status: 'active'
  },
  {
    id: 'media-2',
    owner: 'zen',
    visibility: MediaVisibility.PPV,
    title: 'Entrenamiento privado',
    sizeMb: 180,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60_000).toISOString(),
    priceTokens: 999,
    tags: ['fitness'],
    status: 'sensitive'
  },
  {
    id: 'media-3',
    owner: 'heatwave',
    visibility: MediaVisibility.PASS_ONLY,
    title: 'After dark',
    sizeMb: 210,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60_000).toISOString(),
    priceTokens: 1499,
    tags: ['vip', 'night'],
    status: 'removed'
  }
];

const adminEconomy: AdminEconomyConfig = {
  packs: TOKEN_PACKS.map((pack) => ({ id: pack.id, name: pack.name, amount: pack.amount, price: pack.price })),
  gifts: GIFT_CATALOGUE.map((gift) => ({
    id: gift.id,
    name: gift.name,
    tokens: gift.cost,
    animKey: `${gift.id}-anim`,
    isActive: true
  })),
  ranges: {
    ppv: { min: 199, max: 1999 },
    pass: { min: 499, max: 2999 },
    payPerMinute: { min: 50, max: 500 },
    vipTicket: { min: 100, max: 1000 }
  },
  promotions: [
    { id: 'welcome-gift', description: 'Heart gratuito al completar el registro.' },
    { id: 'renew-pass', description: 'Renovación de pase con -10% si faltan <48h.' }
  ],
  minimumPayPerMinute: 75
};

const adminPayouts: AdminPayoutRequest[] = [
  {
    id: 'pay-1',
    user: 'luna',
    amountTokens: 6500,
    euroEquivalent: 65,
    method: 'Paxum',
    status: 'requested',
    requestedAt: new Date().toISOString()
  },
  {
    id: 'pay-2',
    user: 'zen',
    amountTokens: 12000,
    euroEquivalent: 120,
    method: 'SEPA',
    status: 'paid',
    requestedAt: new Date(Date.now() - 4 * 24 * 60 * 60_000).toISOString(),
    processedAt: new Date(Date.now() - 2 * 24 * 60 * 60_000).toISOString(),
    reference: 'SEPA-89342'
  },
  {
    id: 'pay-3',
    user: 'noir',
    amountTokens: 5200,
    euroEquivalent: 52,
    method: 'Paxum',
    status: 'rejected',
    requestedAt: new Date(Date.now() - 7 * 24 * 60 * 60_000).toISOString(),
    processedAt: new Date(Date.now() - 6 * 24 * 60 * 60_000).toISOString(),
    reference: 'REJ-558',
    reason: 'Datos de pago incompletos'
  }
];

const adminForumCategories: AdminForumCategory[] = [
  { id: 'general', name: 'General', threads: 124, moderators: ['luna'], isPinned: true },
  { id: 'creators', name: 'Creadores', threads: 98, moderators: ['zen', 'noir'], isPinned: false },
  { id: 'support', name: 'Soporte', threads: 45, moderators: ['staff'], isPinned: false }
];

export async function fetchFeaturedProfiles(): Promise<DiscoverProfileCard[]> {
  return withFallback(
    async () => {
      const response = await apiRequest<
        { profiles?: DiscoverProfileCard[]; items?: DiscoverProfileCard[]; data?: DiscoverProfileCard[] } | DiscoverProfileCard[]
      >('/discover/top?limit=12');
      return extractListFromResponse<DiscoverProfileCard>(response, ['profiles', 'items', 'data']);
    },
    () => featuredProfiles
  );
}

export async function fetchForumCategories() {
  return withFallback(
    async () => apiRequest<ForumCategorySummary[]>('/forum/categories'),
    () => forumCategories
  );
}

export async function fetchForumThread(threadId: string): Promise<ForumThreadDetail | undefined> {
  return withFallback(
    async () => apiRequest<ForumThreadDetail>(`/forum/threads/${threadId}`),
    () => forumThreads.find((thr) => thr.id === threadId)
  );
}

export async function fetchForumThreads(): Promise<ForumThreadSummary[]> {
  return withFallback(
    async () => {
      const response = await apiRequest<
        | ForumThreadSummary[]
        | { threads?: ForumThreadSummary[]; items?: ForumThreadSummary[]; data?: ForumThreadSummary[] }
      >('/forum/threads?limit=40');
      return extractListFromResponse<ForumThreadSummary>(response, ['threads', 'items', 'data']);
    },
    () =>
      forumThreads.map(({ id, title, author, replies, createdAt, categoryId }) => ({
        id,
        title,
        author,
        replies,
        createdAt,
        categoryId
      }))
  );
}

export async function fetchGroups(): Promise<GroupRoomSummary[]> {
  return withFallback(
    async () => {
      const response = await apiRequest<
        GroupRoomSummary[] | { rooms?: GroupRoomSummary[]; items?: GroupRoomSummary[] }
      >('/rooms/group');
      return extractListFromResponse<GroupRoomSummary>(response, ['rooms', 'items']);
    },
    () => groupRooms
  );
}

export async function fetchMassiveRooms(tab: RoomTab, topic?: string): Promise<{ rooms: RoomSummary[]; nextCursor?: string }> {
  return withFallback(
    async () => {
      const params = new URLSearchParams({ tab });
      if (topic && topic !== 'all') {
        params.set('topic', topic);
      }
      const response = await apiRequest<
        { rooms?: RoomSummary[]; nextCursor?: string; items?: RoomSummary[] }
      >(`/rooms?${params.toString()}`);
      const rooms = extractListFromResponse<RoomSummary>(response, ['rooms', 'items']);
      const nextCursor = typeof response === 'object' && response !== null ? (response as { nextCursor?: string }).nextCursor : undefined;
      return { rooms, nextCursor };
    },
    () => {
      if (tab === 'topics' && topic && topic !== 'all') {
        return {
          rooms: massiveRooms.topics.filter((room) => room.tags.includes(topic)),
          nextCursor: undefined
        };
      }
      return {
        rooms: massiveRooms[tab],
        nextCursor: undefined
      };
    }
  );
}

export async function fetchMassiveRoomHistory(roomId: string): Promise<RoomMessage[]> {
  return withFallback(
    async () => {
      const response = await apiRequest<
        RoomMessage[] | { messages?: RoomMessage[]; items?: RoomMessage[] }
      >(`/rooms/${roomId}/history?limit=200`);
      return extractListFromResponse<RoomMessage>(response, ['messages', 'items']);
    },
    () => massiveRoomMessages[roomId] ?? []
  );
}

export async function fetchMassiveRoom(roomId: string): Promise<RoomSummary | undefined> {
  return withFallback(
    async () => apiRequest<RoomSummary>(`/rooms/${roomId}`),
    () =>
      Object.values(massiveRooms)
        .flat()
        .find((room) => room.id === roomId)
  );
}

export async function sendMassiveRoomMessage(
  roomId: string,
  payload: { text: string; replyToId?: string }
): Promise<RoomMessage> {
  return withFallback(
    async () =>
      apiRequest<RoomMessage>(`/rooms/${roomId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text: payload.text, replyToId: payload.replyToId })
      }),
    () => {
      const message: RoomMessage = {
        id: `mock-${Date.now()}`,
        roomId,
        author: {
          id: 'self',
          username: 'tú',
          displayName: 'Tú',
          role: 'member'
        },
        text: payload.text,
        replyTo: payload.replyToId,
        createdAt: new Date().toISOString(),
        reactions: {},
        pinned: false,
        status: 'delivered'
      };
      massiveRoomMessages[roomId] = [message, ...(massiveRoomMessages[roomId] ?? [])];
      return message;
    }
  );
}

export async function searchMassiveRoomMessages(roomId: string, term: string): Promise<RoomMessage[]> {
  return withFallback(
    async () =>
      apiRequest<RoomMessage[]>(`/rooms/${roomId}/search?${new URLSearchParams({ q: term }).toString()}`),
    () => {
      const normalized = term.trim().toLowerCase();
      if (!normalized) return [];
      return (massiveRoomMessages[roomId] ?? []).filter((message) =>
        (message.text ?? '').toLowerCase().includes(normalized)
      );
    }
  );
}

export async function pinMassiveRoomMessage(roomId: string, messageId: string, pinned: boolean): Promise<void> {
  return withFallback(
    async () => {
      await apiRequest(`/rooms/${roomId}/messages/${messageId}/pin`, {
        method: 'POST',
        body: JSON.stringify({ pinned })
      });
    },
    () => {
      const messages = massiveRoomMessages[roomId];
      if (!messages) return;
      massiveRoomMessages[roomId] = messages.map((message) =>
        message.id === messageId ? { ...message, pinned } : message
      );
    }
  );
}

export async function fetchWallet(): Promise<WalletSummary> {
  return withFallback(
    async () => apiRequest<WalletSummary>('/wallet'),
    () => walletSummary
  );
}

export async function fetchWalletHistory(): Promise<WalletTransactionItem[]> {
  return withFallback(
    async () => {
      const data = await apiRequest<WalletTransactionItem[] | { items: WalletTransactionItem[]; transactions?: WalletTransactionItem[] }>(
        '/wallet/history'
      );
      if (Array.isArray(data)) return data;
      if ('transactions' in data && Array.isArray(data.transactions)) return data.transactions;
      if ('items' in data && Array.isArray(data.items)) return data.items;
      return [];
    },
    () => walletHistory
  );
}

export async function searchDirectory(
  query: string,
  type?: 'users' | 'tags' | 'threads'
): Promise<SearchDirectoryResult> {
  return withFallback(
    async () => {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (type) params.set('type', type);
      const response = await apiRequest<
        | SearchDirectoryResult
        | { users?: SearchDirectoryResult['users']; tags?: SearchDirectoryResult['tags']; threads?: SearchDirectoryResult['threads'] }
      >(`/users/search?${params.toString()}`);
      const parsed = response as Partial<SearchDirectoryResult>;
      return {
        users: Array.isArray(parsed.users) ? parsed.users : [],
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        threads: Array.isArray(parsed.threads) ? parsed.threads : []
      };
    },
    () => {
      if (!query) {
        return searchDirectoryMock;
      }
      const lower = query.toLowerCase();
      const result: SearchDirectoryResult = {
        users: searchDirectoryMock.users.filter(
          (user) => user.username.toLowerCase().includes(lower) || user.bio.toLowerCase().includes(lower)
        ),
        tags: searchDirectoryMock.tags.filter((tag) => tag.tag.toLowerCase().includes(lower)),
        threads: searchDirectoryMock.threads.filter((thread) => thread.title.toLowerCase().includes(lower))
      };
      if (type) {
        return {
          users: type === 'users' ? result.users : [],
          tags: type === 'tags' ? result.tags : [],
          threads: type === 'threads' ? result.threads : []
        };
      }
      return result;
    }
  );
}

export const staticCatalog = {
  gifts: GIFT_CATALOGUE,
  tokenPacks: TOKEN_PACKS,
  preferences: MATCH_PREFERENCES,
  welcomeGift: { id: 'starter-heart', name: 'Heart de bienvenida', cost: 0, appliesTo: 'user' },
  renewalPromotions: [
    { id: 'pass-renew', label: 'Renueva tu pase con -10% antes de que expire', discount: 0.1 },
    { id: 'bundle-ppv', label: '3 medios PPV por 999 Créditos (TKN)', discount: 0.15 }
  ],
  couponPrograms: [
    {
      id: 'first-purchase',
      name: 'Bono primera recarga',
      description: '5% extra en créditos (TKN) en tu primera compra verificada.'
    },
    {
      id: 'win-back',
      name: 'Recupera tu pase',
      description: 'Renueva tu pase en menos de 48h y recibe -10% aplicado automáticamente.'
    },
    {
      id: 'bundle-opt-in',
      name: 'Bundle PPV corporativo',
      description: 'Desbloquea 3 contenidos PPV seleccionados por 999 Créditos (TKN).'
    }
  ]
};

export async function fetchAdminDashboard(): Promise<AdminDashboardMetrics> {
  return withFallback(
    async () => apiRequest<AdminDashboardMetrics>('/admin/dashboard'),
    () => adminDashboard
  );
}

export async function fetchAdminUsers(): Promise<AdminUserRow[]> {
  return withFallback(
    async () => apiRequest<AdminUserRow[]>('/admin/users'),
    () => adminUsers
  );
}

export async function fetchAdminReports(): Promise<AdminReportItem[]> {
  return withFallback(
    async () => apiRequest<AdminReportItem[]>('/admin/reports'),
    () => adminReports
  );
}

export async function fetchAdminContent(): Promise<AdminContentItem[]> {
  return withFallback(
    async () => apiRequest<AdminContentItem[]>('/admin/content'),
    () => adminContent
  );
}

export async function fetchAdminEconomy(): Promise<AdminEconomyConfig> {
  return withFallback(
    async () => apiRequest<AdminEconomyConfig>('/admin/economy'),
    () => adminEconomy
  );
}

export async function fetchAdminPayouts(): Promise<AdminPayoutRequest[]> {
  return withFallback(
    async () => apiRequest<AdminPayoutRequest[]>('/admin/payouts'),
    () => adminPayouts
  );
}

export async function fetchAdminForum(): Promise<AdminForumCategory[]> {
  return withFallback(
    async () => apiRequest<AdminForumCategory[]>('/admin/forum/categories'),
    () => adminForumCategories
  );
}
