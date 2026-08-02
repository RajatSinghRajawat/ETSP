import { Setting } from '../models/setting.model.js';
import { env } from '../config/env.js';
import { decryptSecret, encryptSecret, isEncryptedSecret, maskSecret } from '../utils/crypto.js';
import { logger } from '../utils/logger.js';
import { resetStripeClient } from './stripe.service.js';
import {
  DEFAULT_LOCALE_EN,
  DEFAULT_LOCALE_HI,
  DEFAULT_SOCIAL,
  LOCALE_SECTION_KEYS,
} from '../constants/site-content.defaults.js';

const STRIPE_KEY = 'stripe';
const EMAIL_KEY = 'email';
const MSG91_KEY = 'msg91';
const SITE_CONTENT_KEY = 'site-content';

// Listeners so dependent services (mailer, sms) can drop cached clients when
// the admin saves new settings. Registered lazily to avoid import cycles.
const changeListeners = new Map();

export function onSettingsChange(key, listener) {
  changeListeners.set(key, listener);
}

function notifyChange(key) {
  changeListeners.get(key)?.();
}

/**
 * Decrypt a stored secret. Returns '' for empty input.
 * Throws AppError when the ciphertext is corrupt or the encryption key changed.
 */
const readSecret = (value) => {
  if (!value) return '';
  return isEncryptedSecret(value) ? decryptSecret(value) : value;
};

/**
 * Like readSecret, but never throws — used by admin masked views / toggles so a
 * stale SETTINGS_ENCRYPTION_KEY cannot 500 the whole settings page.
 * Returns { ok, value } where ok=false means the secret must be re-entered.
 */
const tryReadSecret = (value) => {
  if (!value) return { ok: true, value: '' };
  try {
    return { ok: true, value: readSecret(value) };
  } catch (error) {
    logger.warn('Stored settings secret could not be decrypted — re-enter the key in admin Settings', {
      message: error?.message,
    });
    return { ok: false, value: '' };
  }
};

async function getSettingValue(key) {
  const setting = await Setting.findOne({ key }).lean();
  return setting?.value ?? null;
}

async function upsertSettingValue(key, value) {
  await Setting.findOneAndUpdate({ key }, { $set: { value } }, { upsert: true, new: true });
}

/* ------------------------------ Stripe ------------------------------ */

// Short in-memory cache so every entitlement check doesn't re-read Mongo.
let subscriptionsEnabledCache = { value: null, expiresAt: 0 };
const SUBSCRIPTIONS_ENABLED_TTL_MS = 15_000;

function invalidateSubscriptionsEnabledCache() {
  subscriptionsEnabledCache = { value: null, expiresAt: 0 };
}

/**
 * When false, plan gating and Stripe checkouts are off — the whole product
 * runs as open access. Defaults to ON (true) until an admin turns it off.
 */
export async function isSubscriptionsEnabled() {
  const now = Date.now();
  if (subscriptionsEnabledCache.value !== null && now < subscriptionsEnabledCache.expiresAt) {
    return subscriptionsEnabledCache.value;
  }

  const value = await getSettingValue(STRIPE_KEY);
  const enabled = value?.subscriptionsEnabled !== false;
  subscriptionsEnabledCache = { value: enabled, expiresAt: now + SUBSCRIPTIONS_ENABLED_TTL_MS };
  return enabled;
}

/**
 * Decrypted Stripe settings for server-side use only.
 * Returns null when Stripe has not been configured yet (or secrets cannot be
 * decrypted — treat as unconfigured until the admin re-saves keys).
 */
export async function getStripeSettings() {
  const value = await getSettingValue(STRIPE_KEY);

  const secretResult = value?.secretKey
    ? tryReadSecret(value.secretKey)
    : { ok: true, value: process.env.STRIPE_SECRET_KEY || '' };
  const webhookResult = value?.webhookSecret
    ? tryReadSecret(value.webhookSecret)
    : { ok: true, value: process.env.STRIPE_WEBHOOK_SECRET || '' };

  // Corrupt ciphertext → fall back to env, otherwise treat as missing.
  const secretKey = secretResult.ok
    ? secretResult.value
    : (process.env.STRIPE_SECRET_KEY || '');
  const publishableKey = value?.publishableKey || process.env.STRIPE_PUBLISHABLE_KEY || '';
  const webhookSecret = webhookResult.ok
    ? webhookResult.value
    : (process.env.STRIPE_WEBHOOK_SECRET || '');

  if (!secretKey) {
    return null;
  }

  return {
    secretKey,
    publishableKey,
    webhookSecret,
    subscriptionsEnabled: value?.subscriptionsEnabled !== false,
  };
}

