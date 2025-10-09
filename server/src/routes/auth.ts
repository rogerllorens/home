import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  createGuestSession,
  loginUser,
  registerUser,
  signAccessToken,
  signRefreshToken,
  upgradeGuestSession,
  refreshAccessToken
} from '../auth.js';
import { sendError, ApiHttpError } from '../utils.js';
import { upsertSession } from '../store.js';

const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email().optional(),
  password: z.string().min(8),
  ageConfirmed: z.boolean(),
  countryCode: z.string().min(2).max(3).optional(),
  languageTags: z.array(z.string()).optional(),
  referralCode: z.string().optional()
});

const loginSchema = z.object({
  usernameOrEmail: z.string(),
  password: z.string(),
  totp: z.string().optional()
});

const guestSchema = z.object({
  ageConfirmed: z.boolean(),
  countryCode: z.string().min(2).max(3).optional(),
  languageTags: z.array(z.string()).optional()
});

const upgradeSchema = z.object({
  sessionId: z.string(),
  username: z.string().min(3),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  countryCode: z.string().min(2).max(3).optional(),
  languageTags: z.array(z.string()).optional()
});

const refreshSchema = z.object({ refreshToken: z.string() });

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', async (request, reply) => {
    try {
      const payload = registerSchema.parse(request.body);
      const session = await registerUser(payload);
      const accessToken = signAccessToken(session);
      const refreshToken = signRefreshToken(session);
      reply
        .setCookie('accessToken', accessToken, { httpOnly: true, sameSite: 'lax', path: '/' })
        .setCookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'lax', path: '/' })
        .send({
          sessionId: session.id,
          scope: session.scope,
          username: payload.username,
          accessToken,
          refreshToken,
          ageConfirmed: session.ageConfirmed,
          countryCode: session.countryCode,
          languageTags: session.languageTags
        });
    } catch (error) {
      if (error instanceof ApiHttpError) {
        return sendError(reply, error);
      }
      if (error instanceof Error && error.message === 'USERNAME_TAKEN') {
        return sendError(reply, new ApiHttpError(400, 'USERNAME_TAKEN', 'El nombre de usuario ya está en uso'));
      }
      if (error instanceof Error && error.message === 'EMAIL_TAKEN') {
        return sendError(reply, new ApiHttpError(400, 'EMAIL_TAKEN', 'El email ya está registrado'));
      }
      return sendError(reply, error);
    }
  });

  app.post('/auth/login', async (request, reply) => {
    try {
      const payload = loginSchema.parse(request.body);
      const session = await loginUser(payload);
      const accessToken = signAccessToken(session);
      const refreshToken = signRefreshToken(session);
      reply
        .setCookie('accessToken', accessToken, { httpOnly: true, sameSite: 'lax', path: '/' })
        .setCookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'lax', path: '/' })
        .send({
          sessionId: session.id,
          scope: session.scope,
          username: payload.usernameOrEmail,
          accessToken,
          refreshToken,
          ageConfirmed: session.ageConfirmed,
          countryCode: session.countryCode,
          languageTags: session.languageTags
        });
    } catch (error) {
      if (error instanceof Error && error.message === 'INVALID_CREDENTIALS') {
        return sendError(reply, new ApiHttpError(401, 'INVALID_CREDENTIALS', 'Credenciales inválidas'));
      }
      return sendError(reply, error);
    }
  });

  app.post('/auth/guest', async (request, reply) => {
    try {
      const payload = guestSchema.parse(request.body);
      const session = createGuestSession(payload);
      const accessToken = signAccessToken(session);
      const refreshToken = signRefreshToken(session);
      reply
        .setCookie('accessToken', accessToken, { httpOnly: true, sameSite: 'lax', path: '/' })
        .setCookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'lax', path: '/' })
        .send({
          sessionId: session.id,
          accessToken,
          refreshToken,
          scope: session.scope,
          ageConfirmed: session.ageConfirmed,
          countryCode: session.countryCode,
          languageTags: session.languageTags
        });
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.post('/guest/upgrade', async (request, reply) => {
    try {
      const payload = upgradeSchema.parse(request.body);
      const session = upgradeGuestSession(payload.sessionId, payload);
      const accessToken = signAccessToken(session);
      const refreshToken = signRefreshToken(session);
      reply
        .setCookie('accessToken', accessToken, { httpOnly: true, sameSite: 'lax', path: '/' })
        .setCookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'lax', path: '/' })
        .send({
          sessionId: session.id,
          scope: session.scope,
          accessToken,
          refreshToken,
          ageConfirmed: session.ageConfirmed,
          countryCode: session.countryCode,
          languageTags: session.languageTags
        });
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.post('/auth/refresh', async (request, reply) => {
    try {
      const payload = refreshSchema.parse(request.body);
      const session = refreshAccessToken(payload.refreshToken);
      const accessToken = signAccessToken(session);
      reply
        .setCookie('accessToken', accessToken, { httpOnly: true, sameSite: 'lax', path: '/' })
        .send({
          sessionId: session.id,
          scope: session.scope,
          accessToken,
          ageConfirmed: session.ageConfirmed,
          countryCode: session.countryCode,
          languageTags: session.languageTags
        });
    } catch (error) {
      return sendError(reply, error);
    }
  });
}
