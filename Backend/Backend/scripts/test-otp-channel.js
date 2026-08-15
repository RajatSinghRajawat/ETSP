// One-off check that an OTP goes out over ONE chosen channel — exactly like the
// login flow does after the user picks email / SMS / WhatsApp on the website.
// Usage: node scripts/test-otp-channel.js <email|sms|whatsapp> <email or 10-digit mobile> [otp]
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import {
  OTP_CHANNEL_LABELS,
  deliverOtp,
  getOtpChannelAvailability,
  isOtpChannel,
  maskOtpDestination,
} from '../src/services/otp-delivery.service.js';
import { logger } from '../src/utils/logger.js';

const channel = process.argv[2];
const destination = process.argv[3];
const otp = process.argv[4] || String(Math.floor(100000 + Math.random() * 900000));

if (!isOtpChannel(channel) || !destination) {
  console.error('Usage: node scripts/test-otp-channel.js <email|sms|whatsapp> <email or 10-digit mobile> [otp]');
  process.exit(1);
}

const target = channel === 'email' ? { email: destination } : { phone: destination };

async function run() {
  await connectDatabase();

  const availability = await getOtpChannelAvailability();
  logger.info('OTP channel availability', availability);

  if (!availability[channel]) {
    logger.error(`${OTP_CHANNEL_LABELS[channel]} is not enabled/configured — enable it in .env or admin Settings.`);
    await disconnectDatabase();
    process.exit(1);
  }

  const startedAt = Date.now();
  const sent = await deliverOtp(channel, target, otp);

  if (sent) {
    logger.info(
      `OTP ${otp} sent via ${OTP_CHANNEL_LABELS[channel]} to ${maskOtpDestination(channel, target)} in ${Date.now() - startedAt}ms`,
    );
  } else {
    logger.error(`${OTP_CHANNEL_LABELS[channel]} provider rejected the send — see the error logged above.`);
  }

  await disconnectDatabase();
  process.exit(sent ? 0 : 1);
}

run().catch((error) => {
  logger.error(error);
  process.exit(1);
});
