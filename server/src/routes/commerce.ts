import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ulid } from 'ulid';
import {
  applyWalletDelta,
  getUserByUsername,
  getWallet,
  recordDirectTransfer,
  recordWalletTx
} from '../store.js';
import { ApiHttpError, sendError, formatEurosFromTokens } from '../utils.js';

const giftSchema = z.object({
  giftId: z.string(),
  tokens: z.number().int().positive(),
  targetUserId: z.string().optional(),
  roomId: z.string().optional(),
  postId: z.string().optional()
});

const transferSchema = z.object({
  toUser: z.string(),
  amount: z.number().int().positive(),
  roomId: z.string().optional()
});

export async function commerceRoutes(app: FastifyInstance) {
  app.post('/gifts/send', async (request, reply) => {
    try {
      const payload = giftSchema.parse(request.body);
      const sessionId = request.headers['x-session'];
      if (!sessionId || typeof sessionId !== 'string') {
        throw new ApiHttpError(401, 'SESSION_REQUIRED', 'Sesion requerida');
      }
      const wallet = getWallet({ type: 'session', id: sessionId });
      if (wallet.balance < payload.tokens) {
        throw new ApiHttpError(402, 'INSUFFICIENT_FUNDS', 'Saldo insuficiente');
      }
      applyWalletDelta({ type: 'session', id: sessionId }, -payload.tokens);
      recordWalletTx({
        ownerType: 'session',
        ownerId: sessionId,
        type: 'SPEND',
        amount: payload.tokens,
        concept: `Regalo ${payload.giftId}`,
        metadata: { roomId: payload.roomId, postId: payload.postId, target: payload.targetUserId }
      });
      reply.send({ balance: getWallet({ type: 'session', id: sessionId }).balance });
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.post('/tokens/transfer', async (request, reply) => {
    try {
      const payload = transferSchema.parse(request.body);
      const sessionId = request.headers['x-session'];
      if (!sessionId || typeof sessionId !== 'string') {
        throw new ApiHttpError(401, 'SESSION_REQUIRED', 'Sesion requerida');
      }
      const recipient = getUserByUsername(payload.toUser);
      if (!recipient) {
        throw new ApiHttpError(404, 'USER_NOT_FOUND', 'Usuario destino no encontrado');
      }
      const wallet = getWallet({ type: 'session', id: sessionId });
      if (wallet.balance < payload.amount) {
        throw new ApiHttpError(402, 'INSUFFICIENT_FUNDS', 'Saldo insuficiente');
      }
      applyWalletDelta({ type: 'session', id: sessionId }, -payload.amount);
      recordWalletTx({
        ownerType: 'session',
        ownerId: sessionId,
        type: 'TRANSFER_OUT',
        amount: payload.amount,
        concept: `Transferencia a ${payload.toUser}`,
        metadata: { roomId: payload.roomId }
      });
      applyWalletDelta({ type: 'user', id: recipient.id }, payload.amount);
      recordWalletTx({
        ownerType: 'user',
        ownerId: recipient.id,
        type: 'TRANSFER_IN',
        amount: payload.amount,
        concept: `Transferencia recibida de sesión ${sessionId}`,
        metadata: { roomId: payload.roomId }
      });
      recordDirectTransfer({
        id: ulid(),
        fromId: sessionId,
        toId: recipient.id,
        amount: payload.amount,
        createdAt: Date.now(),
        eurAtTx: formatEurosFromTokens(payload.amount),
        roomId: payload.roomId
      });
      reply.send({ balance: getWallet({ type: 'session', id: sessionId }).balance });
    } catch (error) {
      return sendError(reply, error);
    }
  });
}
