import { jest } from '@jest/globals';
import { Job } from '../src/models/job.model.js';
import * as adminService from '../src/services/admin.service.js';
import { getJobById, getJobs } from '../src/services/job.service.js';
import { getEmployerProfiles } from '../src/services/employer-profile.service.js';
import { getMySavedJobs, saveJob } from '../src/services/saved-job.service.js';
import { createJobApplication } from '../src/services/job-application.service.js';
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

const expectAppError = async (promise, statusCode) => {
  let caught = null;

  try {
    await promise;
  } catch (error) {
    caught = error;
  }

  expect(caught).not.toBeNull();
  expect(caught.name).toBe('AppError');
  expect(caught.statusCode).toBe(statusCode);

  return caught;
};

async function postJob(overrides = {}) {
  const { profile } = await createEmployer();
  return Job.create(jobFields(profile, overrides));
}

describe('job approval defaults', () => {
  test('a newly posted job starts unapproved', async () => {
    const job = await postJob();
    expect(job.approvalStatus).toBe('rejected');
  });
});

describe('unapproved jobs stay hidden from candidates', () => {
  test('an unapproved job is absent from the public listing', async () => {
    await postJob({ title: 'Hidden Vet Job' });

    const result = await getJobs({}, null);

    expect(result.items).toHaveLength(0);
  });

  test('an unapproved job cannot be opened directly by id', async () => {
    const job = await postJob();

    await expectAppError(getJobById(job._id.toString()), 404);
  });

  test('an approved job shows up in the public listing', async () => {
    const job = await postJob({ title: 'Visible Vet Job' });

    await adminService.approveJob(job._id.toString());
    const result = await getJobs({}, null);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe('Visible Vet Job');
  });

  test('an approved job can be opened directly by id', async () => {
    const job = await postJob();

    await adminService.approveJob(job._id.toString());

    await expect(getJobById(job._id.toString())).resolves.toMatchObject({
      approvalStatus: 'approved',
    });
  });
});

describe('admin job approve/reject', () => {
  test('approving flips approvalStatus without touching the job status', async () => {
    const job = await postJob();

    const approved = await adminService.approveJob(job._id.toString());

    expect(approved.approvalStatus).toBe('approved');
    expect(approved.status).toBe('active');
  });

  // Rejection hides the job again but keeps it, so the admin can publish later.
  test('rejecting an approved job hides it again and is reversible', async () => {
    const job = await postJob();
    await adminService.approveJob(job._id.toString());

    const rejected = await adminService.rejectJob(job._id.toString());
    expect(rejected.approvalStatus).toBe('rejected');
    expect(await Job.findById(job._id)).not.toBeNull();
    expect((await getJobs({}, null)).items).toHaveLength(0);

    await adminService.approveJob(job._id.toString());
    expect((await getJobs({}, null)).items).toHaveLength(1);
  });

  test('approving an unknown job id throws a 404', async () => {
    await expectAppError(adminService.approveJob('507f1f77bcf86cd799439011'), 404);
  });
});

// Every candidate-facing surface must respect the gate, not just the listing —
// otherwise an unapproved job leaks through whichever path was missed.
describe('other candidate-facing surfaces respect the gate', () => {
  test('a candidate cannot apply to an unapproved job', async () => {
    const { profile: employerProfile } = await createEmployer();
    const job = await Job.create(jobFields(employerProfile));
    const { authUser } = await createCandidate();

    await expectAppError(createJobApplication(authUser, { jobId: job._id.toString() }), 404);
  });

  test('a candidate can apply once the job is approved', async () => {
    const { profile: employerProfile } = await createEmployer();
    const job = await Job.create(jobFields(employerProfile));
    const { authUser } = await createCandidate();

    await adminService.approveJob(job._id.toString());

    await expect(
      createJobApplication(authUser, { jobId: job._id.toString() }),
    ).resolves.toBeDefined();
  });

  test('an unapproved job cannot be saved', async () => {
    const { profile: employerProfile } = await createEmployer();
    const job = await Job.create(jobFields(employerProfile));
    const { authUser } = await createCandidate();

    await expectAppError(saveJob(authUser, job._id.toString()), 404);
  });

  test('unpublishing a job drops it from the saved list', async () => {
    const { profile: employerProfile } = await createEmployer();
    const job = await Job.create(jobFields(employerProfile));
    const { authUser } = await createCandidate();

    await adminService.approveJob(job._id.toString());
    await saveJob(authUser, job._id.toString());
    expect(await getMySavedJobs(authUser)).toHaveLength(1);

    await adminService.rejectJob(job._id.toString());
    expect(await getMySavedJobs(authUser)).toHaveLength(0);
  });

  test('the employer open-jobs badge only counts approved jobs', async () => {
    const { profile: employerProfile } = await createEmployer();
    await Job.create(jobFields(employerProfile, { title: 'Unapproved' }));
    const approved = await Job.create(jobFields(employerProfile, { title: 'Approved' }));
    await adminService.approveJob(approved._id.toString());

    const result = await getEmployerProfiles({});
    const row = result.items.find((p) => String(p._id) === String(employerProfile._id));

    expect(row.openJobs).toBe(1);
  });
});
