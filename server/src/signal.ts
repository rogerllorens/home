import { FastifyInstance } from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import { WebSocket } from 'ws';
import { ulid } from 'ulid';
import {
  addRoomMessage,
  getReactions,
  getRoom,
  joinRoom,
  leaveRoom,
  listRoomMessages,
  setReaction,
  removeReaction,
  getRoomMembers,
  ensureWallet,
  getWallet,
  applyWalletDelta,
  recordWalletTx
} from './store.js';
import { MASSIVE_ROOM_MESSAGE_CACHE, SIGNAL_HEARTBEAT_MS, SLOW_MODE_DEFAULT } from './config.js';

interface SignalClient {
  id: string;
  ws: WebSocket;
  sessionId?: string;
  userId?: string;
  scope?: string;
  rooms: Set<string>;
  lastSeen: number;
  slowMode: Map<string, number>;
}

const clients = new Map<string, SignalClient>();
const matchQueue: Array<{ clientId: string; consents: string[] }> = [];

export async function setupSignal(app: FastifyInstance) {
  await app.register(fastifyWebsocket, { options: { maxPayload: 1_000_000 } });

  app.get('/signal', { websocket: true }, (connection, request) => {
    const clientId = ulid();
    const client: SignalClient = {
      id: clientId,
      ws: connection.socket,
      rooms: new Set(),
      lastSeen: Date.now(),
      slowMode: new Map()
    };
    clients.set(clientId, client);

    connection.socket.on('message', (raw) => {
      try {
        const message = JSON.parse(raw.toString());
        handleMessage(client, message);
      } catch (error) {
        console.error('Invalid signal message', error);
      }
    });

    connection.socket.on('close', () => {
      clients.delete(clientId);
    });

    connection.socket.send(
      JSON.stringify({
        type: 'WELCOME',
        payload: { serverVersion: '1.0.0', heartbeatSec: Math.round(SIGNAL_HEARTBEAT_MS / 1000) }
      })
    );
  });
}

function handleMessage(client: SignalClient, message: any) {
  switch (message?.type) {
    case 'HELLO':
      client.sessionId = message.payload?.sessionId;
      client.userId = message.payload?.userId;
      client.scope = message.payload?.scope ?? 'guest';
      break;
    case 'PING':
      client.ws.send(JSON.stringify({ type: 'PONG' }));
      break;
    case 'TICKET_CREATE':
      enqueueMatch(client, message.payload?.consents ?? []);
      break;
    case 'RTC_SIGNAL':
      forwardSignal(client, message.payload);
      break;
    case 'ROOM_JOIN':
      joinMassiveRoom(client, message.payload?.roomId);
      break;
    case 'ROOM_LEAVE':
      leaveMassiveRoom(client, message.payload?.roomId);
      break;
    case 'MSG_SEND':
      handleRoomMessage(client, message.payload);
      break;
    case 'MSG_REACT':
      handleReaction(client, message.payload, true);
      break;
    case 'MSG_UNREACT':
      handleReaction(client, message.payload, false);
      break;
    case 'GIFT_SEND':
      broadcastToRoom(message.payload?.roomId, { type: 'GIFT_RECV', payload: { ...message.payload, from: client.sessionId } });
      break;
    case 'TOKENS_TRANSFER':
      broadcastToRoom(message.payload?.roomId, {
        type: 'TOKENS_TRANSFER_RECV',
        payload: { ...message.payload, from: client.sessionId }
      });
      break;
    default:
      break;
  }
}

function enqueueMatch(client: SignalClient, consents: string[]) {
  matchQueue.push({ clientId: client.id, consents });
  if (matchQueue.length >= 2) {
    const a = matchQueue.shift();
    const b = matchQueue.shift();
    if (!a || !b) return;
    const clientA = clients.get(a.clientId);
    const clientB = clients.get(b.clientId);
    if (!clientA || !clientB) {
      return;
    }
    const roomId = ulid();
    clientA.ws.send(
      JSON.stringify({
        type: 'MATCH_FOUND',
        payload: {
          roomId,
          peer: { sessionId: clientB.sessionId, username: clientB.userId ?? 'guest' },
          iceServers: []
        }
      })
    );
    clientB.ws.send(
      JSON.stringify({
        type: 'MATCH_FOUND',
        payload: {
          roomId,
          peer: { sessionId: clientA.sessionId, username: clientA.userId ?? 'guest' },
          iceServers: []
        }
      })
    );
  }
}

function forwardSignal(client: SignalClient, payload: any) {
  const targetId = payload?.to;
  if (!targetId) {
    return;
  }
  const target = Array.from(clients.values()).find((entry) => entry.sessionId === targetId);
  if (!target) {
    return;
  }
  target.ws.send(JSON.stringify({ type: 'RTC_SIGNAL', payload: { from: client.sessionId, data: payload.data } }));
}

function joinMassiveRoom(client: SignalClient, roomId: string) {
  if (!roomId) {
    return;
  }
  client.rooms.add(roomId);
  joinRoom(roomId, client.userId ?? client.sessionId ?? client.id);
  const history = listRoomMessages(roomId, MASSIVE_ROOM_MESSAGE_CACHE).reverse();
  client.ws.send(
    JSON.stringify({
      type: 'ROOM_JOINED',
      payload: { roomId, history, participants: getRoomMembers(roomId).length }
    })
  );
}

function leaveMassiveRoom(client: SignalClient, roomId: string) {
  if (!roomId) {
    return;
  }
  client.rooms.delete(roomId);
  leaveRoom(roomId, client.userId ?? client.sessionId ?? client.id);
}

function handleRoomMessage(client: SignalClient, payload: any) {
  const roomId = payload?.roomId;
  if (!roomId || !client.rooms.has(roomId)) {
    return;
  }
  const room = getRoom(roomId);
  const now = Date.now();
  const last = client.slowMode.get(roomId) ?? 0;
  const slowModeSeconds = room?.slowModeSeconds ?? SLOW_MODE_DEFAULT;
  if (slowModeSeconds > 0 && now - last < slowModeSeconds * 1000) {
    client.ws.send(
      JSON.stringify({ type: 'SLOWMODE_ACTIVE', payload: { roomId, remainingMs: slowModeSeconds * 1000 - (now - last) } })
    );
    return;
  }
  client.slowMode.set(roomId, now);
  const message = addRoomMessage({
    roomId,
    authorId: client.userId ?? client.sessionId ?? client.id,
    text: payload?.text,
    replyTo: payload?.replyTo
  });
  const enriched = { ...message, reactions: getReactions(message.id) };
  broadcastToRoom(roomId, {
    type: 'MSG_RECV',
    payload: enriched
  });
  client.ws.send(JSON.stringify({ type: 'MSG_ACK', payload: { roomId, messageId: message.id, status: 'delivered' } }));
}

function handleReaction(client: SignalClient, payload: any, add: boolean) {
  const roomId = payload?.roomId;
  if (!roomId || !client.rooms.has(roomId)) {
    return;
  }
  const messageId = payload?.msgId;
  const emoji = payload?.emoji;
  if (!messageId || !emoji) {
    return;
  }
  const count = add
    ? setReaction(messageId, emoji, client.userId ?? client.sessionId ?? client.id)
    : removeReaction(messageId, emoji, client.userId ?? client.sessionId ?? client.id);
  broadcastToRoom(roomId, { type: 'MSG_REACTION', payload: { msgId: messageId, emoji, count } });
}

function broadcastToRoom(roomId: string, message: any) {
  for (const client of clients.values()) {
    if (client.rooms.has(roomId)) {
      client.ws.send(JSON.stringify(message));
    }
  }
}
