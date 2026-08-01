import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let lastLoggedErrorTime = 0;

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
  retryStrategy(times) {
    if (times > 3) {
      return null; // Stop retrying when Redis is unavailable
    }
    return Math.min(times * 500, 2000);
  },
});

redis.on('error', (error) => {
  const now = Date.now();
  if (now - lastLoggedErrorTime > 30000) {
    lastLoggedErrorTime = now;
    logger.error('Redis error', { message: error.message });
  }
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
