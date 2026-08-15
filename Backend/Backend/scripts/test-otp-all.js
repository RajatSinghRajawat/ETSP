// One-off check that the OTP fans out to email + SMS + WhatsApp in parallel,
// exactly like the login flow does.
// Usage: node scripts/test-otp-all.js <email> <10-digit mobile> [otp]
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { emailService } from '../src/services/email.service.js';
import { isSmsEnabled, sendOtpSms } from '../src/services/sms.service.js';
import { isWhatsappEnabled, sendOtpWhatsapp } from '../src/services/whatsapp.service.js';
import { logger } from '../src/utils/logger.js';

const email = process.argv[2];
const phone = process.argv[3];
const otp = process.argv[4] || String(Math.floor(100000 + Math.random() * 900000));

if (!email || !phone) {
  console.error('Usage: node scripts/test-otp-all.js <email> <10-digit mobile> [otp]');
  process.exit(1);
}

async function run() {
  await connectDatabase();

  const [emailEnabled, smsEnabled, whatsappEnabled] = await Promise.all([
    emailService.isEnabled(),
    isSmsEnabled(),
    isWhatsappEnabled(),
  ]);
  logger.info('Channels', { emailEnabled, smsEnabled, whatsappEnabled });

  const startedAt = Date.now();
  const [emailSent, smsSent, whatsappSent] = await Promise.all([
    emailEnabled ? emailService.sendOtpEmail(email, otp) : false,
    smsEnabled ? sendOtpSms(phone, otp) : false,
    whatsappEnabled ? sendOtpWhatsapp(phone, otp) : false,
  ]);

  logger.info(`OTP ${otp} dispatched in ${Date.now() - startedAt}ms`, {
    emailSent,
    smsSent,
    whatsappSent,
  });

  const allOk = [emailEnabled && emailSent, smsEnabled && smsSent, whatsappEnabled && whatsappSent]
    .filter((entry, index) => [emailEnabled, smsEnabled, whatsappEnabled][index])
    .every(Boolean);

  await disconnectDatabase();
  process.exit(allOk ? 0 : 1);
}

run().catch((error) => {
  logger.error(error);
  process.exit(1);
});
