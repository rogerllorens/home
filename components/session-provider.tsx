'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  fetchWallet,
  fetchWalletHistory,
  staticCatalog,
  queryKeys,
  type WalletSummary,
  type WalletTransactionItem
} from '@/lib/api';
import {
  formatTokens,
  resolveCurrencyFromLocale,
  formatFiat,
  getSpendFailureCopy,
  createCorrelationId,
  buildReferralLink,
  resolveBadgesFromStats,
  resolveDefaultCountry,
  resolveLanguagesForCountry,
  type CurrencyCode,
  type SpendFailureReason
} from '@/lib/utils';
import { useAuthStore } from '@/lib/auth';
import { toast } from 'sonner';
import {
  recordNotificationReceived,
  recordSpendFailure,
  recordSpendSuccess,
  recordTelemetryEvent
} from '@/lib/telemetry';
import { SessionScope } from '@/lib/types';

export interface WalletTransaction {
  id: string;
  concept: string;
  delta: number;
  createdAt: string;
}

export type NotificationType =
  | 'gift'
  | 'ppv'
  | 'pass'
  | 'comment'
  | 'mention'
  | 'referral'
  | 'like'
  | 'forum'
  | 'system';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  message: string;
  createdAt: string;
  read: boolean;
  metadata?: Record<string, unknown>;
}

export interface SpendingLimits {
  daily: number;
  monthly: number;
}

interface SpendOptions {
  execute?: () => Promise<unknown>;
  metadata?: Record<string, unknown>;
}

type NotificationPreferenceKey = Exclude<NotificationType, 'system'> | 'system';

export type NotificationPreferences = Record<NotificationPreferenceKey, boolean>;

export interface UserStatsSnapshot {
  posts: number;
  likes: number;
  gifts: number;
  referrals: number;
  badges: string[];
}

interface SessionValue {
  scope: SessionScope;
  alias: string;
  username: string;
  tokenBalance: number;
  pendingEarnings: number;
  availableEarnings: number;
  transactions: WalletTransaction[];
  preferences: string[];
  notifications: NotificationItem[];
  unreadNotifications: number;
  followedUsers: string[];
  followedThreads: string[];
  bookmarkedPosts: string[];
  blockedUsers: string[];
  mutedUsers: string[];
  spendingLimits: SpendingLimits;
  spendingUsage: { today: number; month: number };
  purchasesSuspended: boolean;
  preferredCurrency: CurrencyCode;
  stats: UserStatsSnapshot;
  referralLink: string;
  attributedReferrer: string | null;
  notificationPreferences: NotificationPreferences;
  countryCode: string;
  languageTags: string[];
  credit: (amount: number, concept: string) => void;
  spend: (amount: number, concept: string, options?: SpendOptions) => Promise<boolean>;
  setPreferences: (prefs: string[]) => void;
  formatBalance: () => string;
  setCountryCode: (code: string) => void;
  setLanguageTags: (tags: string[]) => void;
  toggleFollowUser: (username: string) => void;
  isFollowingUser: (username: string) => boolean;
  toggleThreadFollow: (threadId: string) => void;
  isThreadFollowed: (threadId: string) => boolean;
  toggleBookmark: (postId: string) => void;
  isPostBookmarked: (postId: string) => boolean;
  addNotification: (notification: Omit<NotificationItem, 'id' | 'createdAt' | 'read'> & {
    id?: string;
    createdAt?: string;
    read?: boolean;
  }) => void;
  markNotificationsRead: () => void;
  setSpendingLimits: (limits: SpendingLimits) => void;
  setPreferredCurrency: (code: string) => void;
  blockUser: (username: string) => void;
  unblockUser: (username: string) => void;
  isBlocked: (username: string) => boolean;
  muteUser: (username: string) => void;
  unmuteUser: (username: string) => void;
  isMuted: (username: string) => boolean;
  adjustStats: (delta: Partial<Record<'posts' | 'likes' | 'gifts' | 'referrals', number>>) => void;
  recordReferralConversion: () => void;
  claimBonus: (bonusId: string, amountTokens: number, message: string) => boolean;
  setNotificationPreference: (key: NotificationPreferenceKey, value: boolean) => void;
  createRequestId: (scopeLabel?: string) => string;
  clearAttributedReferrer: () => void;
}

const SessionContext = createContext<SessionValue | undefined>(undefined);

