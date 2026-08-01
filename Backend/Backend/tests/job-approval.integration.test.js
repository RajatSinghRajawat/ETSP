import { jest } from '@jest/globals';
import { Job } from '../src/models/job.model.js';
import * as adminService from '../src/services/admin.service.js';
import { getJobById, getJobs } from '../src/services/job.service.js';
import { connectTestDb, clearTestDb, disconnectTestDb } from './helpers/db.js';
import { createEmployer, jobFields, seedPlans } from './helpers/fixtures.js';

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
