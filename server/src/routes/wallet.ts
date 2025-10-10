import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  applyWalletDelta,
  createCheckout,
  finalizeCheckout,
  getSession,
  getTokenPacks,
  getWallet,
  getWalletHistory,
  recordWalletTx
} from '../store.js';
import { ApiHttpError, sendError, formatEurosFromTokens } from '../utils.js';
import { WalletOwner } from '../types.js';

const purchaseSchema = z.object({ packId: z.string(), provider: z.string().default('sandbox') });

const webhookSchema = z.object({
  provider_ref: z.string(),
  order_id: z.string(),
  pack_id: z.string(),
  status: z.enum(['approved', 'declined'])
});

export async function walletRoutes(app: FastifyInstance) {
  app.get('/wallet/packs', async (_, reply) => {
    reply.send({ packs: getTokenPacks() });
  });

  app.get('/wallet', async (request, reply) => {
    try {
      const owner = getWalletOwnerFromRequest(request);
      const wallet = getWallet(owner);
      reply.send({
        balance: wallet.balance,
        pending: wallet.pending,
        available: wallet.available,
        dailyLimit: wallet.dailyLimit,
        monthlyLimit: wallet.monthlyLimit,
        spentToday: wallet.spentToday,
        spentMonth: wallet.spentMonth,
        purchasesSuspended: wallet.purchasesSuspended,
        preferredCurrency: 'EUR'
      });
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.get('/wallet/history', async (request, reply) => {
    try {
      const owner = getWalletOwnerFromRequest(request);
      reply.send({ items: getWalletHistory(owner) });
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.post('/wallet/purchase', async (request, reply) => {
    try {
      const owner = getWalletOwnerFromRequest(request);
      const payload = purchaseSchema.parse(request.body);
      const order = createCheckout(owner, payload.packId, payload.provider);
      const pack = getTokenPacks().find((candidate) => candidate.id === payload.packId);
      const amountEuros = pack ? pack.priceEuros : 0;
      reply.send({
        checkoutUrl: `https://payments.sandbox.tuweb.com/checkout/${order.id}`,
        orderId: order.id,
        amountEuros
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'PACK_NOT_FOUND') {
        return sendError(reply, new ApiHttpError(404, 'PACK_NOT_FOUND', 'Pack no disponible'));
      }
      return sendError(reply, error);
    }
  });

  app.post('/wallet/webhook', async (request, reply) => {
    try {
      const payload = webhookSchema.parse(request.body);
      const order = finalizeCheckout(payload.order_id, payload.provider_ref, payload.status === 'approved');
      reply.send({ status: order.status });
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.post('/wallet/spend', async (request, reply) => {
    try {
      const owner = getWalletOwnerFromRequest(request);
      const payload = z
        .object({ amount: z.number().int().positive(), concept: z.string(), ref: z.string().optional() })
        .parse(request.body);
      const wallet = getWallet(owner);
      if (wallet.purchasesSuspended) {
        throw new ApiHttpError(403, 'PURCHASES_SUSPENDED', 'Las compras están suspendidas');
      }
      if (wallet.balance < payload.amount) {
        throw new ApiHttpError(402, 'INSUFFICIENT_FUNDS', 'Saldo insuficiente');
      }
      applyWalletDelta(owner, -payload.amount);
      recordWalletTx({ ownerType: owner.type, ownerId: owner.id, type: 'SPEND', amount: payload.amount, concept: payload.concept, ref: payload.ref });
      reply.send({ balance: getWallet(owner).balance, eurApprox: formatEurosFromTokens(payload.amount) });
    } catch (error) {
      return sendError(reply, error);
    }
  });
}

function getWalletOwnerFromRequest(request: any): WalletOwner {
  const sessionId = request.cookies?.refreshTokenSessionId ?? request.headers['x-session-id'] ?? request.headers['x-session'] ?? request.headers['x-session-id'];
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Session ')) {
    const [, value] = authHeader.split(' ');
    return { type: 'session', id: value };
  }
  if (authHeader?.startsWith('User ')) {
    const [, value] = authHeader.split(' ');
    return { type: 'user', id: value };
  }
  if (typeof sessionId === 'string' && sessionId.length > 0) {
    return { type: 'session', id: sessionId };
  }
  throw new ApiHttpError(401, 'SESSION_REQUIRED', 'Se requiere sesión para consultar la wallet');
}
