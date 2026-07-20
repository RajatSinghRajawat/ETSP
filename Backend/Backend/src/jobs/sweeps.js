import { CandidateProfile } from '../models/candidate-profile.model.js';
import { Job } from '../models/job.model.js';
import { logger } from '../utils/logger.js';

const SWEEP_INTERVAL_MS = 10 * 60 * 1000;

/**
 * Periodic state sweeps (no queue infra needed):
 *  1. Flip active jobs past their plan validity to 'expired'. Query-time
 *     filters already hide them; this makes the state visible/consistent.
 *  2. Demote candidates whose EXCEL membership lapsed — clears the
 *     denormalized tier/boost and re-opens their profile to recruiters
 *     (free profiles are always visible).
 */
export async function runSweeps() {
  const now = new Date();

  try {
    const expired = await Job.updateMany(
      { status: 'active', expiresAt: { $ne: null, $lte: now } },
      { $set: { status: 'expired' } },
    );

    if (expired.modifiedCount > 0) {
      logger.info('Job expiry sweep', { expired: expired.modifiedCount });
    }
  } catch (error) {
    logger.warn('Job expiry sweep failed', { message: error.message });
  }

  try {
    const demoted = await CandidateProfile.updateMany(
      { subscriptionTier: 'excel', subscriptionExpiresAt: { $ne: null, $lt: now } },
      {
        $set: {
          subscriptionTier: 'free',
          subscriptionExpiresAt: null,
          searchBoost: 0,
          profileVisible: true,
        },
      },
    );

    if (demoted.modifiedCount > 0) {
      logger.info('EXCEL lapse sweep', { demoted: demoted.modifiedCount });
    }
  } catch (error) {
    logger.warn('EXCEL lapse sweep failed', { message: error.message });
  }
}

let sweepTimer = null;

export function startSweeps() {
  if (sweepTimer) {
    return;
  }

  runSweeps();
  sweepTimer = setInterval(runSweeps, SWEEP_INTERVAL_MS);
  sweepTimer.unref?.();
}

export function stopSweeps() {
  if (sweepTimer) {
    clearInterval(sweepTimer);
    sweepTimer = null;
  }
}
