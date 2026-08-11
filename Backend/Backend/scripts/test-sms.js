// One-off check that MSG91 SMS OTP is configured end-to-end.
// Usage: node scripts/test-sms.js 98XXXXXXXX [otp]
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { getMsg91Settings } from '../src/services/settings.service.js';
import { sendOtpSms } from '../src/services/sms.service.js';
import { logger } from '../src/utils/logger.js';

const phone = process.argv[2];
const otp = process.argv[3] || String(Math.floor(100000 + Math.random() * 900000));

if (!phone) {
  console.error('Usage: node scripts/test-sms.js <10-digit mobile> [otp]');
  process.exit(1);
}

async function run() {
  await connectDatabase();

  const settings = await getMsg91Settings();
  logger.info('MSG91 config', {
    enabled: settings.enabled,
    senderId: settings.senderId,
    templateId: settings.templateId || '(missing)',
    authKeySet: Boolean(settings.authKey),
  });

  if (!settings.enabled || !settings.authKey || !settings.templateId) {
    logger.error(
      'MSG91 is not fully configured. Set MSG91_AUTH_KEY and MSG91_TEMPLATE_ID in .env '
      + 'or save them in admin Settings, then retry.',
    );
    await disconnectDatabase();
    process.exit(1);
  }

  const sent = await sendOtpSms(phone, otp);

  if (sent) {
    logger.info(`Test OTP ${otp} sent to ${phone} — check the handset.`);
  } else {
    logger.error('MSG91 rejected the send — see the error logged above.');
  }

  await disconnectDatabase();
  process.exit(sent ? 0 : 1);
}

run().catch((error) => {
  logger.error(error);
  process.exit(1);
});
