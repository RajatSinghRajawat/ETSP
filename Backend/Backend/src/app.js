import Fastify from 'fastify';
import { errorHandlerPlugin } from './plugins/error-handler.js';
import { securityPlugin } from './plugins/security.js';
import { uploadPlugin } from './plugins/upload.js';
import { apiRoutes } from './routes/index.js';
import { env } from './config/env.js';

export async function buildApp() {
  const app = Fastify({
    logger: env.NODE_ENV !== 'test',
  });

  await errorHandlerPlugin(app);
  await app.register(securityPlugin);
  await app.register(uploadPlugin);

  app.get('/', async () => ({
    success: true,
    message: 'ETS backend API',
  }));

  await app.register(apiRoutes, { prefix: '/api/v1' });

  return app;
}