const PREFERENCES_KEY = 'tkn:match-preferences';
const FOLLOWED_USERS_KEY = 'tkn:followed-users';
const FOLLOWED_THREADS_KEY = 'tkn:followed-threads';
const BOOKMARKED_POSTS_KEY = 'tkn:bookmarked-posts';
const NOTIFICATIONS_KEY = 'tkn:notifications';
const SPEND_LIMIT_KEY = 'tkn:spend-limits';
const BLOCKED_USERS_KEY = 'tkn:blocked-users';
const MUTED_USERS_KEY = 'tkn:muted-users';
const PREFERRED_CURRENCY_KEY = 'tkn:preferred-currency';
const NOTIFICATION_PREFS_KEY = 'tkn:notification-prefs';
const USER_STATS_KEY = 'tkn:user-stats';
const BONUSES_KEY = 'tkn:bonuses-claimed';
const ATTRIBUTED_REFERRER_KEY = 'tkn:referrer';
const COUNTRY_CODE_KEY = 'tkn:country';
const LANGUAGE_TAGS_KEY = 'tkn:language-tags';

const DEFAULT_LIMITS: SpendingLimits = { daily: 5000, monthly: 20000 };
const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-welcome',
    type: 'system',
    message: 'Bienvenido a TKN · confirma tus preferencias en Match antes de empezar.',
    createdAt: new Date().toISOString(),
    read: false
  },
  {
    id: 'notif-gift',
    type: 'gift',
    message: 'Tienes un Heart de bienvenida listo para usar en tu próximo chat.',
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    read: false
  },
  {
    id: 'notif-referral-demo',
    type: 'referral',
    message: '🔥 500 créditos (TKN) añadidos: tu amigo compró créditos.',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: false
  },
  {
    id: 'notif-comment-demo',
    type: 'comment',
    message: 'Nuevo comentario en tu post “Sesión neón”.',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    read: true
  }
];

const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  gift: true,
  ppv: true,
  pass: true,
  comment: true,
  mention: true,
  referral: true,
  like: true,
  forum: true,
  system: true
};

const DEFAULT_STATS = { posts: 4, likes: 126, gifts: 38, referrals: 1 };

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    return fallback;
  }
}

