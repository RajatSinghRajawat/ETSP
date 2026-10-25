import { env } from '../config/env.js';
import { User } from '../models/user.model.js';
import { logger } from './logger.js';

/**
 * Makes sure every ADMIN_EMAIL account (comma-separated) exists as an active
 * admin, so a fresh deploy can log into the admin panel via the normal email
 * OTP flow without running a seed script inside the container.
 */
export async function ensureAdminUser() {
  const emails = env.ADMIN_EMAIL.split(',')
    .map((email) => email.toLowerCase().trim())
    .filter(Boolean);

  for (const email of emails) {
    const existing = await User.findOne({ email }).select('role isActive').lean();

    if (!existing) {
      await User.create({ email, role: 'admin', isActive: true });
      logger.info(`Created admin user: ${email}`);
      continue;
    }

    if (existing.role !== 'admin' || !existing.isActive) {
      await User.updateOne({ email }, { $set: { role: 'admin', isActive: true } });
      logger.info(`Promoted user to admin: ${email}`);
    }
  }

  // Strictly enforce: remove admin role from any accounts not listed in ADMIN_EMAIL
  if (emails.length > 0) {
    await User.updateMany(
      { role: 'admin', email: { $nin: emails } },
      { $set: { role: 'candidate' } },
    );
  }
}
