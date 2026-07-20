import { Setting } from '../models/setting.model.js';
import { env } from '../config/env.js';
import { decryptSecret, encryptSecret, isEncryptedSecret, maskSecret } from '../utils/crypto.js';
import { resetStripeClient } from './stripe.service.js';

const STRIPE_KEY = 'stripe';
const EMAIL_KEY = 'email';
const MSG91_KEY = 'msg91';

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

  if (!value?.secretKey) {
    return null;
  }

  return {
    secretKey: readSecret(value.secretKey),
    publishableKey: value.publishableKey || '',
    webhookSecret: readSecret(value.webhookSecret),
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

/** MSG91 settings — disabled until the admin configures and enables it. */
export async function getMsg91Settings() {
  const value = await getSettingValue(MSG91_KEY);

  return {
    enabled: value?.enabled === true,
    authKey: value?.authKey ? readSecret(value.authKey) : '',
    senderId: value?.senderId || '',
    templateId: value?.templateId || '',
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