/** Masked view for the admin UI — never exposes decrypted secrets. */
export async function getStripeSettingsMasked() {
  const value = await getSettingValue(STRIPE_KEY);
  const subscriptionsEnabled = value?.subscriptionsEnabled !== false;

  const secretResult = value?.secretKey ? tryReadSecret(value.secretKey) : { ok: true, value: '' };
  const webhookResult = value?.webhookSecret ? tryReadSecret(value.webhookSecret) : { ok: true, value: '' };
  const envFallback = Boolean(process.env.STRIPE_SECRET_KEY);

  // Prefer decrypted DB key; otherwise env; otherwise mark unconfigured.
  const plaintextSecret = secretResult.ok && secretResult.value
    ? secretResult.value
    : (process.env.STRIPE_SECRET_KEY || '');
  const decryptFailed = Boolean(value?.secretKey) && !secretResult.ok && !envFallback;

  if (!plaintextSecret) {
    return {
      configured: false,
      publishableKey: value?.publishableKey || '',
      secretKeyMasked: decryptFailed ? '•••• (re-enter — encryption key mismatch)' : '',
      webhookSecretSet: Boolean(value?.webhookSecret) || Boolean(process.env.STRIPE_WEBHOOK_SECRET),
      subscriptionsEnabled,
      keysNeedReentry: decryptFailed,
    };
  }

  return {
    configured: true,
    publishableKey: value?.publishableKey || process.env.STRIPE_PUBLISHABLE_KEY || '',
    secretKeyMasked: maskSecret(plaintextSecret),
    webhookSecretSet: Boolean(webhookResult.value || process.env.STRIPE_WEBHOOK_SECRET || value?.webhookSecret),
    subscriptionsEnabled,
    keysNeedReentry: Boolean(value?.secretKey) && !secretResult.ok,
  };
}

/**
 * Upsert Stripe settings. Omitted/blank fields keep their existing values so
 * the admin can rotate one key without re-entering the others.
 *
 * When a new secretKey is saved, any previously corrupt ciphertext is replaced
 * with a fresh encryption under the current SETTINGS_ENCRYPTION_KEY.
 */
export async function updateStripeSettings({ secretKey, publishableKey, webhookSecret, subscriptionsEnabled }) {
  const existing = await getSettingValue(STRIPE_KEY);
  const value = { ...(existing ?? {}) };

  if (secretKey) value.secretKey = encryptSecret(secretKey);
  if (publishableKey) value.publishableKey = publishableKey;
  if (webhookSecret) value.webhookSecret = encryptSecret(webhookSecret);
  if (subscriptionsEnabled !== undefined) value.subscriptionsEnabled = subscriptionsEnabled;

  await upsertSettingValue(STRIPE_KEY, value);

  resetStripeClient();
  invalidateSubscriptionsEnabledCache();

  return getStripeSettingsMasked();
}

/* ---------------------------- Email (SMTP) ---------------------------- */

/**
 * Effective SMTP settings: admin-saved values from the DB, falling back to
 * the .env values so a fresh install keeps working. `enabled` defaults to
 * true until the admin explicitly turns the service off.
 */
export async function getEmailSettings() {
  const value = await getSettingValue(EMAIL_KEY);
  const passResult = value?.pass ? tryReadSecret(value.pass) : { ok: true, value: '' };

  return {
    enabled: value?.enabled !== false,
    host: value?.host || env.SMTP_HOST,
    port: Number(value?.port || env.SMTP_PORT),
    user: value?.user || env.SMTP_USER,
    pass: passResult.ok && passResult.value ? passResult.value : env.SMTP_PASS,
    from: value?.from || env.SMTP_FROM,
  };
}

