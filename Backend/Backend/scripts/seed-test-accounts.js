import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { User } from '../src/models/user.model.js';
import { logger } from '../src/utils/logger.js';

const TEST_ACCOUNTS = [
  { email: 'admin@test.com', role: 'admin' },
  { email: 'employer@test.com', role: 'employer' },
  { email: 'candidate@test.com', role: 'candidate' },
];

async function run() {
  await connectDatabase();

  for (const { email, role } of TEST_ACCOUNTS) {
    const formattedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: formattedEmail }).lean();

    if (existing) {
      await User.updateOne(
        { email: formattedEmail },
        { $set: { role, isActive: true } }
      );
      logger.info(`Updated test ${role}: ${formattedEmail}`);
    } else {
      await User.create({ email: formattedEmail, role, isActive: true });
      logger.info(`Created test ${role}: ${formattedEmail}`);
    }
  }

  await disconnectDatabase();
  logger.info('Done. Login via OTP flow with these emails using static OTP: 123456');
}

run().catch((error) => {
  logger.error(error);
  process.exit(1);
});
