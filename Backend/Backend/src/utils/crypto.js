import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { AppError } from './app-error.js';

const VERSION = 'v1';
const IV_LENGTH = 12;

// Always derive a 32-byte key so any SETTINGS_ENCRYPTION_KEY length works.
const key = crypto.createHash('sha256').update(env.SETTINGS_ENCRYPTION_KEY).digest();

export function encryptSecret(plaintext) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [VERSION, iv.toString('base64'), tag.toString('base64'), ciphertext.toString('base64')].join(':');
}

export function decryptSecret(payload) {
  const parts = String(payload ?? '').split(':');

  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new AppError('Stored secret has an invalid format', 500);
  }

  try {
    const [, ivB64, tagB64, ciphertextB64] = parts;
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertextB64, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    throw new AppError('Stored secret could not be decrypted', 500);
  }
}

export function isEncryptedSecret(value) {
  return typeof value === 'string' && value.startsWith(`${VERSION}:`);
}

export function maskSecret(value) {
  const text = String(value ?? '');
  if (!text) return '';
  return `••••${text.slice(-4)}`;
}
