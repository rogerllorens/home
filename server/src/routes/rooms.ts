import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { RoomMessage } from '../types.js';
import {
  addRoomMessage,
  bootstrapRooms,
  getReactions,
  getRoom,
  getRoomMembers,
  joinRoom,
  leaveRoom,
  listRoomMessages,
  listRooms,
  recordReport,
  searchRoomMessages,
  setMessagePinned,
  setReaction,
  removeReaction,
  updateRoomConfig,
  upsertRoom
} from '../store.js';
import { ApiHttpError, sendError } from '../utils.js';
import { ulid } from 'ulid';

const roomCreateSchema = z.object({
  title: z.string().min(3),
  type: z.enum(['random', 'topic', 'trending']).default('topic'),
  tags: z.array(z.string()).default([]),
  rules: z.string().optional(),
  slowModeSeconds: z.number().int().min(0).default(3),
  isNSFW: z.boolean().default(false)
});

const historySchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  dir: z.enum(['forward', 'backward']).default('backward')
});

const reportSchema = z.object({
  roomId: z.string(),
  targetMsgId: z.string().optional(),
  targetUserId: z.string().optional(),
  reason: z.string().min(3),
  notes: z.string().optional()
});

const reactionSchema = z.object({
  msgId: z.string(),
  emoji: z.string().min(1).max(8)
});

const messageSendSchema = z.object({
  text: z.string().trim().min(1).max(1000),
  replyToId: z.string().optional()
});

const roomUpdateSchema = z.object({
  slowModeSeconds: z.number().int().min(0).optional(),
  rules: z.string().max(2000).optional()
});

function serializeRoomMessage(message: RoomMessage) {
  return {
    id: message.id,
    roomId: message.roomId,
    author: {
      id: message.authorId,
      username: message.authorId,
      displayName: message.authorId,
      role: 'member'
    },
    text: message.text,
    replyTo: message.replyTo,
    createdAt: new Date(message.createdAt).toISOString(),
    reactions: getReactions(message.id),
    pinned: message.pinned ?? false
  };
}

export async function roomsRoutes(app: FastifyInstance) {
  bootstrapRooms();

  app.get('/rooms', async (request, reply) => {
    const tab = (request.query as { tab?: string }).tab ?? 'trending';
    const topic = (request.query as { topic?: string }).topic;
    const rooms = listRooms().filter((room) => {
      if (tab === 'random') {
        return room.type === 'random';
      }
      if (tab === 'topics') {
        return room.type === 'topic';
      }
      if (tab === 'trending') {
        return room.type === 'trending';
      }
      return true;
    });
    reply.send({
      rooms: rooms.map((room) => ({
        id: room.id,
        title: room.title,
        tags: room.tags,
        type: room.type,
        slowMode: room.slowModeSeconds,
        shardKey: room.shardKey,
        isNSFW: room.isNSFW,
        participants: getRoomMembers(room.id).length,
        messagesPerMinute: Math.floor(Math.random() * 120)
      }))
    });
  });

  app.get('/rooms/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const room = getRoom(id);
      if (!room) {
        throw new ApiHttpError(404, 'ROOM_NOT_FOUND', 'Sala no encontrada');
      }
      reply.send({
        id: room.id,
        title: room.title,
        tags: room.tags,
        type: room.type,
        slowModeSeconds: room.slowModeSeconds,
        rules: room.rules,
        isNSFW: room.isNSFW,
        participants: getRoomMembers(room.id).length,
        messagesPerMinute: Math.floor(Math.random() * 120)
      });
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.post('/rooms', async (request, reply) => {
    try {
      const payload = roomCreateSchema.parse(request.body);
      const userId = request.headers['x-user-id'];
      if (!userId || typeof userId !== 'string') {
        throw new ApiHttpError(401, 'AUTH_REQUIRED', 'Se requiere autenticación');
      }
      const room = upsertRoom({
        createdBy: userId,
        title: payload.title,
        type: payload.type,
        tags: payload.tags,
        rules: payload.rules,
        slowModeSeconds: payload.slowModeSeconds,
        isNSFW: payload.isNSFW,
        shardKey: `shard-${Math.floor(Math.random() * 4)}`
      });
      reply.status(201).send({ room });
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.patch('/rooms/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const payload = roomUpdateSchema.parse(request.body);
      const updated = updateRoomConfig(id, payload);
      reply.send({
        id: updated.id,
        slowModeSeconds: updated.slowModeSeconds,
        rules: updated.rules,
        tags: updated.tags
      });
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.get('/rooms/:id/history', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const query = historySchema.parse(request.query);
      const messages = listRoomMessages(id, query.limit).map((message) => serializeRoomMessage(message));
      reply.send({ messages });
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.get('/rooms/:id/search', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const term = ((request.query as { q?: string }).q ?? '').toString();
      const messages = searchRoomMessages(id, term, MASSIVE_ROOM_MESSAGE_CACHE).map((message) => serializeRoomMessage(message));
      reply.send(messages);
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.post('/rooms/:id/messages', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const payload = messageSendSchema.parse(request.body);
      const authorId = (request.headers['x-user-id'] as string) ?? (request.headers['x-session-id'] as string) ?? 'anon';
      const message = addRoomMessage({
        roomId: id,
        authorId,
        text: payload.text,
        replyTo: payload.replyToId
      });
      const payloadMessage = serializeRoomMessage(message);
      reply.status(201).send({ ...payloadMessage, status: 'delivered' });
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.post('/rooms/:id/messages/:msgId/pin', async (request, reply) => {
    try {
      const { id, msgId } = request.params as { id: string; msgId: string };
      const pinned = z.boolean().parse((request.body as { pinned?: boolean })?.pinned ?? true);
      const message = setMessagePinned(id, msgId, pinned);
      if (!message) {
        throw new ApiHttpError(404, 'MESSAGE_NOT_FOUND', 'Mensaje no encontrado');
      }
      reply.send({ ...serializeRoomMessage(message), pinned: message.pinned ?? false });
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.post('/rooms/:id/report', async (request, reply) => {
    try {
      const payload = reportSchema.parse({ ...request.body, roomId: (request.params as { id: string }).id });
      const reporterId = request.headers['x-user-id'];
      if (!reporterId || typeof reporterId !== 'string') {
        throw new ApiHttpError(401, 'AUTH_REQUIRED', 'Se requiere autenticación');
      }
      recordReport({
        id: ulid(),
        roomId: payload.roomId,
        reporterId,
        targetMsgId: payload.targetMsgId,
        targetUserId: payload.targetUserId,
        reason: payload.reason,
        createdAt: Date.now()
      });
      reply.send({ status: 'ok' });
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.post('/rooms/:id/react', async (request, reply) => {
    try {
      const payload = reactionSchema.parse(request.body);
      const userId = request.headers['x-user-id'];
      if (!userId || typeof userId !== 'string') {
        throw new ApiHttpError(401, 'AUTH_REQUIRED', 'Se requiere autenticación');
      }
      const count = setReaction(payload.msgId, payload.emoji, userId);
      reply.send({ count });
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.delete('/rooms/:id/react', async (request, reply) => {
    try {
      const payload = reactionSchema.parse(request.body);
      const userId = request.headers['x-user-id'];
      if (!userId || typeof userId !== 'string') {
        throw new ApiHttpError(401, 'AUTH_REQUIRED', 'Se requiere autenticación');
      }
      const count = removeReaction(payload.msgId, payload.emoji, userId);
      reply.send({ count });
    } catch (error) {
      return sendError(reply, error);
    }
  });
}
