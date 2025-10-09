export type Scope = 'guest' | 'user' | 'admin' | 'mod';

export interface User {
  id: string;
  username: string;
  email?: string;
  passHash?: string;
  role: Scope;
  createdAt: number;
  countryCode?: string;
  languageTags: string[];
  followers: Set<string>;
}

export interface Session {
  id: string;
  userId?: string;
  scope: Scope;
  ageConfirmed: boolean;
  countryCode?: string;
  languageTags: string[];
  createdAt: number;
  lastSeen: number;
  shadowbanned?: boolean;
}

export type WalletOwner = { type: 'user'; id: string } | { type: 'session'; id: string };

export interface Wallet {
  ownerType: WalletOwner['type'];
  ownerId: string;
  balance: number;
  pending: number;
  available: number;
  dailyLimit: number;
  monthlyLimit: number;
  spentToday: number;
  spentMonth: number;
  purchasesSuspended: boolean;
  updatedAt: number;
}

export type WalletTxType =
  | 'PURCHASE'
  | 'SPEND'
  | 'SPLIT'
  | 'HOLD_RELEASE'
  | 'PAYOUT'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT';

export interface WalletTx {
  id: string;
  ownerType: WalletOwner['type'];
  ownerId: string;
  type: WalletTxType;
  amount: number;
  concept: string;
  ref?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
}

export interface TokenPack {
  id: string;
  name: string;
  tokens: number;
  priceEuros: number;
  popular?: boolean;
}

export interface MassiveRoom {
  id: string;
  type: 'random' | 'topic' | 'trending';
  title: string;
  tags: string[];
  rules?: string;
  slowModeSeconds: number;
  isNSFW: boolean;
  shardKey: string;
  createdBy: string;
  createdAt: number;
}

export interface RoomMember {
  roomId: string;
  userId: string;
  role: 'owner' | 'mod' | 'helper' | 'member';
  joinedAt: number;
  mutedUntil?: number;
}

export interface RoomMessageMedia {
  id: string;
  roomId: string;
  messageId: string;
  type: 'image' | 'video';
  s3Key: string;
  width?: number;
  height?: number;
  bytes: number;
  status: 'pending' | 'ok' | 'blocked';
}

export interface RoomMessage {
  id: string;
  roomId: string;
  authorId: string;
  text?: string;
  replyTo?: string;
  media: RoomMessageMedia[];
  createdAt: number;
  deletedAt?: number;
  pinned?: boolean;
}

export interface MessageReaction {
  messageId: string;
  emoji: string;
  userId: string;
  createdAt: number;
}

export interface RoomReport {
  id: string;
  roomId: string;
  reporterId: string;
  targetUserId?: string;
  targetMsgId?: string;
  reason: string;
  createdAt: number;
}

export interface Referral {
  id: string;
  referrerId: string;
  refereeId: string;
  tokensAwarded: number;
  createdAt: number;
}

export interface CheckoutOrder {
  id: string;
  owner: WalletOwner;
  packId: string;
  provider: string;
  status: 'pending' | 'approved' | 'declined';
  providerRef?: string;
  createdAt: number;
}

export interface GiftCatalogueItem {
  id: string;
  name: string;
  tokens: number;
  animation: string;
}

export interface DirectTransfer {
  id: string;
  fromId: string;
  toId: string;
  amount: number;
  createdAt: number;
  eurAtTx: number;
  roomId?: string;
}

export interface MatchTicket {
  id: string;
  sessionId: string;
  userId?: string;
  consents: string[];
  createdAt: number;
}

export interface PendingMatch {
  roomId: string;
  a: MatchParticipant;
  b: MatchParticipant;
  createdAt: number;
}

export interface MatchParticipant {
  sessionId: string;
  userId?: string;
  connectionId: string;
  preferences: string[];
}
