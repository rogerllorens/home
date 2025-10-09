import { nanoid } from 'nanoid';
import { ulid } from 'ulid';
import {
  CheckoutOrder,
  DirectTransfer,
  MassiveRoom,
  MessageReaction,
  Referral,
  RoomMember,
  RoomMessage,
  RoomMessageMedia,
  RoomReport,
  Session,
  TokenPack,
  User,
  Wallet,
  WalletOwner,
  WalletTx
} from './types.js';
import { DAILY_DEFAULT_LIMIT, MONTHLY_DEFAULT_LIMIT, MASSIVE_ROOM_MESSAGE_CACHE, SLOW_MODE_DEFAULT } from './config.js';

const users = new Map<string, User>();
const sessions = new Map<string, Session>();
const wallets = new Map<string, Wallet>();
const walletTransactions: WalletTx[] = [];
const tokenPacks: TokenPack[] = [
  { id: 'pack-s', name: 'Pack S', tokens: 500, priceEuros: 4.99 },
  { id: 'pack-m', name: 'Pack M', tokens: 1200, priceEuros: 9.99, popular: true },
  { id: 'pack-l', name: 'Pack L', tokens: 3000, priceEuros: 24.99 },
  { id: 'pack-xl', name: 'Pack XL', tokens: 6500, priceEuros: 49.99 },
  { id: 'pack-xxl', name: 'Pack XXL', tokens: 14000, priceEuros: 99.99 }
];
const checkoutOrders = new Map<string, CheckoutOrder>();
const referrals = new Map<string, Referral>();
const directTransfers = new Map<string, DirectTransfer>();
const rooms = new Map<string, MassiveRoom>();
const roomMembers = new Map<string, Map<string, RoomMember>>();
const roomMessages = new Map<string, RoomMessage[]>();
const roomReactions = new Map<string, Map<string, Set<string>>>();
const roomReports = new Map<string, RoomReport>();
const messageMedia = new Map<string, RoomMessageMedia>();

export function createUser(params: Omit<User, 'id' | 'createdAt' | 'followers'>): User {
  const id = nanoid();
  const user: User = {
    id,
    createdAt: Date.now(),
    followers: new Set(),
    ...params
  };
  users.set(id, user);
  ensureWallet({ type: 'user', id });
  return user;
}

export function getUserByUsername(username: string): User | undefined {
  return Array.from(users.values()).find((user) => user.username.toLowerCase() === username.toLowerCase());
}

export function getUserByEmail(email: string): User | undefined {
  return Array.from(users.values()).find((user) => user.email?.toLowerCase() === email.toLowerCase());
}

export function getUser(id: string): User | undefined {
  return users.get(id);
}

export function upsertSession(session: Session): Session {
  sessions.set(session.id, session);
  ensureWallet({ type: 'session', id: session.id });
  return session;
}

export function getSession(id: string): Session | undefined {
  return sessions.get(id);
}

export function deleteSession(id: string): void {
  sessions.delete(id);
}

export function ensureWallet(owner: WalletOwner): Wallet {
  const key = `${owner.type}:${owner.id}`;
  const wallet = wallets.get(key);
  if (wallet) {
    return wallet;
  }
  const newWallet: Wallet = {
    ownerType: owner.type,
    ownerId: owner.id,
    balance: 0,
    pending: 0,
    available: 0,
    dailyLimit: DAILY_DEFAULT_LIMIT,
    monthlyLimit: MONTHLY_DEFAULT_LIMIT,
    spentToday: 0,
    spentMonth: 0,
    purchasesSuspended: false,
    updatedAt: Date.now()
  };
  wallets.set(key, newWallet);
  return newWallet;
}

function isSameDay(timestamp: number): boolean {
  const today = new Date();
  const other = new Date(timestamp);
  return (
    today.getUTCFullYear() === other.getUTCFullYear() &&
    today.getUTCMonth() === other.getUTCMonth() &&
    today.getUTCDate() === other.getUTCDate()
  );
}

function isSameMonth(timestamp: number): boolean {
  const today = new Date();
  const other = new Date(timestamp);
  return today.getUTCFullYear() === other.getUTCFullYear() && today.getUTCMonth() === other.getUTCMonth();
}

export function applyWalletDelta(owner: WalletOwner, amount: number): Wallet {
  const wallet = ensureWallet(owner);
  wallet.balance += amount;
  wallet.updatedAt = Date.now();
  return wallet;
}

