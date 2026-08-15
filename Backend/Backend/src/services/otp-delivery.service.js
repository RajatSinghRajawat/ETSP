import { emailService } from './email.service.js';
import { isSmsEnabled, sendOtpSms } from './sms.service.js';
import { isWhatsappEnabled, sendOtpWhatsapp } from './whatsapp.service.js';

/**
 * Single place that knows how an OTP reaches the user. Every OTP flow (login,
 * phone verification) sends over exactly ONE channel — the one the user picked
 * on the website — never over all of them at once.
 */
export const OTP_CHANNELS = ['email', 'sms', 'whatsapp'];

export const OTP_CHANNEL_LABELS = {
  email: 'email',
  sms: 'SMS',
  whatsapp: 'WhatsApp',
};

export function isOtpChannel(value) {
  return OTP_CHANNELS.includes(value);
}

/**
 * Which channels the admin has switched on and fully configured. Email is
 * SMTP; SMS and WhatsApp both go through MSG91 (separate toggles).
 */
export async function getOtpChannelAvailability() {
  const [email, sms, whatsapp] = await Promise.all([
    emailService.isEnabled(),
    isSmsEnabled(),
    isWhatsappEnabled(),
  ]);

  return { email, sms, whatsapp };
}

export async function isOtpChannelEnabled(channel) {
  switch (channel) {
    case 'email':
      return emailService.isEnabled();
    case 'sms':
      return isSmsEnabled();
    case 'whatsapp':
      return isWhatsappEnabled();
    default:
      return false;
  }
}

/**
 * Deliver the OTP over the chosen channel only. Each sender swallows its own
 * provider errors and resolves to a boolean, so this never throws.
 */
export async function deliverOtp(channel, { email, phone }, otp) {
  switch (channel) {
    case 'email':
      return email ? emailService.sendOtpEmail(email, otp) : false;
    case 'sms':
      return phone ? sendOtpSms(phone, otp) : false;
    case 'whatsapp':
      return phone ? sendOtpWhatsapp(phone, otp) : false;
    default:
      return false;
  }
}

/** "sa••••••@gmail.com" — enough for the user to recognise the inbox. */
export function maskEmail(email) {
  const value = String(email ?? '');
  const at = value.indexOf('@');

  if (at <= 0) return value;

  const local = value.slice(0, at);
  const domain = value.slice(at);
  const keep = local.length > 2 ? 2 : 1;

  return `${local.slice(0, keep)}${'•'.repeat(Math.max(local.length - keep, 2))}${domain}`;
}

/** "••••••9921" — last four digits only. */
export function maskPhone(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '');
  return digits ? `••••••${digits.slice(-4)}` : '';
}

export function maskOtpDestination(channel, { email, phone }) {
  return channel === 'email' ? maskEmail(email) : maskPhone(phone);
}
