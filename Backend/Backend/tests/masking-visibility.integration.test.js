import { jest } from '@jest/globals';
import { Job } from '../src/models/job.model.js';
import { JobApplication } from '../src/models/job-application.model.js';
import { ProfileUnlock } from '../src/models/profile-unlock.model.js';
import { maskApplicationsForEmployer } from '../src/services/candidate-masking.service.js';
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

/**
 * Build a job with 7 applicants: EXCEL members at positions 1,2,3,5,6,7 (by
 * application date) and a free candidate at position 4.
 */
async function buildApplicantSet() {
  const employer = await createEmployer();
  const job = await Job.create(jobFields(employer.profile));

  const candidates = [];
  const applications = [];

  for (let index = 0; index < 7; index += 1) {
    const isExcel = index !== 3;
    const candidate = await createCandidate(null, {
      subscriptionTier: isExcel ? 'excel' : 'free',
      subscriptionExpiresAt: isExcel ? new Date(Date.now() + 86_400_000) : null,
    });
    candidates.push(candidate);

    const application = await JobApplication.create({
      job: job._id,
      employerProfile: employer.profile._id,
      candidateProfile: candidate.profile._id,
      candidateEmail: candidate.profile.email,
      coverLetter: `Cover letter ${index}`,
    });
    applications.push(application);
    // Guarantee strictly increasing createdAt so slot ordering is stable.
    await new Promise((resolve) => setTimeout(resolve, 3));
  }

  // Populated lean shape like the service layer produces.
  const populated = await JobApplication.find({ job: job._id })
    .populate('candidateProfile')
    .sort({ createdAt: -1 })
    .lean();

  return { employer, job, candidates, populated };
}

describe('applicant visibility', () => {
  test('free employer sees only the first 5 EXCEL applicants; rest masked', async () => {
    const { employer, populated } = await buildApplicantSet();

    const masked = await maskApplicationsForEmployer({
      effectiveFeatures: { visibleExcelProfilesPerJob: 5 },
      employerProfileId: employer.profile._id,
      applications: populated,
    });

    const byEmail = new Map(
      masked.map((application) => [
        application.candidateEmail,
        application,
      ]),
    );

    // Applications 0,1,2 (earliest EXCEL) + 4,5 = the first five EXCEL by date.
    const lockedCount = masked.filter((application) => application.candidateProfile.locked).length;
    expect(lockedCount).toBe(2); // the free candidate + the 6th EXCEL applicant

    // The free candidate (position 4 in creation order) is always masked.
    const freeApplication = masked.find(
      (application) => application.candidateProfile.subscriptionTier === 'free',
    );
    expect(freeApplication.candidateProfile.locked).toBe(true);
    expect(freeApplication.coverLetter).toBe('');
    expect(freeApplication.candidateProfile.email).toBe('');

    // The LAST EXCEL applicant (6th EXCEL by date) is masked too.
    const excelApplications = masked.filter(
      (application) => application.candidateProfile.subscriptionTier === 'excel',
    );
    const lockedExcel = excelApplications.filter((application) => application.candidateProfile.locked);
    expect(lockedExcel).toHaveLength(1);
    expect(byEmail.size).toBe(7);
  });

  test('paid context (null slots) sees every EXCEL applicant, free ones stay masked', async () => {
    const { employer, populated } = await buildApplicantSet();

    const masked = await maskApplicationsForEmployer({
      effectiveFeatures: { visibleExcelProfilesPerJob: null },
      employerProfileId: employer.profile._id,
      applications: populated,
    });

    const lockedApplications = masked.filter((application) => application.candidateProfile.locked);
    expect(lockedApplications).toHaveLength(1);
    expect(lockedApplications[0].candidateProfile.subscriptionTier).toBe('free');
  });

  test('an unlock makes a free candidate visible everywhere', async () => {
    const { employer, candidates, populated } = await buildApplicantSet();
    const freeCandidate = candidates[3];

    await ProfileUnlock.create({
      employerProfile: employer.profile._id,
      candidateProfile: freeCandidate.profile._id,
      source: 'account_balance',
    });

    const masked = await maskApplicationsForEmployer({
      effectiveFeatures: { visibleExcelProfilesPerJob: null },
      employerProfileId: employer.profile._id,
      applications: populated,
    });

    const freeApplication = masked.find(
      (application) => String(application.candidateProfile._id) === String(freeCandidate.profile._id),
    );
    expect(freeApplication.candidateProfile.locked).toBeUndefined();
    expect(freeApplication.candidateProfile.email).toBe(freeCandidate.profile.email);
    expect(freeApplication.coverLetter).not.toBe('');
  });
});