export function recordWalletTx(tx: Omit<WalletTx, 'id' | 'createdAt'>): WalletTx {
  const entry: WalletTx = { id: ulid(), createdAt: Date.now(), ...tx };
  walletTransactions.unshift(entry);
  const ownerKey = `${tx.ownerType}:${tx.ownerId}`;
  const wallet = ensureWallet({ type: tx.ownerType, id: tx.ownerId });
  if (tx.type === 'SPEND' || tx.type === 'TRANSFER_OUT' || tx.type === 'PAYOUT') {
    wallet.spentToday = isSameDay(wallet.updatedAt) ? wallet.spentToday + tx.amount : tx.amount;
    wallet.spentMonth = isSameMonth(wallet.updatedAt) ? wallet.spentMonth + tx.amount : tx.amount;
  }
  wallet.updatedAt = Date.now();
  wallets.set(ownerKey, wallet);
  return entry;
}

export function getWallet(owner: WalletOwner): Wallet {
  return ensureWallet(owner);
}

export function getWalletHistory(owner: WalletOwner, limit = 50): WalletTx[] {
  return walletTransactions.filter((entry) => entry.ownerType === owner.type && entry.ownerId === owner.id).slice(0, limit);
}

export function getTokenPacks(): TokenPack[] {
  return tokenPacks;
}

export function createCheckout(owner: WalletOwner, packId: string, provider: string): CheckoutOrder {
  const pack = tokenPacks.find((candidate) => candidate.id === packId);
  if (!pack) {
    throw new Error('PACK_NOT_FOUND');
  }
  const order: CheckoutOrder = {
    id: ulid(),
    owner,
    packId,
    provider,
    status: 'pending',
    createdAt: Date.now()
  };
  checkoutOrders.set(order.id, order);
  return order;
}

export function getCheckout(orderId: string): CheckoutOrder | undefined {
  return checkoutOrders.get(orderId);
}

export function finalizeCheckout(orderId: string, providerRef: string, approved: boolean): CheckoutOrder {
  const order = checkoutOrders.get(orderId);
  if (!order) {
    throw new Error('ORDER_NOT_FOUND');
  }
  if (order.status !== 'pending') {
    return order;
  }
  order.providerRef = providerRef;
  order.status = approved ? 'approved' : 'declined';
  if (approved) {
    const pack = tokenPacks.find((candidate) => candidate.id === order.packId);
    if (!pack) {
      throw new Error('PACK_NOT_FOUND');
    }
    applyWalletDelta(order.owner, pack.tokens);
    recordWalletTx({
      ownerType: order.owner.type,
      ownerId: order.owner.id,
      type: 'PURCHASE',
      amount: pack.tokens,
      concept: `Compra pack ${pack.name}`,
      ref: providerRef
    });
  }
  checkoutOrders.set(orderId, order);
  return order;
}

export function listRooms(): MassiveRoom[] {
  return Array.from(rooms.values());
}

export function upsertRoom(room: Partial<MassiveRoom> & { id?: string; createdBy: string }): MassiveRoom {
  const id = room.id ?? ulid();
  const existing = rooms.get(id);
  const record: MassiveRoom = {
    id,
    title: room.title ?? existing?.title ?? 'Sala',
    type: room.type ?? existing?.type ?? 'topic',
    tags: room.tags ?? existing?.tags ?? [],
    rules: room.rules ?? existing?.rules,
    slowModeSeconds: room.slowModeSeconds ?? existing?.slowModeSeconds ?? SLOW_MODE_DEFAULT,
    isNSFW: room.isNSFW ?? existing?.isNSFW ?? false,
    shardKey: room.shardKey ?? existing?.shardKey ?? `shard-${Math.floor(Math.random() * 4)}`,
    createdBy: room.createdBy,
    createdAt: existing?.createdAt ?? Date.now()
  };
  rooms.set(id, record);
  if (!roomMembers.has(id)) {
    roomMembers.set(id, new Map());
  }
  return record;
}

export function joinRoom(roomId: string, userId: string, role: RoomMember['role'] = 'member'): RoomMember {
  const room = rooms.get(roomId);
  if (!room) {
    throw new Error('ROOM_NOT_FOUND');
  }
  const members = roomMembers.get(roomId) ?? new Map();
  const existing = members.get(userId);
  const record: RoomMember = existing ?? { roomId, userId, role, joinedAt: Date.now() };
  members.set(userId, record);
  roomMembers.set(roomId, members);
  return record;
}

export function leaveRoom(roomId: string, userId: string): void {
  const members = roomMembers.get(roomId);
  if (members) {
    members.delete(userId);
  }
}

export function getRoomMembers(roomId: string): RoomMember[] {
  return Array.from(roomMembers.get(roomId)?.values() ?? []);
}

