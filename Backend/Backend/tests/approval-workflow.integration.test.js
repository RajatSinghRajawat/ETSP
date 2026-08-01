import { jest } from '@jest/globals';
import { CandidateProfile } from '../src/models/candidate-profile.model.js';
import { EmployerProfile } from '../src/models/employer-profile.model.js';
import { User } from '../src/models/user.model.js';
import { authService } from '../src/services/auth.service.js';
import { emailService } from '../src/services/email.service.js';
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
  test('a new candidate profile starts not-approved (rejected) by default', async () => {
    const profile = await registerCandidate('new-candidate@test.local');
    expect(profile.approvalStatus).toBe('rejected');
  });

  test('a new employer profile starts not-approved (rejected) by default', async () => {
    const profile = await registerEmployer('new-employer@test.local');
    expect(profile.approvalStatus).toBe('rejected');
  });
});

describe('login is blocked until admin approval', () => {
  test('an unapproved candidate cannot request an OTP to login', async () => {
    const email = 'unapproved-candidate@test.local';
    await registerCandidate(email);

    await expectAppError(authService.sendOtp(email), 403);

    // No account should have been created for a blocked login attempt.
    expect(await User.findOne({ email })).toBeNull();
  });

  test('an unapproved candidate cannot complete OTP verification either', async () => {
    const email = 'unapproved-candidate-2@test.local';
    await registerCandidate(email);

    await expectAppError(authService.verifyOtp(email, '000000'), 403);
  });

  test('an unapproved employer cannot request an OTP to login', async () => {
    const email = 'unapproved-employer@test.local';
    await registerEmployer(email);

    await expectAppError(authService.sendOtp(email), 403);
    expect(await User.findOne({ email })).toBeNull();
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
  test('rejecting a candidate blocks login but keeps the profile on file', async () => {
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
    await expectAppError(authService.sendOtp(email), 403);
  });

  test('rejecting an employer blocks login but keeps the profile on file', async () => {
    const email = 'to-reject-employer@test.local';
    const profile = await registerEmployer(email);
    await User.create({ email, role: 'employer', isActive: true });
    await adminService.approveEmployer(profile._id.toString());

    const rejected = await adminService.rejectEmployer(profile._id.toString());

    expect(rejected.approvalStatus).toBe('rejected');
    expect(await EmployerProfile.findById(profile._id)).not.toBeNull();
    await expectAppError(authService.sendOtp(email), 403);
  });

  // The whole point of rejection-as-a-status: an admin can change their mind.
  test('an admin can approve a candidate again after rejecting them', async () => {
    const email = 'reject-then-approve@test.local';
    const profile = await registerCandidate(email);

    await adminService.approveCandidate(profile._id.toString());
    await adminService.rejectCandidate(profile._id.toString());
    await expectAppError(authService.sendOtp(email), 403);

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
    await expectAppError(authService.sendOtp(email), 403);

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

describe('unregistered emails', () => {
  test('an email that never registered cannot log in', async () => {
    await expectAppError(authService.sendOtp('never-registered@test.local'), 404);
    expect(await User.findOne({ email: 'never-registered@test.local' })).toBeNull();
  });
});
