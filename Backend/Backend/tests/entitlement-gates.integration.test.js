import { jest } from '@jest/globals';
import { Job } from '../src/models/job.model.js';
import { JobCredit } from '../src/models/job-credit.model.js';
import {
  assertCanDirectMessage,
  assertCanPostJob,
  consumeJobCredit,
  getEmployerContext,
  recordCandidateOutreach,
} from '../src/services/entitlement.service.js';
import { connectTestDb, clearTestDb, disconnectTestDb } from './helpers/db.js';
import {
  activateSubscription,
  createCandidate,
  createEmployer,
  jobFields,
  seedPlans,
} from './helpers/fixtures.js';

jest.setTimeout(60_000);

let plans;

beforeAll(async () => {
  await connectTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

beforeEach(async () => {
  await clearTestDb();
  plans = await seedPlans();
});

const expectAppError = async (promise, code, statusCode) => {
  let caught = null;

  try {
    await promise;
  } catch (error) {
    caught = error;
  }

  expect(caught).not.toBeNull();
  expect(caught.code).toBe(code);
  if (statusCode) {
    expect(caught.statusCode).toBe(statusCode);
  }

  return caught;
};

describe('employer posting gates', () => {
  test('free employer: 2 concurrent jobs, 3rd blocked with canUseCredit info', async () => {
    const { profile, authUser } = await createEmployer();

    const first = await assertCanPostJob(authUser, profile._id);
    expect(first.jobSetup.postedVia).toBe('free');
    expect(first.jobSetup.unlockCreditsTotal).toBe(0);
    // 3-day validity stamped from the plan.
    const validityDays = (first.jobSetup.expiresAt - Date.now()) / 86_400_000;
    expect(validityDays).toBeGreaterThan(2.9);
    expect(validityDays).toBeLessThan(3.1);

    await Job.create(jobFields(profile));
    await Job.create(jobFields(profile));

    const error = await expectAppError(
      assertCanPostJob(authUser, profile._id),
      'PLAN_LIMIT_REACHED',
      403,
    );
    expect(error.details).toMatchObject({ used: 2, limit: 2, canUseCredit: false });
  });

  test('expired jobs do not count toward the concurrent limit', async () => {
    const { profile, authUser } = await createEmployer();

    await Job.create(jobFields(profile, { expiresAt: new Date(Date.now() - 1000) }));
    await Job.create(jobFields(profile, { status: 'expired' }));
    await Job.create(jobFields(profile));

    // 1 live job of 2 allowed → posting is fine.
    const result = await assertCanPostJob(authUser, profile._id);
    expect(result.jobSetup.postedVia).toBe('free');
  });

  test('pay-per-job jobs never count against the base limit', async () => {
    const { profile, authUser } = await createEmployer();

    await Job.create(jobFields(profile, { postedVia: 'pay_per_job' }));
    await Job.create(jobFields(profile, { postedVia: 'pay_per_job' }));
    await Job.create(jobFields(profile));

    const result = await assertCanPostJob(authUser, profile._id);
    expect(result.jobSetup.postedVia).toBe('free');
  });

  test('screening questions blocked on free, allowed on premium', async () => {
    const free = await createEmployer();
    await expectAppError(
      assertCanPostJob(free.authUser, free.profile._id, { hasScreeningQuestions: true }),
      'FEATURE_NOT_IN_PLAN',
      403,
    );

    const premium = await createEmployer();
    await activateSubscription(premium.user, plans.employer_premium);
    const result = await assertCanPostJob(premium.authUser, premium.profile._id, {
      hasScreeningQuestions: true,
    });
    expect(result.jobSetup.postedVia).toBe('premium');
    expect(result.jobSetup.unlockCreditsTotal).toBe(50);
  });

  test('featured jobs: blocked on free, premium limited to 1 concurrent', async () => {
    const free = await createEmployer();
    await expectAppError(
      assertCanPostJob(free.authUser, free.profile._id, { wantsFeatured: true }),
      'FEATURE_NOT_IN_PLAN',
    );

    const premium = await createEmployer();
    await activateSubscription(premium.user, plans.employer_premium);

    const allowed = await assertCanPostJob(premium.authUser, premium.profile._id, {
      wantsFeatured: true,
    });
    expect(allowed.jobSetup.postedVia).toBe('premium');

    await Job.create(jobFields(premium.profile, { isFeatured: true, postedVia: 'premium' }));

    const error = await expectAppError(
      assertCanPostJob(premium.authUser, premium.profile._id, { wantsFeatured: true }),
      'PLAN_LIMIT_REACHED',
    );
    expect(error.details).toMatchObject({ used: 1, limit: 1 });
  });

  test('job credits: NO_JOB_CREDIT without one; oldest credit consumed with snapshot values', async () => {
    const { profile, authUser } = await createEmployer();

    await expectAppError(
      assertCanPostJob(authUser, profile._id, { useJobCredit: true }),
      'NO_JOB_CREDIT',
      402,
    );

    const older = await JobCredit.create({
      employerProfile: profile._id,
      userEmail: profile.email,
      purchase: profile._id, // any ObjectId works for the ref in tests
      validityDays: 14,
      unlockCreditsPerJob: 15,
    });
    await JobCredit.create({
      employerProfile: profile._id,
      userEmail: profile.email,
      purchase: profile._id,
      validityDays: 14,
      unlockCreditsPerJob: 15,
    });

    const result = await assertCanPostJob(authUser, profile._id, { useJobCredit: true });
    expect(String(result.jobSetup.jobCreditId)).toBe(String(older._id));
    expect(result.jobSetup.postedVia).toBe('pay_per_job');
    expect(result.jobSetup.unlockCreditsTotal).toBe(15);
    const validityDays = (result.jobSetup.expiresAt - Date.now()) / 86_400_000;
    expect(validityDays).toBeGreaterThan(13.9);
    expect(validityDays).toBeLessThan(14.1);

    const job = await Job.create(jobFields(profile, { postedVia: 'pay_per_job' }));
    await consumeJobCredit(result.jobSetup.jobCreditId, job._id);

    const consumed = await JobCredit.findById(older._id).lean();
    expect(consumed.status).toBe('consumed');
    expect(String(consumed.consumedByJob)).toBe(String(job._id));
  });

  test('pay-per-job context OR-merges chat/filters/screening onto free employer', async () => {
    const { profile, authUser } = await createEmployer();

    let context = await getEmployerContext(authUser);
    expect(context.effectiveFeatures.chatEnabled).toBe(false);
    expect(context.effectiveFeatures.searchFiltersEnabled).toBe(false);

    await JobCredit.create({
      employerProfile: profile._id,
      userEmail: profile.email,
      purchase: profile._id,
    });

    context = await getEmployerContext(authUser);
    expect(context.hasPpjContext).toBe(true);
    expect(context.effectiveFeatures.chatEnabled).toBe(true);
    expect(context.effectiveFeatures.searchFiltersEnabled).toBe(true);
    expect(context.effectiveFeatures.screeningQuestionsEnabled).toBe(true);
    expect(context.effectiveFeatures.visibleExcelProfilesPerJob).toBeNull();
  });
});

describe('candidate direct-message quota', () => {
  test('free candidate cannot direct message', async () => {
    const candidate = await createCandidate();
    const employer = await createEmployer();

    await expectAppError(
      assertCanDirectMessage(candidate.authUser, candidate.profile._id, employer.profile._id),
      'FEATURE_NOT_IN_PLAN',
      403,
    );
  });

  test('EXCEL: 3 distinct employers, 4th blocked, repeats free', async () => {
    const candidate = await createCandidate();
    await activateSubscription(candidate.user, plans.candidate_excel);

    const employers = await Promise.all([
      createEmployer(),
      createEmployer(),
      createEmployer(),
      createEmployer(),
    ]);

    for (const employer of employers.slice(0, 3)) {
      const outreach = await assertCanDirectMessage(
        candidate.authUser,
        candidate.profile._id,
        employer.profile._id,
      );
      expect(outreach.counted).toBe(true);
      await recordCandidateOutreach(
        candidate.profile._id,
        employer.profile._id,
        outreach.periodKey,
      );
    }

    const error = await expectAppError(
      assertCanDirectMessage(candidate.authUser, candidate.profile._id, employers[3].profile._id),
      'PLAN_LIMIT_REACHED',
      403,
    );
    expect(error.details).toMatchObject({ used: 3, limit: 3 });

    // Messaging an already-contacted employer again stays free.
    const repeat = await assertCanDirectMessage(
      candidate.authUser,
      candidate.profile._id,
      employers[0].profile._id,
    );
    expect(repeat.counted).toBe(false);
  });
});
