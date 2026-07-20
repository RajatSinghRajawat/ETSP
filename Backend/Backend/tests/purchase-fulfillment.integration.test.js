import { jest } from '@jest/globals';
import { CandidateProfile } from '../src/models/candidate-profile.model.js';
import { EmployerProfile } from '../src/models/employer-profile.model.js';
import { Job } from '../src/models/job.model.js';
import { JobCredit } from '../src/models/job-credit.model.js';
import { Purchase } from '../src/models/purchase.model.js';
import { fulfillPurchase } from '../src/services/purchase.service.js';
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

const createPurchase = (user, type, amountInr, extra = {}) =>
  Purchase.create({
    user: user._id,
    userEmail: user.email,
    role: user.role,
    type,
    amountInr,
    ...extra,
  });

describe('fulfillPurchase', () => {
  test('pay_per_job creates a JobCredit snapshotting the PPJ plan', async () => {
    const employer = await createEmployer();
    const purchase = await createPurchase(employer.user, 'pay_per_job', 499);

    await fulfillPurchase(purchase._id);

    const credit = await JobCredit.findOne({ employerProfile: employer.profile._id }).lean();
    expect(credit).not.toBeNull();
    expect(credit.status).toBe('available');
    expect(credit.validityDays).toBe(14);
    expect(credit.unlockCreditsPerJob).toBe(15);

    const paid = await Purchase.findById(purchase._id).lean();
    expect(paid.status).toBe('paid');
    expect(paid.fulfilledAt).not.toBeNull();
  });

  test('double fulfillment applies effects exactly once', async () => {
    const employer = await createEmployer();
    const purchase = await createPurchase(employer.user, 'unlock_credits_20', 199);

    await fulfillPurchase(purchase._id);
    await fulfillPurchase(purchase._id); // webhook + confirm race

    const profile = await EmployerProfile.findById(employer.profile._id).lean();
    expect(profile.unlockCreditBalance).toBe(20);
  });

  test('cv packs increment the account balance by their credit count', async () => {
    const employer = await createEmployer();

    await fulfillPurchase((await createPurchase(employer.user, 'cv_unlock_1', 25))._id);
    await fulfillPurchase((await createPurchase(employer.user, 'cv_unlock_3', 75))._id);

    const profile = await EmployerProfile.findById(employer.profile._id).lean();
    expect(profile.unlockCreditBalance).toBe(4);
  });

  test('urgent_tag flags the target job', async () => {
    const employer = await createEmployer();
    const job = await Job.create(jobFields(employer.profile));
    const purchase = await createPurchase(employer.user, 'urgent_tag', 199, { job: job._id });

    await fulfillPurchase(purchase._id);

    const jobAfter = await Job.findById(job._id).lean();
    expect(jobAfter.isUrgent).toBe(true);
  });

  test('resume_builder grants one resume credit', async () => {
    const candidate = await createCandidate();
    const purchase = await createPurchase(candidate.user, 'resume_builder', 25);

    await fulfillPurchase(purchase._id);
    await fulfillPurchase(purchase._id);

    const profile = await CandidateProfile.findById(candidate.profile._id).lean();
    expect(profile.resumeCreditBalance).toBe(1);
  });

  test('fulfillment failure reverts to pending for retry', async () => {
    const employer = await createEmployer();
    const purchase = await createPurchase(employer.user, 'unlock_credits_20', 199);

    // Sabotage: remove the employer profile so the $inc matches nothing.
    await EmployerProfile.deleteOne({ _id: employer.profile._id });

    await expect(fulfillPurchase(purchase._id)).rejects.toThrow();

    const after = await Purchase.findById(purchase._id).lean();
    expect(after.status).toBe('pending');
    expect(after.fulfilledAt).toBeNull();
  });
});
