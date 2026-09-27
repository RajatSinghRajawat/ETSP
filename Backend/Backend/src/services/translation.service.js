import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { Translation } from '../models/translation.model.js';
import { AppError } from '../utils/app-error.js';
import { logger } from '../utils/logger.js';

export const SUPPORTED_TARGETS = ['hi'];

const GOOGLE_URL = 'https://translation.googleapis.com/language/translate/v2';
// Google accepts up to 128 segments per request.
const GOOGLE_BATCH = 100;
// Hot in-process layer in front of Mongo; capped so it cannot grow unbounded.
const MEMORY_LIMIT = 20000;
const memory = new Map();

const cacheKey = (target, text) =>
  crypto.createHash('sha256').update(`${target}:${text}`).digest('hex');

const remember = (key, value) => {
  if (memory.size >= MEMORY_LIMIT) {
    memory.delete(memory.keys().next().value);
  }
  memory.set(key, value);
};

async function callGoogle(texts, target) {
  const response = await fetch(`${GOOGLE_URL}?key=${encodeURIComponent(env.GOOGLE_TRANSLATE_API_KEY)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ q: texts, source: 'en', target, format: 'text' }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    logger.error(`Google Translate failed (${response.status}): ${detail.slice(0, 300)}`);
    throw new AppError('Translation service is unavailable right now', 502);
  }

  const payload = await response.json();
  return payload.data.translations.map((item) => item.translatedText);
}

/**
 * Translates a batch of English UI strings. Returns an array aligned with
 * `texts`; cached strings never reach Google.
 */
export async function translateTexts(texts, target) {
  if (!env.GOOGLE_TRANSLATE_API_KEY) {
    throw new AppError('Translation is not configured', 503);
  }

  const keys = texts.map((text) => cacheKey(target, text));
  const result = new Array(texts.length);
  const missing = [];

  keys.forEach((key, index) => {
    if (memory.has(key)) result[index] = memory.get(key);
    else missing.push(index);
  });

  if (missing.length) {
    const stored = await Translation.find({ key: { $in: missing.map((i) => keys[i]) } }).lean();
    const byKey = new Map(stored.map((row) => [row.key, row.translated]));
    for (let n = missing.length - 1; n >= 0; n -= 1) {
      const index = missing[n];
      const hit = byKey.get(keys[index]);
      if (hit !== undefined) {
        result[index] = hit;
        remember(keys[index], hit);
        missing.splice(n, 1);
      }
    }
  }

  // Same string repeated inside one request is only sent once.
  const uniqueMissing = [...new Set(missing.map((i) => texts[i]))];
  for (let start = 0; start < uniqueMissing.length; start += GOOGLE_BATCH) {
    const chunk = uniqueMissing.slice(start, start + GOOGLE_BATCH);
    const translated = await callGoogle(chunk, target);
    const docs = chunk.map((text, i) => ({
      key: cacheKey(target, text),
      target,
      source: text,
      translated: translated[i] ?? text,
    }));
    docs.forEach((doc) => remember(doc.key, doc.translated));
    await Translation.bulkWrite(
      docs.map((doc) => ({
        updateOne: { filter: { key: doc.key }, update: { $setOnInsert: doc }, upsert: true },
      })),
      { ordered: false },
    ).catch((error) => logger.warn(`Translation cache write failed: ${error.message}`));
  }

  missing.forEach((index) => {
    result[index] = memory.get(keys[index]) ?? texts[index];
  });

  return result;
}