export function addRoomMessage(message: Omit<RoomMessage, 'id' | 'createdAt' | 'media'> & { media?: RoomMessageMedia[] }): RoomMessage {
  const id = ulid();
  const entry: RoomMessage = {
    id,
    createdAt: Date.now(),
    media: message.media ?? [],
    ...message
  };
  const messages = roomMessages.get(message.roomId) ?? [];
  messages.unshift(entry);
  roomMessages.set(message.roomId, messages.slice(0, MASSIVE_ROOM_MESSAGE_CACHE));
  return entry;
}

export function listRoomMessages(roomId: string, limit = MASSIVE_ROOM_MESSAGE_CACHE): RoomMessage[] {
  return (roomMessages.get(roomId) ?? []).slice(0, limit);
}

export function setReaction(messageId: string, emoji: string, userId: string): number {
  const reactions = roomReactions.get(messageId) ?? new Map();
  const users = reactions.get(emoji) ?? new Set();
  users.add(userId);
  reactions.set(emoji, users);
  roomReactions.set(messageId, reactions);
  return users.size;
}

export function removeReaction(messageId: string, emoji: string, userId: string): number {
  const reactions = roomReactions.get(messageId);
  if (!reactions) {
    return 0;
  }
  const users = reactions.get(emoji);
  if (!users) {
    return 0;
  }
  users.delete(userId);
  if (users.size === 0) {
    reactions.delete(emoji);
  } else {
    reactions.set(emoji, users);
  }
  return users.size;
}

export function getReactions(messageId: string): Record<string, number> {
  const reactions = roomReactions.get(messageId);
  if (!reactions) {
    return {};
  }
  return Object.fromEntries(Array.from(reactions.entries()).map(([emoji, users]) => [emoji, users.size]));
}

export function recordReport(report: RoomReport): void {
  roomReports.set(report.id, report);
}

export function listReports(roomId?: string): RoomReport[] {
  return Array.from(roomReports.values()).filter((report) => !roomId || report.roomId === roomId);
}

export function recordReferral(referral: Referral): void {
  referrals.set(referral.id, referral);
}

export function listReferralsByReferrer(referrerId: string): Referral[] {
  return Array.from(referrals.values()).filter((ref) => ref.referrerId === referrerId);
}

export function recordDirectTransfer(transfer: DirectTransfer): void {
  directTransfers.set(transfer.id, transfer);
}

export function listDirectTransfers(userId: string, limit = 50): DirectTransfer[] {
  return Array.from(directTransfers.values())
    .filter((item) => item.fromId === userId || item.toId === userId)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
}

export function bootstrapRooms() {
  if (rooms.size > 0) {
    return;
  }
  const defaults: Array<Partial<MassiveRoom>> = [
    { title: 'Lobby global', type: 'trending', tags: ['global', 'bienvenida'], createdBy: 'system', shardKey: 'shard-0' },
    { title: 'Comunidad latina', type: 'topic', tags: ['latam', 'es'], createdBy: 'system', shardKey: 'shard-1' },
    { title: 'NSFW +18', type: 'topic', tags: ['+18', 'nsfw'], createdBy: 'system', shardKey: 'shard-2', isNSFW: true },
    { title: 'Match aleatorio', type: 'random', tags: ['random'], createdBy: 'system', shardKey: 'shard-3' }
  ];
  defaults.forEach((room) => upsertRoom({ ...room, createdBy: room.createdBy ?? 'system' }));
}

export function listSessions(): Session[] {
  return Array.from(sessions.values());
}

export function listUsers(): User[] {
  return Array.from(users.values());
}

export function addMessageMedia(media: RoomMessageMedia): void {
  messageMedia.set(media.id, media);
}

export function getMessageMedia(id: string): RoomMessageMedia | undefined {
  return messageMedia.get(id);
}

export function listMessageMediaByMessage(messageId: string): RoomMessageMedia[] {
  return Array.from(messageMedia.values()).filter((item) => item.messageId === messageId);
}

export function setWalletLimits(owner: WalletOwner, dailyLimit: number, monthlyLimit: number): Wallet {
  const wallet = ensureWallet(owner);
  wallet.dailyLimit = dailyLimit;
  wallet.monthlyLimit = monthlyLimit;
  wallet.updatedAt = Date.now();
  return wallet;
}

export function suspendPurchases(owner: WalletOwner, suspended: boolean): Wallet {
  const wallet = ensureWallet(owner);
  wallet.purchasesSuspended = suspended;
  wallet.updatedAt = Date.now();
  return wallet;
}

export function resetStores() {
  users.clear();
  sessions.clear();
  wallets.clear();
  walletTransactions.length = 0;
  checkoutOrders.clear();
  referrals.clear();
  directTransfers.clear();
  rooms.clear();
  roomMembers.clear();
  roomMessages.clear();
  roomReactions.clear();
  roomReports.clear();
  messageMedia.clear();
}
