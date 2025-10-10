import { config } from 'dotenv';

config();

export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
export const PORT = Number(process.env.PORT || 8080);
export const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
export const TOKEN_EXPIRATION = Number(process.env.TOKEN_EXPIRATION_SECONDS || 900);
export const REFRESH_EXPIRATION = Number(process.env.REFRESH_EXPIRATION_SECONDS || 60 * 60 * 24 * 7);
export const DAILY_DEFAULT_LIMIT = Number(process.env.WALLET_DAILY_LIMIT || 50000);
export const MONTHLY_DEFAULT_LIMIT = Number(process.env.WALLET_MONTHLY_LIMIT || 150000);
export const MASSIVE_ROOM_MESSAGE_CACHE = Number(process.env.MASSIVE_ROOM_MESSAGE_CACHE || 200);
export const SLOW_MODE_DEFAULT = Number(process.env.MASSIVE_ROOM_SLOWMODE_DEFAULT || 3);
export const MAX_MESSAGE_RATE = Number(process.env.MASSIVE_ROOM_MAX_RATE || 10);
export const MAX_BURST_WINDOW_MS = Number(process.env.MASSIVE_ROOM_BURST_WINDOW_MS || 10_000);
export const TURN_ICE_SERVERS = process.env.TURN_URI
  ? [{ urls: [process.env.TURN_URI], username: process.env.TURN_USER, credential: process.env.TURN_PASS }]
  : [];
export const SIGNAL_HEARTBEAT_MS = Number(process.env.SIGNAL_HEARTBEAT_MS || 20_000);
export const FEATURE_FLAGS = {
  massiveRooms: process.env.ROOMS_MASSIVE === 'true',
  massiveRoomTopics: process.env.ROOMS_TOPICS !== 'false',
  massiveRoomPolls: process.env.ROOMS_POLLS === 'true',
  roomTokenTransfer: process.env.ROOMS_TOKEN_TRANSFER !== 'false',
  roomGifts: process.env.ROOMS_GIFTS !== 'false',
  roomInlineTopup: process.env.ROOMS_INLINE_TOPUP !== 'false'
};
