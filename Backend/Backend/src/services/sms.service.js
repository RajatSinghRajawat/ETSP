import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { getMsg91Settings } from './settings.service.js';

const MSG91_OTP_URL = `${env.MSG91_BASE_URL.replace(/\/$/, '')}/api/v5/otp`;

/** Normalise an Indian mobile number to the 91XXXXXXXXXX format MSG91 expects. */
export function toMsg91Mobile(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '');

  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;

  return null;
}

export async function isSmsEnabled() {
  const settings = await getMsg91Settings();
  return settings.enabled && Boolean(settings.authKey && settings.templateId);
}

/**
 * Send the login OTP via MSG91's SendOTP API. The template must be an OTP-app
 * template ("vetslinkedotp", DLT id 1277178655626147513, variable `##OTP##`) —
 * the Flow API silently drops OTP-app template ids, so this endpoint is the
 * only one that delivers them. The sender id comes from the template itself.
 * Returns true when MSG91 accepts the message.
 */
export async function sendOtpSms(phone, otp) {
  const settings = await getMsg91Settings();

  if (!settings.enabled || !settings.authKey || !settings.templateId) {
    return false;
  }

  const mobile = toMsg91Mobile(phone);

  if (!mobile) {
    logger.warn('MSG91: invalid mobile number, skipping SMS', { phone });
    return false;
  }

  try {
    const params = new URLSearchParams({
      template_id: settings.templateId,
      mobile,
      otp: String(otp),
      otp_expiry: '10',
    });

    const response = await fetch(`${MSG91_OTP_URL}?${params}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authkey: settings.authKey,
      },
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok || body?.type === 'error') {
      logger.error('MSG91 send failed', { status: response.status, body });
      return false;
    }

    logger.info('OTP SMS sent via MSG91', { mobile: `••••${mobile.slice(-4)}` });
    return true;
  } catch (error) {
    logger.error('MSG91 request error', { message: error.message });
    return false;
  }
}