export async function getEmailSettingsMasked() {
  const settings = await getEmailSettings();

  return {
    enabled: settings.enabled,
    host: settings.host,
    port: settings.port,
    user: settings.user,
    passMasked: maskSecret(settings.pass),
    from: settings.from,
  };
}

export async function updateEmailSettings({ enabled, host, port, user, pass, from }) {
  const existing = await getSettingValue(EMAIL_KEY);
  const value = { ...(existing ?? {}) };

  if (enabled !== undefined) value.enabled = enabled;
  if (host) value.host = host;
  if (port) value.port = port;
  if (user) value.user = user;
  if (pass) value.pass = encryptSecret(pass);
  if (from) value.from = from;

  await upsertSettingValue(EMAIL_KEY, value);

  notifyChange(EMAIL_KEY);

  return getEmailSettingsMasked();
}

/* ---------------------------- SMS (MSG91) ---------------------------- */

/** MSG91 settings — fallback to .env when not set in DB. */
export async function getMsg91Settings() {
  const value = await getSettingValue(MSG91_KEY);
  const authResult = value?.authKey ? tryReadSecret(value.authKey) : { ok: true, value: '' };

  return {
    enabled: value?.enabled === true || Boolean(process.env.MSG91_AUTH_KEY),
    authKey: authResult.ok && authResult.value ? authResult.value : (process.env.MSG91_AUTH_KEY || ''),
    senderId: value?.senderId || process.env.MSG91_SENDER_ID || '',
    templateId: value?.templateId || process.env.MSG91_TEMPLATE_ID || '',
  };
}

export async function getMsg91SettingsMasked() {
  const settings = await getMsg91Settings();

  return {
    enabled: settings.enabled,
    configured: Boolean(settings.authKey && settings.templateId),
    authKeyMasked: maskSecret(settings.authKey),
    senderId: settings.senderId,
    templateId: settings.templateId,
  };
}

export async function updateMsg91Settings({ enabled, authKey, senderId, templateId }) {
  const existing = await getSettingValue(MSG91_KEY);
  const value = { ...(existing ?? {}) };

  if (enabled !== undefined) value.enabled = enabled;
  if (authKey) value.authKey = encryptSecret(authKey);
  if (senderId) value.senderId = senderId;
  if (templateId) value.templateId = templateId;

  await upsertSettingValue(MSG91_KEY, value);

  notifyChange(MSG91_KEY);

  return getMsg91SettingsMasked();
}

/* -------------------------- Public site content -------------------------- */

function mergeLegalPage(defaults, stored) {
  const value = stored ?? {};
  return {
    ...defaults,
    ...value,
    sections: Array.isArray(value.sections) ? value.sections : defaults.sections,
  };
}

function mergeLocaleContent(defaults, stored) {
  const value = stored ?? {};
  return {
    contact: { ...defaults.contact, ...(value.contact ?? {}) },
    about: {
      ...defaults.about,
      ...(value.about ?? {}),
      stats: Array.isArray(value.about?.stats) ? value.about.stats : defaults.about.stats,
      missionBody: Array.isArray(value.about?.missionBody)
        ? value.about.missionBody
        : defaults.about.missionBody,
      values: Array.isArray(value.about?.values) ? value.about.values : defaults.about.values,
      milestones: Array.isArray(value.about?.milestones)
        ? value.about.milestones
        : defaults.about.milestones,
      team: Array.isArray(value.about?.team) ? value.about.team : defaults.about.team,
    },
    hero: { ...defaults.hero, ...(value.hero ?? {}) },
    jobProfiles: {
      ...defaults.jobProfiles,
      ...(value.jobProfiles ?? {}),
      items: Array.isArray(value.jobProfiles?.items)
        ? value.jobProfiles.items
        : defaults.jobProfiles.items,
    },
    privacy: mergeLegalPage(defaults.privacy, value.privacy),
    terms: mergeLegalPage(defaults.terms, value.terms),
    cookies: mergeLegalPage(defaults.cookies, value.cookies),
  };
}