function persistToStorage(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { scope, authUsername } = useAuthStore((state) => ({
    scope: state.scope as SessionScope,
    authUsername: state.username
  }));
  const [tokenBalance, setTokenBalance] = useState(0);
  const [pendingEarnings, setPendingEarnings] = useState(0);
  const [availableEarnings, setAvailableEarnings] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [preferences, setPreferencesState] = useState<string[]>(() =>
    loadFromStorage<string[]>(PREFERENCES_KEY, ['soft'])
  );
  const [followedUsers, setFollowedUsers] = useState<string[]>(() =>
    loadFromStorage<string[]>(FOLLOWED_USERS_KEY, [])
  );
  const [followedThreads, setFollowedThreads] = useState<string[]>(() =>
    loadFromStorage<string[]>(FOLLOWED_THREADS_KEY, [])
  );
  const [bookmarkedPosts, setBookmarkedPosts] = useState<string[]>(() =>
    loadFromStorage<string[]>(BOOKMARKED_POSTS_KEY, [])
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    loadFromStorage<NotificationItem[]>(NOTIFICATIONS_KEY, DEFAULT_NOTIFICATIONS)
  );
  const [spendingLimits, setSpendingLimitsState] = useState<SpendingLimits>(() =>
    loadFromStorage<SpendingLimits>(SPEND_LIMIT_KEY, DEFAULT_LIMITS)
  );
  const [spentToday, setSpentToday] = useState(0);
  const [spentMonth, setSpentMonth] = useState(0);
  const [purchasesSuspended, setPurchasesSuspended] = useState(false);
  const [preferredCurrency, setPreferredCurrencyState] = useState<CurrencyCode>(() => {
    const stored = loadFromStorage<CurrencyCode | null>(PREFERRED_CURRENCY_KEY, null);
    if (stored) return stored;
    if (typeof window !== 'undefined') {
      return (resolveCurrencyFromLocale(window.navigator.language) as CurrencyCode) ?? 'EUR';
    }
    return 'EUR';
  });
  const [countryCode, setCountryCodeState] = useState<string>(() => {
    if (typeof window === 'undefined') return resolveDefaultCountry();
    return window.localStorage.getItem(COUNTRY_CODE_KEY) ?? resolveDefaultCountry();
  });
  const [languageTags, setLanguageTagsState] = useState<string[]>(() => {
    if (typeof window === 'undefined') {
      return resolveLanguagesForCountry(resolveDefaultCountry());
    }
    const stored = window.localStorage.getItem(LANGUAGE_TAGS_KEY);
    if (!stored) {
      const inferredCountry = window.localStorage.getItem(COUNTRY_CODE_KEY) ?? resolveDefaultCountry();
      return resolveLanguagesForCountry(inferredCountry);
    }
    try {
      const parsed = JSON.parse(stored) as string[];
      return Array.isArray(parsed) && parsed.length > 0
        ? parsed
        : resolveLanguagesForCountry(window.localStorage.getItem(COUNTRY_CODE_KEY) ?? resolveDefaultCountry());
    } catch (error) {
      return resolveLanguagesForCountry(resolveDefaultCountry());
    }
  });
  const [blockedUsers, setBlockedUsers] = useState<string[]>(() =>
    loadFromStorage<string[]>(BLOCKED_USERS_KEY, [])
  );
  const [mutedUsers, setMutedUsers] = useState<string[]>(() => loadFromStorage<string[]>(MUTED_USERS_KEY, []));
  const [notificationPreferences, setNotificationPreferencesState] = useState<NotificationPreferences>(() =>
    loadFromStorage<NotificationPreferences>(NOTIFICATION_PREFS_KEY, DEFAULT_NOTIFICATION_PREFS)
  );
  const [stats, setStats] = useState<UserStatsSnapshot>(() => {
    const stored = loadFromStorage<{ posts: number; likes: number; gifts: number; referrals: number }>(
      USER_STATS_KEY,
      DEFAULT_STATS
    );
    return { ...stored, badges: resolveBadgesFromStats(stored) };
  });
  const [bonusesClaimed, setBonusesClaimed] = useState<string[]>(() =>
    loadFromStorage<string[]>(BONUSES_KEY, [])
  );
  const [attributedReferrer, setAttributedReferrer] = useState<string | null>(() =>
    loadFromStorage<string | null>(ATTRIBUTED_REFERRER_KEY, null)
  );
  const resolvedUsername =
    authUsername && authUsername.length > 0
      ? authUsername
      : scope === 'guest'
      ? 'guest'
      : scope === 'admin'
      ? 'admin-team'
      : scope === 'mod'
      ? 'mod-team'
      : 'creator-demo';
  const sessionCorrelationSeed = useMemo(() => createCorrelationId('session'), []);
  const nextCorrelationId = useCallback(
    (scopeLabel: string = 'req') => createCorrelationId(scopeLabel, sessionCorrelationSeed),
    [sessionCorrelationSeed]
  );
  const queryClient = useQueryClient();

  const { data: walletData } = useQuery<WalletSummary>({
    queryKey: queryKeys.wallet,
    queryFn: fetchWallet
  });

  const { data: walletHistoryData } = useQuery<WalletTransactionItem[]>({
    queryKey: queryKeys.walletHistory,
    queryFn: fetchWalletHistory
  });

  useEffect(() => {
    if (!walletData) return;
    setTokenBalance(walletData.balance);
    setPendingEarnings(walletData.pending);
    setAvailableEarnings(walletData.available);
    setSpentToday(walletData.spentToday);
    setSpentMonth(walletData.spentMonth);
    setPurchasesSuspended(walletData.purchasesSuspended);
    setSpendingLimitsState({ daily: walletData.dailyLimit, monthly: walletData.monthlyLimit });
    if (walletData.preferredCurrency) {
      setPreferredCurrencyState(walletData.preferredCurrency as CurrencyCode);
    }
  }, [walletData]);

  useEffect(() => {
    if (!walletHistoryData) return;
    setTransactions(walletHistoryData);
  }, [walletHistoryData]);

  useEffect(() => {
    persistToStorage(PREFERENCES_KEY, preferences);
  }, [preferences]);

  useEffect(() => {
    persistToStorage(FOLLOWED_USERS_KEY, followedUsers);
  }, [followedUsers]);

  useEffect(() => {
    persistToStorage(FOLLOWED_THREADS_KEY, followedThreads);
  }, [followedThreads]);

  useEffect(() => {
    persistToStorage(BOOKMARKED_POSTS_KEY, bookmarkedPosts);
  }, [bookmarkedPosts]);

  useEffect(() => {
    persistToStorage(NOTIFICATIONS_KEY, notifications);
  }, [notifications]);

  useEffect(() => {
    persistToStorage(SPEND_LIMIT_KEY, spendingLimits);
  }, [spendingLimits]);

  useEffect(() => {
    persistToStorage(BLOCKED_USERS_KEY, blockedUsers);
  }, [blockedUsers]);

  useEffect(() => {
    persistToStorage(MUTED_USERS_KEY, mutedUsers);
  }, [mutedUsers]);

  useEffect(() => {
    persistToStorage(PREFERRED_CURRENCY_KEY, preferredCurrency);
  }, [preferredCurrency]);

  useEffect(() => {
    persistToStorage(COUNTRY_CODE_KEY, countryCode);
  }, [countryCode]);

  useEffect(() => {
    persistToStorage(LANGUAGE_TAGS_KEY, languageTags);
  }, [languageTags]);

  useEffect(() => {
    persistToStorage(NOTIFICATION_PREFS_KEY, notificationPreferences);
  }, [notificationPreferences]);

  useEffect(() => {
    persistToStorage(USER_STATS_KEY, {
      posts: stats.posts,
      likes: stats.likes,
      gifts: stats.gifts,
      referrals: stats.referrals
    });
  }, [stats.posts, stats.likes, stats.gifts, stats.referrals]);

  useEffect(() => {
    persistToStorage(BONUSES_KEY, bonusesClaimed);
  }, [bonusesClaimed]);

  useEffect(() => {
    persistToStorage(ATTRIBUTED_REFERRER_KEY, attributedReferrer);
  }, [attributedReferrer]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && ref !== resolvedUsername) {
      setAttributedReferrer(ref);
      setNotifications((prev) => [
        {
          id: `notif-ref-${Date.now()}`,
          type: 'referral',
          message: `Nuevo referido atribuido a @${ref}. Si compra créditos ganarás +500 Créditos (TKN).`,
          createdAt: new Date().toISOString(),
          read: false
        },
        ...prev
      ]);
    }
  }, [resolvedUsername]);

  const appendTransaction = useCallback((tx: WalletTransaction) => {
    setTransactions((prev) => [tx, ...prev].slice(0, 40));
  }, []);

  const credit = useCallback((amount: number, concept: string) => {
    setTokenBalance((prev) => prev + amount);
    appendTransaction({
      id: `credit-${Date.now()}`,
      concept,
      delta: amount,
      createdAt: new Date().toISOString()
    });
    recordTelemetryEvent(
      'wallet.credit',
      { amount, concept, scope },
      { requestId: nextCorrelationId('credit'), tags: { feature: 'wallet' } }
    );
  }, [appendTransaction, nextCorrelationId, scope]);

  const emitSpendFailure = useCallback((
    reason: SpendFailureReason,
    context?: { dailyRemaining?: number; monthlyRemaining?: number }
  ) => {
    const { title, description } = getSpendFailureCopy(reason, context);
    toast.error(title, description ? { description } : undefined);
    recordSpendFailure(
      reason,
      { ...context, balance: tokenBalance, scope },
      { requestId: nextCorrelationId('spend-fail') }
    );
  }, [nextCorrelationId, scope, tokenBalance]);

  const spend: SessionValue['spend'] = useCallback(async (amount, concept, options) => {
    if (purchasesSuspended) {
      emitSpendFailure('PURCHASES_SUSPENDED');
      return false;
    }
    if (tokenBalance < amount) {
      emitSpendFailure('INSUFFICIENT_FUNDS');
      return false;
    }
    const dailyRemaining = Math.max(spendingLimits.daily - spentToday, 0);
    if (spendingLimits.daily > 0 && spentToday + amount > spendingLimits.daily) {
      emitSpendFailure('DAILY_LIMIT', { dailyRemaining });
      return false;
    }
    const monthlyRemaining = Math.max(spendingLimits.monthly - spentMonth, 0);
    if (spendingLimits.monthly > 0 && spentMonth + amount > spendingLimits.monthly) {
      emitSpendFailure('MONTHLY_LIMIT', { monthlyRemaining });
      return false;
    }

    try {
      if (options?.execute) {
        await options.execute();
      }
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: unknown }).message ?? '')
          : '';
      emitSpendFailure('SERVICE_ERROR');
      if (message) {
        toast.error('Error al procesar la operación', { description: message });
      }
      return false;
    }

    setTokenBalance((prev) => Math.max(prev - amount, 0));
    setSpentToday((prev) => prev + amount);
    setSpentMonth((prev) => prev + amount);
    recordSpendSuccess(concept, { amount, scope }, { requestId: nextCorrelationId('spend') });
    queryClient.invalidateQueries({ queryKey: queryKeys.wallet });
    queryClient.invalidateQueries({ queryKey: queryKeys.walletHistory });
    return true;
  }, [
    purchasesSuspended,
    emitSpendFailure,
    tokenBalance,
    spendingLimits,
    spentToday,
    spentMonth,
    scope,
    nextCorrelationId,
    queryClient
  ]);

  const toggleFollowUser = useCallback((username: string) => {
    setFollowedUsers((prev) =>
      prev.includes(username) ? prev.filter((item) => item !== username) : [...prev, username]
    );
  }, []);

  const toggleThreadFollow = useCallback((threadId: string) => {
    setFollowedThreads((prev) =>
      prev.includes(threadId) ? prev.filter((item) => item !== threadId) : [...prev, threadId]
    );
  }, []);

  const toggleBookmark = useCallback((postId: string) => {
    setBookmarkedPosts((prev) =>
      prev.includes(postId) ? prev.filter((item) => item !== postId) : [...prev, postId]
    );
  }, []);

  const addNotification: SessionValue['addNotification'] = useCallback(
    (notification) => {
      const allowed =
        notification.type === 'system' || notificationPreferences[notification.type as NotificationPreferenceKey];
      if (!allowed) {
        recordNotificationReceived(notification.type, { scope, muted: true }, {
          requestId: nextCorrelationId('notification-muted')
      });
      return;
    }
    const next: NotificationItem = {
      id: notification.id ?? `notif-${Date.now()}`,
      type: notification.type,
      message: notification.message,
      createdAt: notification.createdAt ?? new Date().toISOString(),
      read: notification.read ?? false,
      metadata: notification.metadata
    };
      setNotifications((prev) => [next, ...prev].slice(0, 50));
      recordNotificationReceived(next.type, { scope, notificationId: next.id }, {
        requestId: nextCorrelationId('notification')
      });
    },
    [nextCorrelationId, notificationPreferences, scope]
  );

  const markNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
  }, []);

  const setSpendingLimits = useCallback((limits: SpendingLimits) => {
    setSpendingLimitsState(limits);
  }, []);

  const setPreferredCurrency = useCallback((code: CurrencyCode) => {
    setPreferredCurrencyState(code);
  }, []);

  const setCountryCode = useCallback((code: string) => {
    setCountryCodeState(code);
    const inferred = resolveLanguagesForCountry(code);
    setLanguageTagsState((prev) => (prev.length === 0 ? inferred : prev));
  }, []);

  const setLanguageTags = useCallback((tags: string[]) => {
    setLanguageTagsState(tags);
  }, []);

  const blockUser = useCallback((username: string) => {
    setBlockedUsers((prev) => (prev.includes(username) ? prev : [...prev, username]));
    setMutedUsers((prev) => (prev.includes(username) ? prev : [...prev, username]));
    setFollowedUsers((prev) => prev.filter((item) => item !== username));
  }, []);

  const unblockUser = useCallback((username: string) => {
    setBlockedUsers((prev) => prev.filter((item) => item !== username));
  }, []);

  const muteUser = useCallback((username: string) => {
    setMutedUsers((prev) => (prev.includes(username) ? prev : [...prev, username]));
  }, []);

  const unmuteUser = useCallback((username: string) => {
    setMutedUsers((prev) => prev.filter((item) => item !== username));
  }, []);

  const adjustStats: SessionValue['adjustStats'] = useCallback((delta) => {
    setStats((prev) => {
      const nextCounts = {
        posts: Math.max(prev.posts + (delta.posts ?? 0), 0),
        likes: Math.max(prev.likes + (delta.likes ?? 0), 0),
        gifts: Math.max(prev.gifts + (delta.gifts ?? 0), 0),
        referrals: Math.max(prev.referrals + (delta.referrals ?? 0), 0)
      };
      return { ...nextCounts, badges: resolveBadgesFromStats(nextCounts) };
    });
  }, []);

  const recordReferralConversion = useCallback(() => {
    adjustStats({ referrals: 1 });
    const reward = 500;
    credit(reward, 'Bonus referidos');
    const message = attributedReferrer
      ? `🔥 500 créditos (TKN) añadidos: @${attributedReferrer} convirtió a su referido.`
      : '🔥 500 créditos (TKN) añadidos: tu amigo compró créditos.';
    toast.success(message);
    addNotification({
      type: 'referral',
      message,
      metadata: { reward, attributedReferrer }
    });
    setAttributedReferrer(null);
    recordTelemetryEvent(
      'referral.converted',
      { scope, reward },
      { requestId: nextCorrelationId('referral') }
    );
  }, [adjustStats, addNotification, attributedReferrer, credit, nextCorrelationId, scope]);

  const claimBonus: SessionValue['claimBonus'] = useCallback((bonusId, amountTokens, message) => {
    if (bonusesClaimed.includes(bonusId)) {
      return false;
    }
    credit(amountTokens, message);
    setBonusesClaimed((prev) => [...prev, bonusId]);
    addNotification({ type: 'system', message, metadata: { bonusId, amountTokens } });
    toast.success(message);
    return true;
  }, [addNotification, bonusesClaimed, credit]);

  const setNotificationPreference: SessionValue['setNotificationPreference'] = useCallback((key, value) => {
    setNotificationPreferencesState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const referralLink = useMemo(() => buildReferralLink(resolvedUsername), [resolvedUsername]);

  const value = useMemo<SessionValue>(
    () => ({
      scope,
      alias:
        scope === 'guest'
          ? 'Guest'
          : scope === 'admin'
          ? 'Admin'
          : scope === 'mod'
          ? 'Moderador'
          : 'Creator',
      username: resolvedUsername,
      tokenBalance,
      pendingEarnings,
      availableEarnings,
      transactions,
      preferences,
      notifications,
      unreadNotifications: notifications.filter((notification) => !notification.read).length,
      followedUsers,
      followedThreads,
      bookmarkedPosts,
      blockedUsers,
      mutedUsers,
      spendingLimits,
      spendingUsage: { today: spentToday, month: spentMonth },
      purchasesSuspended,
      preferredCurrency,
      stats,
      referralLink,
      notificationPreferences,
      countryCode,
      languageTags,
      credit,
      spend,
      setPreferences: setPreferencesState,
      formatBalance: () => formatTokens(tokenBalance),
      setCountryCode,
      setLanguageTags,
      toggleFollowUser,
      isFollowingUser: (username: string) => followedUsers.includes(username),
      toggleThreadFollow,
      isThreadFollowed: (threadId: string) => followedThreads.includes(threadId),
      toggleBookmark,
      isPostBookmarked: (postId: string) => bookmarkedPosts.includes(postId),
      addNotification,
      markNotificationsRead,
      setSpendingLimits,
      setPreferredCurrency,
      blockUser,
      unblockUser,
      isBlocked: (username: string) => blockedUsers.includes(username),
      muteUser,
      unmuteUser,
      isMuted: (username: string) => mutedUsers.includes(username),
      adjustStats,
      recordReferralConversion,
      claimBonus,
      setNotificationPreference,
      createRequestId: (scopeLabel?: string) => nextCorrelationId(scopeLabel),
      attributedReferrer,
      clearAttributedReferrer: () => setAttributedReferrer(null)
    }),
    [
      scope,
      resolvedUsername,
      tokenBalance,
      pendingEarnings,
      availableEarnings,
      transactions,
      preferences,
      notifications,
      followedUsers,
      followedThreads,
      bookmarkedPosts,
      blockedUsers,
      mutedUsers,
      spendingLimits,
      spentToday,
      spentMonth,
      purchasesSuspended,
      preferredCurrency,
      stats,
      referralLink,
      attributedReferrer,
      notificationPreferences,
      countryCode,
      languageTags,
      nextCorrelationId,
      credit,
      spend,
      setPreferencesState,
      toggleFollowUser,
      toggleThreadFollow,
      toggleBookmark,
      addNotification,
      markNotificationsRead,
      setSpendingLimits,
      setPreferredCurrency,
      blockUser,
      unblockUser,
      muteUser,
      unmuteUser,
      adjustStats,
      recordReferralConversion,
      claimBonus,
      setNotificationPreference,
      setCountryCode,
      setLanguageTags,
      setAttributedReferrer
    ]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
};

export const canAfford = (balance: number, cost: number) => balance >= cost;

export const getPurchaseCopy = (cost: number, currency: CurrencyCode = 'EUR', locale?: string) =>
  `${formatTokens(cost)} · ${formatFiat(cost, currency, locale ?? 'es-ES')} aprox.`;

export const getTransactionsByDay = (transactions: WalletTransaction[]) => {
  const map = new Map<string, WalletTransaction[]>();
  transactions.forEach((tx) => {
    const day = dayjs(tx.createdAt).format('YYYY-MM-DD');
    if (!map.has(day)) map.set(day, []);
    map.get(day)?.push(tx);
  });
  return Array.from(map.entries()).map(([day, txs]) => ({ day, txs }));
};

export const getStaticCatalog = () => staticCatalog;
