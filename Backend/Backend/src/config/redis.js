import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: null,
});

redis.on('error', (error) => {
  logger.error('Redis error', { message: error.message });
});

export async function connectRedis() {
  try {
    if (redis.status === 'wait') {
      await redis.connect();
    }

    logger.info('Redis connected');
  } catch (error) {
    logger.warn('Redis unavailable. Continuing without Redis features.', {
      message: error.message,
    });
  }
}

export async function disconnectRedis() {
  if (redis.status !== 'end') {
    await redis.quit();
  }
}