/** Older saves stored sections at the root; migrate them into `en`. */
function normalizeStoredSiteContent(stored) {
  if (!stored || typeof stored !== 'object') {
    return { social: {}, en: {}, hi: {} };
  }

  const hasLocales = stored.en != null || stored.hi != null;
  if (hasLocales) {
    return {
      social: stored.social ?? {},
      en: stored.en ?? {},
      hi: stored.hi ?? {},
    };
  }

  const { social, ...legacySections } = stored;
  return {
    social: social ?? {},
    en: legacySections,
    hi: {},
  };
}

function mergeSiteContent(stored) {
  const normalized = normalizeStoredSiteContent(stored);

  return {
    social: { ...DEFAULT_SOCIAL, ...(normalized.social ?? {}) },
    en: mergeLocaleContent(DEFAULT_LOCALE_EN, normalized.en),
    hi: mergeLocaleContent(DEFAULT_LOCALE_HI, normalized.hi),
  };
}

function patchLocale(current, patch) {
  if (!patch || typeof patch !== 'object') return current;

  return {
    contact: { ...current.contact, ...(patch.contact ?? {}) },
    about: {
      ...current.about,
      ...(patch.about ?? {}),
      stats: Array.isArray(patch.about?.stats) ? patch.about.stats : current.about.stats,
      missionBody: Array.isArray(patch.about?.missionBody)
        ? patch.about.missionBody
        : current.about.missionBody,
      values: Array.isArray(patch.about?.values) ? patch.about.values : current.about.values,
      milestones: Array.isArray(patch.about?.milestones)
        ? patch.about.milestones
        : current.about.milestones,
      team: Array.isArray(patch.about?.team) ? patch.about.team : current.about.team,
    },
    hero: { ...current.hero, ...(patch.hero ?? {}) },
    jobProfiles: {
      ...current.jobProfiles,
      ...(patch.jobProfiles ?? {}),
      items: Array.isArray(patch.jobProfiles?.items)
        ? patch.jobProfiles.items
        : current.jobProfiles.items,
    },
    privacy: {
      ...current.privacy,
      ...(patch.privacy ?? {}),
      sections: Array.isArray(patch.privacy?.sections)
        ? patch.privacy.sections
        : current.privacy.sections,
    },
    terms: {
      ...current.terms,
      ...(patch.terms ?? {}),
      sections: Array.isArray(patch.terms?.sections) ? patch.terms.sections : current.terms.sections,
    },
    cookies: {
      ...current.cookies,
      ...(patch.cookies ?? {}),
      sections: Array.isArray(patch.cookies?.sections)
        ? patch.cookies.sections
        : current.cookies.sections,
    },
  };
}

function extractLocalePatches(input) {
  const social = input.social;
  let enPatch = input.en ?? null;
  let hiPatch = input.hi ?? null;

  const sectionKeys = [
    'contact',
    'about',
    'hero',
    'jobProfiles',
    'privacy',
    'terms',
    'cookies',
  ];
  const flatSections = {};
  for (const key of sectionKeys) {
    if (input[key] != null) flatSections[key] = input[key];
  }
  const hasFlat = Object.keys(flatSections).length > 0;

  if (input.lang === 'hi') {
    hiPatch = { ...(hiPatch ?? {}), ...flatSections };
  } else if (input.lang === 'en' || hasFlat) {
    // Flat section payloads (and explicit lang=en) write to English.
    enPatch = { ...(enPatch ?? {}), ...flatSections };
  }

  return { social, enPatch, hiPatch };
}

export async function getSiteContent() {
  return mergeSiteContent(await getSettingValue(SITE_CONTENT_KEY));
}

/**
 * Accepts bilingual payloads `{ social, en, hi }`, locale-scoped
 * `{ lang: 'hi', hero: {...} }`, or legacy flat `{ hero, contact, ... }` (→ en).
 */
export async function updateSiteContent(input) {
  const current = await getSiteContent();
  const { social, enPatch, hiPatch } = extractLocalePatches(input ?? {});

  const value = {
    social: { ...current.social, ...(social ?? {}) },
    en: patchLocale(current.en, enPatch),
    hi: patchLocale(current.hi, hiPatch),
  };

  await upsertSettingValue(SITE_CONTENT_KEY, value);

  return mergeSiteContent(value);
}

export { LOCALE_SECTION_KEYS };
