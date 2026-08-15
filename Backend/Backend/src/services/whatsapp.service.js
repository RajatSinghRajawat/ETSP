import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { getMsg91Settings } from './settings.service.js';
import { toMsg91Mobile } from './sms.service.js';

const MSG91_WHATSAPP_URL =
  `${env.MSG91_BASE_URL.replace(/\/$/, '')}/api/v5/whatsapp/whatsapp-outbound-message/bulk/`;

export async function isWhatsappEnabled() {
  const settings = await getMsg91Settings();
  return settings.waEnabled && Boolean(settings.authKey && settings.waNumber && settings.waTemplateName);
}

/**
 * Send the OTP over WhatsApp via MSG91's outbound template API. The template
 * ("vetslinkedotp") is a Meta Authentication template: `body_1` fills the code
 * in the message body and `button_1` fills the copy-code button, so both carry
 * the OTP. Returns true when MSG91 accepts the message.
 */
export async function sendOtpWhatsapp(phone, otp) {
  const settings = await getMsg91Settings();

  if (!settings.waEnabled || !settings.authKey || !settings.waNumber || !settings.waTemplateName) {
    return false;
  }

  const mobile = toMsg91Mobile(phone);

  if (!mobile) {
    logger.warn('MSG91 WhatsApp: invalid mobile number, skipping', { phone });
    return false;
  }

  try {
    const response = await fetch(MSG91_WHATSAPP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authkey: settings.authKey,
      },
      body: JSON.stringify({
        integrated_number: settings.waNumber,
        content_type: 'template',
        payload: {
          messaging_product: 'whatsapp',
          type: 'template',
          template: {
            name: settings.waTemplateName,
            language: { code: 'en', policy: 'deterministic' },
            namespace: null,
            to_and_components: [
              {
                to: [mobile],
                components: {
                  body_1: { type: 'text', value: otp },
                  button_1: { subtype: 'url', type: 'text', value: otp },
                },
              },
            ],
          },
        },
      }),
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok || body?.hasError || body?.status === 'fail' || body?.type === 'error') {
      logger.error('MSG91 WhatsApp send failed', { status: response.status, body });
      return false;
    }

    logger.info('OTP sent via WhatsApp (MSG91)', { mobile: `••••${mobile.slice(-4)}` });
    return true;
  } catch (error) {
    logger.error('MSG91 WhatsApp request error', { message: error.message });
    return false;
  }
}
