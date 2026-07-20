import { CandidateProfile } from '../models/candidate-profile.model.js';
import { EmployerProfile } from '../models/employer-profile.model.js';
import { Job } from '../models/job.model.js';
import { ProfileUnlock } from '../models/profile-unlock.model.js';
import { AppError } from '../utils/app-error.js';
import { getEmployerContext } from './entitlement.service.js';
import { canEmployerViewCandidate, getUnlockedCandidateIds } from './candidate-masking.service.js';

const isObjectId = (value) => /^[0-9a-fA-F]{24}$/.test(String(value));

/**
 * Spend one unlock credit to reveal a candidate's full profile. Credits are
 * consumed job-pool first (when a jobId owned by the employer is given),
 * falling back to the account-wide balance bought via add-ons. Unlocks are
 * permanent per employer×candidate; repeated calls are free and idempotent.
 */
export async function unlockCandidate(user, candidateProfileId, { jobId = null } = {}) {
  if (!isObjectId(candidateProfileId)) {
    throw new AppError('Candidate not found', 404);
  }

  const context = await getEmployerContext(user);
  const { employerProfile, effectiveFeatures } = context;

  if (!employerProfile) {
    throw new AppError('Employer profile not found for this account', 404);
  }

  const candidate = await CandidateProfile.findById(candidateProfileId).lean();

  if (!candidate || candidate.status !== 'submitted') {
    throw new AppError('Candidate not found', 404);
  }

  // Already visible (unlocked before, or EXCEL member visible to this plan)?
  const unlockedSet = await getUnlockedCandidateIds(employerProfile._id, [candidate._id]);

  if (canEmployerViewCandidate({ effectiveFeatures, candidate, unlockedSet })) {
    return { candidate, meters: await getUnlockMeters(employerProfile._id), alreadyUnlocked: true };
  }

  let source = null;
  let sourceJobId = null;

  // 1) Job pool: atomically take a slot from the job's snapshot pool.
  if (jobId && isObjectId(jobId)) {
    const job = await Job.findOneAndUpdate(
      {
        _id: jobId,
        employerProfile: employerProfile._id,
        $expr: { $lt: ['$unlockCreditsUsed', '$unlockCreditsTotal'] },
      },
      { $inc: { unlockCreditsUsed: 1 } },
      { new: true },
    )
      .select('_id')
      .lean();

    if (job) {
      source = 'job_pool';
      sourceJobId = job._id;
    }
  }

  // 2) Account balance bought via add-ons.
  if (!source) {
    const updated = await EmployerProfile.findOneAndUpdate(
      { _id: employerProfile._id, unlockCreditBalance: { $gt: 0 } },
      { $inc: { unlockCreditBalance: -1 } },
    )
      .select('_id')
      .lean();

    if (updated) {
      source = 'account_balance';
    }
  }

  if (!source) {
    throw new AppError(
      'You have no unlock credits left. Buy more credits to view this profile.',
      402,
      {
        canBuyAddon: Boolean(effectiveFeatures.creditAddonsEnabled),
        canBuyPerCv: Boolean(effectiveFeatures.perCvUnlockEnabled),
      },
      'NO_UNLOCK_CREDITS',
    );
  }

  try {
    await ProfileUnlock.create({
      employerProfile: employerProfile._id,
      candidateProfile: candidate._id,
      job: sourceJobId,
      source,
    });
  } catch (error) {
    if (error?.code === 11000) {
      // Raced with a parallel unlock of the same candidate — refund the credit.
      if (source === 'job_pool') {
        await Job.updateOne({ _id: sourceJobId }, { $inc: { unlockCreditsUsed: -1 } });
      } else {
        await EmployerProfile.updateOne(
          { _id: employerProfile._id },
          { $inc: { unlockCreditBalance: 1 } },
        );
      }
    } else {
      throw error;
    }
  }

  return { candidate, meters: await getUnlockMeters(employerProfile._id), alreadyUnlocked: false };
}

/** Credit meters shown in the employer UI. */
export async function getUnlockMeters(employerProfileId) {
  const [employerProfile, jobs] = await Promise.all([
    EmployerProfile.findById(employerProfileId).select('unlockCreditBalance').lean(),
    Job.find({
      employerProfile: employerProfileId,
      unlockCreditsTotal: { $gt: 0 },
      status: { $in: ['active', 'closed', 'expired'] },
    })
      .select('title unlockCreditsTotal unlockCreditsUsed status')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
  ]);

  return {
    accountBalance: employerProfile?.unlockCreditBalance ?? 0,
    perJob: jobs.map((job) => ({
      job: String(job._id),
      title: job.title,
      status: job.status,
      total: job.unlockCreditsTotal,
      used: job.unlockCreditsUsed,
    })),
  };
}
