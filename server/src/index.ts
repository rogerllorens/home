import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import formbody from '@fastify/formbody';
import rateLimit from '@fastify/rate-limit';
import { authRoutes } from './routes/auth.js';
import { walletRoutes } from './routes/wallet.js';
import { roomsRoutes } from './routes/rooms.js';
import { uploadRoutes } from './routes/uploads.js';
import { commerceRoutes } from './routes/commerce.js';
import { setupSignal } from './signal.js';
import { ALLOWED_ORIGINS, PORT } from './config.js';
import { bootstrapRooms } from './store.js';

async function buildServer() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: ALLOWED_ORIGINS, credentials: true });
  await app.register(cookie);
  await app.register(formbody);
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

  await authRoutes(app);
  await walletRoutes(app);
  await roomsRoutes(app);
  await uploadRoutes(app);
  await commerceRoutes(app);
  await setupSignal(app);

  app.get('/health', async () => ({ status: 'ok' }));

  bootstrapRooms();

  return app;
}

buildServer()
  .then((app) => app.listen({ port: PORT, host: '0.0.0.0' }))
  .then(() => {
    console.log(`API server listening on ${PORT}`);
  })
  .catch((error) => {
    console.error('Failed to start server', error);
    process.exit(1);
  });
