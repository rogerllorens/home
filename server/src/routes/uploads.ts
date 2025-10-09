import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ulid } from 'ulid';

const uploadSchema = z.object({
  type: z.enum(['image', 'video']),
  contentType: z.string(),
  sizeBytes: z.number().int().positive()
});

export async function uploadRoutes(app: FastifyInstance) {
  app.post('/uploads/sign', async (request, reply) => {
    const payload = uploadSchema.parse(request.body);
    const key = `${payload.type}/${ulid()}`;
    const uploadUrl = `https://media.sandbox.tuweb.com/upload/${key}`;
    const fileUrlSigned = `https://media.sandbox.tuweb.com/secure/${key}?token=${ulid()}`;
    reply.send({ uploadUrl, storageKey: key, fileUrlSigned, expiresIn: 300 });
  });
}
