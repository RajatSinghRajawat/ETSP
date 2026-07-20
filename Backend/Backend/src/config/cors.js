import { env } from './env.js';

const localOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

export const allowedOrigins = Array.from(
  new Set([
    ...env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean),
  ]),
);

export function isCorsOriginAllowed(origin) {
  if (!origin) {
    return true;
  }

  if (allowedOrigins.includes('*')) {
    return true;
  }

  if (localOriginPattern.test(origin)) {
    return true;
  }

  return allowedOrigins.includes(origin);
}
