import { FastifyReply } from 'fastify';

export class ApiHttpError extends Error {
  statusCode: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(statusCode: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function sendError(reply: FastifyReply, error: unknown) {
  if (error instanceof ApiHttpError) {
    return reply.status(error.statusCode).send({ error: { code: error.code, message: error.message, details: error.details } });
  }
  if (error instanceof Error) {
    return reply.status(500).send({ error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
  return reply.status(500).send({ error: { code: 'INTERNAL_ERROR', message: 'Error inesperado' } });
}

export function formatEurosFromTokens(tokens: number, ratio = 100): number {
  return Math.round((tokens / ratio) * 100) / 100;
}

export function nowIso() {
  return new Date().toISOString();
}
