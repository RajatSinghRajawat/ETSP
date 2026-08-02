import { Setting } from '../models/setting.model.js';
import { env } from '../config/env.js';
import { decryptSecret, encryptSecret, isEncryptedSecret, maskSecret } from '../utils/crypto.js';
import { resetStripeClient } from './stripe.service.js';

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

const readSecret = (value) => {
  if (!value) return '';
  return isEncryptedSecret(value) ? decryptSecret(value) : value;
};

async function getSettingValue(key) {
  const setting = await Setting.findOne({ key }).lean();
  return setting?.value ?? null;
}

async function upsertSettingValue(key, value) {
  await Setting.findOneAndUpdate({ key }, { $set: { value } }, { upsert: true, new: true });
}

/* ------------------------------ Stripe ------------------------------ */

/**
 * Decrypted Stripe settings for server-side use only.
 * Returns null when Stripe has not been configured yet.
 */
export async function getStripeSettings() {
  const value = await getSettingValue(STRIPE_KEY);

  const secretKey = value?.secretKey ? readSecret(value.secretKey) : (process.env.STRIPE_SECRET_KEY || '');
  const publishableKey = value?.publishableKey || process.env.STRIPE_PUBLISHABLE_KEY || '';
  const webhookSecret = value?.webhookSecret ? readSecret(value.webhookSecret) : (process.env.STRIPE_WEBHOOK_SECRET || '');

  if (!secretKey) {
    return null;
  }

  return {
    secretKey,
    publishableKey,
    webhookSecret,
  };
}

/** Masked view for the admin UI — never exposes decrypted secrets. */
export async function getStripeSettingsMasked() {
  const settings = await getStripeSettings();

  if (!settings) {
    return {
      configured: false,
      publishableKey: '',
      secretKeyMasked: '',
      webhookSecretSet: false,
    };
  }

  return {
    configured: true,
    publishableKey: settings.publishableKey,
    secretKeyMasked: maskSecret(settings.secretKey),
    webhookSecretSet: Boolean(settings.webhookSecret),
  };
}

/**
 * Upsert Stripe settings. Omitted/blank fields keep their existing values so
 * the admin can rotate one key without re-entering the others.
 */
export async function updateStripeSettings({ secretKey, publishableKey, webhookSecret }) {
  const existing = await getSettingValue(STRIPE_KEY);
  const value = { ...(existing ?? {}) };

  if (secretKey) value.secretKey = encryptSecret(secretKey);
  if (publishableKey) value.publishableKey = publishableKey;
  if (webhookSecret) value.webhookSecret = encryptSecret(webhookSecret);

  await upsertSettingValue(STRIPE_KEY, value);

  resetStripeClient();

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

  return {
    enabled: value?.enabled !== false,
    host: value?.host || env.SMTP_HOST,
    port: Number(value?.port || env.SMTP_PORT),
    user: value?.user || env.SMTP_USER,
    pass: value?.pass ? readSecret(value.pass) : env.SMTP_PASS,
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

  const authKey = value?.authKey ? readSecret(value.authKey) : (process.env.MSG91_AUTH_KEY || '');

  return {
    enabled: value?.enabled === true || Boolean(process.env.MSG91_AUTH_KEY),
    authKey,
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

/**
 * Marketing copy the admin can edit without a redeploy: contact details, the
 * social links in the footer, and the About page text. These are read by the
 * public site, so nothing here is secret and none of it is encrypted.
 *
 * The defaults mirror what used to be hardcoded in the frontend, so a fresh
 * install still renders the same pages before an admin touches anything.
 */
export const DEFAULT_SITE_CONTENT = {
  contact: {
    email: 'support@vetjobs.com',
    phone: '+91 123 456 7890',
    address: 'Mumbai, Maharashtra, India',
    workingHours: 'Mon - Sat, 9:00 AM - 6:00 PM',
  },
  social: {
    facebook: '',
    twitter: '',
    linkedin: '',
    instagram: '',
  },
  about: {
    heroTitle: 'About VetJobs',
    heroSubtitle: "India's most trusted veterinary recruitment platform",
    storyTitle: 'Our Story',
    storyBody:
      'We started with a simple goal: make it easier for veterinary professionals to find work they love, and for clinics to find people they can trust.',
    stats: [
      { value: '10,000+', label: 'Active Professionals' },
      { value: '5,000+', label: 'Jobs Posted' },
      { value: '2,000+', label: 'Partner Clinics' },
      { value: '98%', label: 'Satisfaction Rate' },
    ],
  },
};

/** Merge stored values over the defaults so a partial save never blanks a page. */
function mergeSiteContent(stored) {
  const value = stored ?? {};

  return {
    contact: { ...DEFAULT_SITE_CONTENT.contact, ...(value.contact ?? {}) },
    social: { ...DEFAULT_SITE_CONTENT.social, ...(value.social ?? {}) },
    about: {
      ...DEFAULT_SITE_CONTENT.about,
      ...(value.about ?? {}),
      // An explicitly saved empty list is respected; a missing one falls back.
      stats: Array.isArray(value.about?.stats)
        ? value.about.stats
        : DEFAULT_SITE_CONTENT.about.stats,
    },
  };
}

export async function getSiteContent() {
  return mergeSiteContent(await getSettingValue(SITE_CONTENT_KEY));
}

export async function updateSiteContent(input) {
  const current = await getSiteContent();

  const value = {
    contact: { ...current.contact, ...(input.contact ?? {}) },
    social: { ...current.social, ...(input.social ?? {}) },
    about: { ...current.about, ...(input.about ?? {}) },
  };

  await upsertSettingValue(SITE_CONTENT_KEY, value);

  return mergeSiteContent(value);
}
