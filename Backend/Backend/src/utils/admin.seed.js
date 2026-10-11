import { env } from '../config/env.js';
import { User } from '../models/user.model.js';
import { logger } from './logger.js';

/**
 * Makes sure the ADMIN_EMAIL account exists as an active admin, so a fresh
 * deploy can log into the admin panel via the normal email OTP flow without
 * running a seed script inside the container.
 */
export async function ensureAdminUser() {
  const email = env.ADMIN_EMAIL.toLowerCase().trim();

  if (!email) {
    return;
  }

  const existing = await User.findOne({ email }).select('role isActive').lean();

  if (!existing) {
    await User.create({ email, role: 'admin', isActive: true });
    logger.info(`Created admin user: ${email}`);
    return;
  }

  if (existing.role !== 'admin' || !existing.isActive) {
    await User.updateOne({ email }, { $set: { role: 'admin', isActive: true } });
    logger.info(`Promoted user to admin: ${email}`);
  }
}
