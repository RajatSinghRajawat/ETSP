import { jest } from '@jest/globals';
import { CandidateProfile } from '../src/models/candidate-profile.model.js';
import { EmployerProfile } from '../src/models/employer-profile.model.js';
import { User } from '../src/models/user.model.js';
import { authService } from '../src/services/auth.service.js';
import { emailService } from '../src/services/email.service.js';
import {
  getCandidateProfileByEmail,
  getCandidateProfiles,
  getFeaturedCandidateProfiles,
} from '../src/services/candidate-profile.service.js';
import {
  getEmployerProfileByEmail,
  getEmployerProfiles,
} from '../src/services/employer-profile.service.js';
import { createJob } from '../src/services/job.service.js';
import { createJobApplication } from '../src/services/job-application.service.js';
import * as adminService from '../src/services/admin.service.js';
import { connectTestDb, clearTestDb, disconnectTestDb } from './helpers/db.js';

beforeAll(async () => {
  await connectTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

beforeEach(async () => {
  await clearTestDb();
  // env.js ships a hardcoded real Gmail SMTP fallback (see security note in
  // the PR description) — force every path off so these tests never place a
  // live SMTP call regardless of what's configured in the environment.
  // isEnabled() gates the OTP-send path; sendEmail() is the one path
  // sendApprovalEmail() always goes through regardless of that gate, so both
  // need mocking or an approve action alone will fire a real email.
  jest.spyOn(emailService, 'isEnabled').mockResolvedValue(false);
  jest.spyOn(emailService, 'sendEmail').mockResolvedValue(true);
});

afterEach(() => {
  jest.restoreAllMocks();
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
  if (statusCode) {
    expect(caught.statusCode).toBe(statusCode);
  }

  return caught;
};

// Mirrors how registration actually happens in production: only a profile
// document is created, no User yet — the User is created lazily on first
// successful login (see auth.service.js getRegisteredAccount/verifyOtp).
async function registerCandidate(email, overrides = {}) {
  return CandidateProfile.create({
    firstName: 'Priya',
    lastName: 'Sharma',
    email,
    phone: `9${String(Math.floor(Math.random() * 1e9)).padStart(9, '0')}`,
    currentLocation: 'Jaipur',
    ...overrides,
  });
}

async function registerEmployer(email, overrides = {}) {
  return EmployerProfile.create({
    companyName: 'Fixture Clinic',
    firstName: 'Ravi',
    lastName: 'Kumar',
    phoneNumber: `8${String(Math.floor(Math.random() * 1e9)).padStart(9, '0')}`,
    email,
    organizationType: 'Clinic',
    teamSize: '1-10',
    headquarters: 'Jaipur',
    overview: 'Test employer',
    ...overrides,
  });
}

describe('registration defaults', () => {
  test('a new candidate profile starts pending by default', async () => {
    const profile = await registerCandidate('new-candidate@test.local');
    expect(profile.approvalStatus).toBe('pending');
  });

  test('a new employer profile starts pending by default', async () => {
    const profile = await registerEmployer('new-employer@test.local');
    expect(profile.approvalStatus).toBe('pending');
  });
});

describe('pending users can login before admin approval', () => {
  test('a pending candidate can request an OTP to login', async () => {
    const email = 'unapproved-candidate@test.local';
    await registerCandidate(email);

    await expect(authService.sendOtp(email)).resolves.toMatchObject({ message: expect.any(String) });
  });

  test('OTP verification reaches OTP validation for a pending candidate', async () => {
    const email = 'unapproved-candidate-2@test.local';
    await registerCandidate(email);

    await expectAppError(authService.verifyOtp(email, '000000'), 400);
  });

  test('a pending employer can request an OTP to login', async () => {
    const email = 'unapproved-employer@test.local';
    await registerEmployer(email);

    await expect(authService.sendOtp(email)).resolves.toMatchObject({ message: expect.any(String) });
  });

  test('an approved candidate can proceed through the OTP send step', async () => {
    const email = 'approved-candidate@test.local';
    await registerCandidate(email, { approvalStatus: 'approved' });

    await expect(authService.sendOtp(email)).resolves.toMatchObject({
      message: expect.any(String),
    });
  });

  test('an approved employer can proceed through the OTP send step', async () => {
    const email = 'approved-employer@test.local';
    await registerEmployer(email, { approvalStatus: 'approved' });

    await expect(authService.sendOtp(email)).resolves.toMatchObject({
      message: expect.any(String),
    });
  });
});

describe('pending profile access and restrictions', () => {
  test('a pending candidate can view their own profile but stays out of public directories', async () => {
    const pending = await registerCandidate('pending-self-candidate@test.local');
    await registerCandidate('approved-public-candidate@test.local', { approvalStatus: 'approved' });

    await expect(getCandidateProfileByEmail(pending.email)).resolves.toMatchObject({
      email: pending.email,
      approvalStatus: 'pending',
    });
    await expect(getCandidateProfiles({}, { role: 'admin' })).resolves.toMatchObject({
      pagination: { total: 1 },
    });
    await expect(getFeaturedCandidateProfiles()).resolves.toMatchObject({ total: 1 });
  });

  test('a pending employer can view their own profile but stays out of public directories', async () => {
    const pending = await registerEmployer('pending-self-employer@test.local');
    await registerEmployer('approved-public-employer@test.local', { approvalStatus: 'approved' });

    await expect(getEmployerProfileByEmail(pending.email)).resolves.toMatchObject({
      email: pending.email,
      approvalStatus: 'pending',
    });
    await expect(getEmployerProfiles()).resolves.toMatchObject({
      pagination: { total: 1 },
    });
  });

  test('a pending candidate cannot apply for a job', async () => {
    const candidate = await registerCandidate('pending-apply@test.local');
    const error = await expectAppError(
      createJobApplication(
        { role: 'candidate', email: candidate.email },
        { jobId: candidate._id.toString(), coverLetter: '' },
      ),
      403,
    );

    expect(error.code).toBe('PROFILE_APPROVAL_PENDING');
  });

  test('a pending employer cannot post a job', async () => {
    const employer = await registerEmployer('pending-post@test.local');
    const error = await expectAppError(
      createJob({ role: 'employer', email: employer.email }, {}),
      403,
    );

    expect(error.code).toBe('PROFILE_APPROVAL_PENDING');
  });
});

describe('admin approve action', () => {
  test('approving a candidate flips approvalStatus and unblocks login', async () => {
    const email = 'to-approve-candidate@test.local';
    const profile = await registerCandidate(email);

    const updated = await adminService.approveCandidate(profile._id.toString());
    expect(updated.approvalStatus).toBe('approved');

    await expect(authService.sendOtp(email)).resolves.toMatchObject({
      message: expect.any(String),
    });
  });

  test('approving an employer flips approvalStatus and unblocks login', async () => {
    const email = 'to-approve-employer@test.local';
    const profile = await registerEmployer(email);

    const updated = await adminService.approveEmployer(profile._id.toString());
    expect(updated.approvalStatus).toBe('approved');

    await expect(authService.sendOtp(email)).resolves.toMatchObject({
      message: expect.any(String),
    });
  });
});

describe('admin approve sends a notification email', () => {
  test('approving a candidate emails them that they can now login', async () => {
    const spy = jest.spyOn(emailService, 'sendApprovalEmail').mockResolvedValue(true);
    const email = 'email-notify-candidate@test.local';
    const profile = await registerCandidate(email, { firstName: 'Priya' });

    await adminService.approveCandidate(profile._id.toString());

    expect(spy).toHaveBeenCalledWith(email, expect.objectContaining({ role: 'candidate' }));
  });

  test('approving an employer emails them that they can now login', async () => {
    const spy = jest.spyOn(emailService, 'sendApprovalEmail').mockResolvedValue(true);
    const email = 'email-notify-employer@test.local';
    const profile = await registerEmployer(email);

    await adminService.approveEmployer(profile._id.toString());

    expect(spy).toHaveBeenCalledWith(email, expect.objectContaining({ role: 'employer' }));
  });
});

describe('admin reject sends a notification email', () => {
  test('rejecting a candidate emails them that they were not approved', async () => {
    const spy = jest.spyOn(emailService, 'sendRejectionEmail').mockResolvedValue(true);
    const email = 'reject-notify-candidate@test.local';
    const profile = await registerCandidate(email, { firstName: 'Priya' });

    await adminService.rejectCandidate(profile._id.toString());

    expect(spy).toHaveBeenCalledWith(email, expect.objectContaining({ role: 'candidate' }));
  });

  test('rejecting an employer emails them that they were not approved', async () => {
    const spy = jest.spyOn(emailService, 'sendRejectionEmail').mockResolvedValue(true);
    const email = 'reject-notify-employer@test.local';
    const profile = await registerEmployer(email);

    await adminService.rejectEmployer(profile._id.toString());

    expect(spy).toHaveBeenCalledWith(email, expect.objectContaining({ role: 'employer' }));
  });
});

describe('admin reject action', () => {
  test('rejecting a candidate keeps self-service login and the profile on file', async () => {
    const email = 'to-reject-candidate@test.local';
    const profile = await registerCandidate(email);
    // Registration creates the bare User record up front (see
    // candidate-profile.service.js) — mirror that here so the test matches
    // production behavior instead of only the isolated-fixture shape.
    await User.create({ email, role: 'candidate', isActive: true });
    await adminService.approveCandidate(profile._id.toString());

    const rejected = await adminService.rejectCandidate(profile._id.toString());

    expect(rejected.approvalStatus).toBe('rejected');
    expect(await CandidateProfile.findById(profile._id)).not.toBeNull();
    await expect(authService.sendOtp(email)).resolves.toMatchObject({ message: expect.any(String) });
  });

  test('rejecting an employer keeps self-service login and the profile on file', async () => {
    const email = 'to-reject-employer@test.local';
    const profile = await registerEmployer(email);
    await User.create({ email, role: 'employer', isActive: true });
    await adminService.approveEmployer(profile._id.toString());

    const rejected = await adminService.rejectEmployer(profile._id.toString());

    expect(rejected.approvalStatus).toBe('rejected');
    expect(await EmployerProfile.findById(profile._id)).not.toBeNull();
    await expect(authService.sendOtp(email)).resolves.toMatchObject({ message: expect.any(String) });
  });

  // The whole point of rejection-as-a-status: an admin can change their mind.
  test('an admin can approve a candidate again after rejecting them', async () => {
    const email = 'reject-then-approve@test.local';
    const profile = await registerCandidate(email);

    await adminService.approveCandidate(profile._id.toString());
    await adminService.rejectCandidate(profile._id.toString());
    await expect(authService.sendOtp(email)).resolves.toMatchObject({ message: expect.any(String) });

    const reApproved = await adminService.approveCandidate(profile._id.toString());
    expect(reApproved.approvalStatus).toBe('approved');
    await expect(authService.sendOtp(email)).resolves.toMatchObject({
      message: expect.any(String),
    });
  });

  test('an admin can approve an employer again after rejecting them', async () => {
    const email = 'reject-then-approve-employer@test.local';
    const profile = await registerEmployer(email);

    await adminService.approveEmployer(profile._id.toString());
    await adminService.rejectEmployer(profile._id.toString());
    await expect(authService.sendOtp(email)).resolves.toMatchObject({ message: expect.any(String) });

    const reApproved = await adminService.approveEmployer(profile._id.toString());
    expect(reApproved.approvalStatus).toBe('approved');
  });

  test('rejecting an unknown candidate id throws a 404', async () => {
    await expectAppError(
      adminService.rejectCandidate('507f1f77bcf86cd799439011'),
      404,
    );
  });
});

describe('admin delete action', () => {
  // Delete is the destructive counterpart to reject: the record itself goes.
  test('deleting a candidate removes the profile entirely', async () => {
    const profile = await registerCandidate('to-delete-candidate@test.local');

    await adminService.deleteCandidate(profile._id.toString());

    expect(await CandidateProfile.findById(profile._id)).toBeNull();
  });

  test('deleting an employer removes the profile entirely', async () => {
    const profile = await registerEmployer('to-delete-employer@test.local');

    await adminService.deleteEmployer(profile._id.toString());

    expect(await EmployerProfile.findById(profile._id)).toBeNull();
  });
});

// Profile creation writes User.role with $setOnInsert, so an email that once
// had a candidate profile keeps role 'candidate' after being re-registered as
// an employer — and the login would drop them on the candidate dashboard.
describe('login role follows the profiles that exist', () => {
  test('an employer-only profile logs in as employer even if the account says candidate', async () => {
    const email = 'stale-role@test.local';
    await registerEmployer(email, { approvalStatus: 'approved' });
    await User.create({ email, role: 'candidate', isActive: true });

    const account = await authService.getRegisteredAccount(email);
    expect(account.role).toBe('employer');
  });

  test('a candidate-only profile logs in as candidate even if the account says employer', async () => {
    const email = 'stale-role-2@test.local';
    await registerCandidate(email, { approvalStatus: 'approved' });
    await User.create({ email, role: 'employer', isActive: true });

    const account = await authService.getRegisteredAccount(email);
    expect(account.role).toBe('candidate');
  });

  test('verifying the OTP heals the stale role on the account record', async () => {
    const email = 'employer@test.com';
    await registerEmployer(email, { approvalStatus: 'approved' });
    await User.updateOne({ email }, { $set: { role: 'candidate' } }, { upsert: true });

    // employer@test.com is a static test account, so the OTP is fixed.
    const result = await authService.verifyOtp(email, '123456');

    expect(result.user.role).toBe('employer');
    expect((await User.findOne({ email })).role).toBe('employer');
  });

  test('a dual-role account keeps the role stored on the account', async () => {
    const email = 'dual-role-login@test.local';
    await registerCandidate(email, { approvalStatus: 'approved' });
    await registerEmployer(email, { approvalStatus: 'approved' });
    await User.create({ email, role: 'employer', isActive: true });

    const account = await authService.getRegisteredAccount(email);
    expect(account.role).toBe('employer');
  });

  test('an admin account is never re-derived from profiles', async () => {
    const email = 'admin-with-profile@test.local';
    await registerCandidate(email, { approvalStatus: 'approved' });
    await User.create({ email, role: 'admin', isActive: true });

    const account = await authService.getRegisteredAccount(email);
    expect(account.role).toBe('admin');
  });
});

describe('unregistered emails', () => {
  test('an email that never registered cannot log in', async () => {
    await expectAppError(authService.sendOtp('never-registered@test.local'), 404);
    expect(await User.findOne({ email: 'never-registered@test.local' })).toBeNull();
  });
});
