import { env } from './env.js';

const localOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

export const allowedOrigins = Array.from(
  new Set([
    ...env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean),
  ]),
);

const prodOriginPattern = /^https?:\/\/(.*\.)?(vetlinked\.(in|com)|vetslinked\.in)(:\d+)?$/;

/**
 * `frame-ancestors` list for statically served uploads, so the web app can
 * preview an uploaded PDF in an iframe while other sites still cannot frame it.
 * Mirrors the origins `isCorsOriginAllowed` accepts.
 */
export const frameAncestors = [
  "'self'",
  'http://localhost:*',
  'http://127.0.0.1:*',
  'https://*.vetlinked.in',
  'https://*.vetlinked.com',
  'https://*.vetslinked.in',
  'https://vetlinked.in',
  'https://vetlinked.com',
  'https://vetslinked.in',
  ...allowedOrigins.filter((origin) => origin !== '*'),
].join(' ');

export function isCorsOriginAllowed(origin) {
  if (!origin) {
    return true;
  }

  if (allowedOrigins.includes('*')) {
    return true;
  }

  if (localOriginPattern.test(origin) || prodOriginPattern.test(origin)) {
    return true;
  }

  return allowedOrigins.includes(origin);
}
