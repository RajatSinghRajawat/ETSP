import { jest } from '@jest/globals';
import { CandidateProfile } from '../src/models/candidate-profile.model.js';
import { Job } from '../src/models/job.model.js';
import { runSweeps } from '../src/jobs/sweeps.js';
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

describe('runSweeps', () => {
  test('flips overdue active jobs to expired, leaves live ones alone', async () => {
    const employer = await createEmployer();

    const overdue = await Job.create(
      jobFields(employer.profile, { expiresAt: new Date(Date.now() - 60_000) }),
    );
    const live = await Job.create(
      jobFields(employer.profile, { expiresAt: new Date(Date.now() + 86_400_000) }),
    );
    const evergreen = await Job.create(jobFields(employer.profile, { expiresAt: null }));
    const closed = await Job.create(
      jobFields(employer.profile, {
        status: 'closed',
        expiresAt: new Date(Date.now() - 60_000),
      }),
    );

    await runSweeps();

    expect((await Job.findById(overdue._id).lean()).status).toBe('expired');
    expect((await Job.findById(live._id).lean()).status).toBe('active');
    expect((await Job.findById(evergreen._id).lean()).status).toBe('active');
    expect((await Job.findById(closed._id).lean()).status).toBe('closed');
  });

  test('demotes lapsed EXCEL candidates and re-opens their profile', async () => {
    const lapsed = await createCandidate(null, {
      subscriptionTier: 'excel',
      subscriptionExpiresAt: new Date(Date.now() - 60_000),
      searchBoost: 100,
      profileVisible: false,
      jobAlertsEnabled: true,
    });
    const current = await createCandidate(null, {
      subscriptionTier: 'excel',
      subscriptionExpiresAt: new Date(Date.now() + 86_400_000),
      searchBoost: 100,
      profileVisible: false,
    });

    await runSweeps();

    const lapsedAfter = await CandidateProfile.findById(lapsed.profile._id).lean();
    expect(lapsedAfter.subscriptionTier).toBe('free');
    expect(lapsedAfter.searchBoost).toBe(0);
    expect(lapsedAfter.profileVisible).toBe(true);
    expect(lapsedAfter.subscriptionExpiresAt).toBeNull();

    const currentAfter = await CandidateProfile.findById(current.profile._id).lean();
    expect(currentAfter.subscriptionTier).toBe('excel');
    expect(currentAfter.searchBoost).toBe(100);
    expect(currentAfter.profileVisible).toBe(false);
  });
});
