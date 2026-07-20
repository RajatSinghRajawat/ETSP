import { buildApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { startSweeps, stopSweeps } from './jobs/sweeps.js';
import { logger } from './utils/logger.js';
import { seedLookups } from './utils/lookup.seed.js';
import { initSocket } from './socket/socket.js';

const app = await buildApp();

async function start() {
  try {
    await connectDatabase();
    await seedLookups();
    await connectRedis();

    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    // Attach Socket.IO to the underlying HTTP server once it is listening.
    initSocket(app.server);

    // Periodic job-expiry + subscription-lapse sweeps.
    startSweeps();
  } catch (error) {
    logger.error('Failed to start server', { message: error.message, stack: error.stack });
    process.exit(1);
  }
}

async function shutdown(signal) {
  logger.info(`${signal} received. Closing server.`);
  stopSweeps();
  await app.close();
  await disconnectRedis();
  await disconnectDatabase();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

await start();
