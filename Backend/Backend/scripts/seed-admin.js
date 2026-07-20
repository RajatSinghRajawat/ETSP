import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { User } from '../src/models/user.model.js';
import { logger } from '../src/utils/logger.js';

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@ets.local').toLowerCase().trim();

async function run() {
  await connectDatabase();

  const existing = await User.findOne({ email: ADMIN_EMAIL }).lean();

  if (existing) {
    if (existing.role !== 'admin' || !existing.isActive) {
      await User.updateOne({ email: ADMIN_EMAIL }, { $set: { role: 'admin', isActive: true } });
      logger.info(`Promoted existing user to admin: ${ADMIN_EMAIL}`);
    } else {
      logger.info(`Admin already exists: ${ADMIN_EMAIL}`);
    }
  } else {
    await User.create({ email: ADMIN_EMAIL, role: 'admin', isActive: true });
    logger.info(`Created admin user: ${ADMIN_EMAIL}`);
  }

  await disconnectDatabase();
  logger.info('Done. Login via OTP flow with this email to get an admin access token.');
}

run().catch((error) => {
  logger.error(error);
  process.exit(1);
});
