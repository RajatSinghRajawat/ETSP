// One-off check that MSG91 WhatsApp OTP is configured end-to-end.
// Usage: node scripts/test-whatsapp.js 98XXXXXXXX [otp]
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { getMsg91Settings } from '../src/services/settings.service.js';
import { sendOtpWhatsapp } from '../src/services/whatsapp.service.js';
import { logger } from '../src/utils/logger.js';

const phone = process.argv[2];
const otp = process.argv[3] || String(Math.floor(100000 + Math.random() * 900000));

if (!phone) {
  console.error('Usage: node scripts/test-whatsapp.js <10-digit mobile> [otp]');
  process.exit(1);
}

async function run() {
  await connectDatabase();

  const settings = await getMsg91Settings();
  logger.info('MSG91 WhatsApp config', {
    waEnabled: settings.waEnabled,
    waNumber: settings.waNumber || '(missing)',
    waTemplateName: settings.waTemplateName || '(missing)',
    authKeySet: Boolean(settings.authKey),
  });

  if (!settings.waEnabled || !settings.authKey || !settings.waNumber || !settings.waTemplateName) {
    logger.error(
      'MSG91 WhatsApp is not fully configured. Set MSG91_AUTH_KEY, MSG91_WA_NUMBER and '
      + 'MSG91_WA_TEMPLATE_NAME in .env or save them in admin Settings, then retry.',
    );
    await disconnectDatabase();
    process.exit(1);
  }

  const sent = await sendOtpWhatsapp(phone, otp);

  if (sent) {
    logger.info(`Test OTP ${otp} sent to ${phone} on WhatsApp — check the handset.`);
  } else {
    logger.error('MSG91 rejected the WhatsApp send — see the error logged above.');
  }

  await disconnectDatabase();
  process.exit(sent ? 0 : 1);
}

run().catch((error) => {
  logger.error(error);
  process.exit(1);
});
