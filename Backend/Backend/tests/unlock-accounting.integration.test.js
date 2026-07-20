import { jest } from '@jest/globals';
import { EmployerProfile } from '../src/models/employer-profile.model.js';
import { Job } from '../src/models/job.model.js';
import { ProfileUnlock } from '../src/models/profile-unlock.model.js';
import { unlockCandidate } from '../src/services/unlock.service.js';
import { connectTestDb, clearTestDb, disconnectTestDb } from './helpers/db.js';
import { createCandidate, createEmployer, jobFields, seedPlans } from './helpers/fixtures.js';

jest.setTimeout(60_000);

beforeAll(async () => {
  await connectTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

beforeEach(async () => {
  await clearTestDb();
  await seedPlans();
});

describe('unlockCandidate accounting', () => {
  test('job pool is spent first, then account balance, then 402', async () => {
    const employer = await createEmployer();
    const job = await Job.create(
      jobFields(employer.profile, { unlockCreditsTotal: 1, unlockCreditsUsed: 0 }),
    );
    await EmployerProfile.updateOne(
      { _id: employer.profile._id },
      { $set: { unlockCreditBalance: 1 } },
    );

    const [candidateA, candidateB, candidateC] = await Promise.all([
      createCandidate(),
      createCandidate(),
      createCandidate(),
    ]);

    // 1st unlock: job pool.
    const first = await unlockCandidate(employer.authUser, String(candidateA.profile._id), {
      jobId: String(job._id),
    });
    expect(first.alreadyUnlocked).toBe(false);
    expect(first.candidate.email).toBe(candidateA.profile.email);

    let jobAfter = await Job.findById(job._id).lean();
    expect(jobAfter.unlockCreditsUsed).toBe(1);

    // 2nd unlock with the pool exhausted: falls back to account balance.
    const second = await unlockCandidate(employer.authUser, String(candidateB.profile._id), {
      jobId: String(job._id),
    });
    expect(second.alreadyUnlocked).toBe(false);

    jobAfter = await Job.findById(job._id).lean();
    expect(jobAfter.unlockCreditsUsed).toBe(1); // pool untouched
    const profileAfter = await EmployerProfile.findById(employer.profile._id).lean();
    expect(profileAfter.unlockCreditBalance).toBe(0);

    // 3rd unlock: nothing left → 402 NO_UNLOCK_CREDITS.
    let caught = null;
    try {
      await unlockCandidate(employer.authUser, String(candidateC.profile._id), {
        jobId: String(job._id),
      });
    } catch (error) {
      caught = error;
    }
    expect(caught?.code).toBe('NO_UNLOCK_CREDITS');
    expect(caught?.statusCode).toBe(402);
  });

  test('re-unlocking is idempotent and free', async () => {
    const employer = await createEmployer();
    await EmployerProfile.updateOne(
      { _id: employer.profile._id },
      { $set: { unlockCreditBalance: 5 } },
    );
    const candidate = await createCandidate();

    await unlockCandidate(employer.authUser, String(candidate.profile._id), {});
    const again = await unlockCandidate(employer.authUser, String(candidate.profile._id), {});

    expect(again.alreadyUnlocked).toBe(true);
    const profileAfter = await EmployerProfile.findById(employer.profile._id).lean();
    expect(profileAfter.unlockCreditBalance).toBe(4); // only one credit spent

    const unlockCount = await ProfileUnlock.countDocuments({
      employerProfile: employer.profile._id,
      candidateProfile: candidate.profile._id,
    });
    expect(unlockCount).toBe(1);
  });

  test('unlock is global — visible across jobs without re-spending', async () => {
    const employer = await createEmployer();
    const jobA = await Job.create(
      jobFields(employer.profile, { unlockCreditsTotal: 5, unlockCreditsUsed: 0 }),
    );
    await Job.create(jobFields(employer.profile, { unlockCreditsTotal: 5 }));
    const candidate = await createCandidate();

    await unlockCandidate(employer.authUser, String(candidate.profile._id), {
      jobId: String(jobA._id),
    });

    // Unlock via the OTHER job (or none) is already covered — no extra spend.
    const viaNoJob = await unlockCandidate(employer.authUser, String(candidate.profile._id), {});
    expect(viaNoJob.alreadyUnlocked).toBe(true);

    const jobAAfter = await Job.findById(jobA._id).lean();
    expect(jobAAfter.unlockCreditsUsed).toBe(1);
  });

  test('EXCEL candidates need no unlock on paid plans', async () => {
    const employer = await createEmployer();
    const { activateSubscription } = await import('./helpers/fixtures.js');
    const { Plan } = await import('../src/models/plan.model.js');
    const premium = await Plan.findOne({ planKey: 'employer_premium' });
    await activateSubscription(employer.user, premium);

    const excelCandidate = await createCandidate(null, {
      subscriptionTier: 'excel',
      subscriptionExpiresAt: new Date(Date.now() + 86_400_000),
    });

    const result = await unlockCandidate(employer.authUser, String(excelCandidate.profile._id), {});
    expect(result.alreadyUnlocked).toBe(true); // visible without spending

    const unlockCount = await ProfileUnlock.countDocuments({
      employerProfile: employer.profile._id,
    });
    expect(unlockCount).toBe(0);
  });
});
