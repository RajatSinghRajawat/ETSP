import { CandidateProfile } from '../src/models/candidate-profile.model.js';
import { EmployerProfile } from '../src/models/employer-profile.model.js';
import { createCandidateProfile } from '../src/services/candidate-profile.service.js';
import { createEmployerProfile } from '../src/services/employer-profile.service.js';
import { connectTestDb, clearTestDb, disconnectTestDb } from './helpers/db.js';

beforeAll(async () => {
  await connectTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});

beforeEach(async () => {
  await clearTestDb();
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

const candidateInput = (overrides = {}) => ({
  firstName: 'Asha',
  lastName: 'Nair',
  email: 'dup-candidate@test.local',
  phone: '9800000001',
  ...overrides,
});

const employerInput = (overrides = {}) => ({
  companyName: 'Dup Clinic',
  firstName: 'Mohan',
  lastName: 'Rao',
  phoneNumber: '9800000002',
  email: 'dup-employer@test.local',
  organizationType: 'Clinic',
  teamSize: '1-10',
  headquarters: 'Jaipur',
  overview: 'Duplicate registration test employer.',
  ...overrides,
});

describe('duplicate candidate registration', () => {
  test('a second registration on the same email is rejected with 409', async () => {
    await createCandidateProfile(candidateInput());

    const error = await expectAppError(createCandidateProfile(candidateInput()), 409);
    expect(error.message).toMatch(/already registered/i);
  });

  // The registration endpoint is anonymous, so a silent upsert would let anyone
  // overwrite a stranger's profile just by knowing their email address.
  test('a duplicate registration does not overwrite the existing profile', async () => {
    await createCandidateProfile(candidateInput({ firstName: 'Original' }));

    await expectAppError(
      createCandidateProfile(candidateInput({ firstName: 'Attacker', phone: '9800000009' })),
      409,
    );

    const stored = await CandidateProfile.findOne({ email: 'dup-candidate@test.local' }).lean();
    expect(stored.firstName).toBe('Original');
    expect(stored.phone).toBe('9800000001');
  });

  test('a different email still registers successfully', async () => {
    await createCandidateProfile(candidateInput());

    const second = await createCandidateProfile(
      candidateInput({ email: 'other-candidate@test.local', phone: '9800000003' }),
    );

    expect(second.email).toBe('other-candidate@test.local');
    expect(await CandidateProfile.countDocuments({})).toBe(2);
  });

  test('a duplicate phone on a new email is still rejected with 409', async () => {
    await createCandidateProfile(candidateInput());

    await expectAppError(
      createCandidateProfile(candidateInput({ email: 'another@test.local' })),
      409,
    );
  });
});

describe('duplicate employer registration', () => {
  test('a second registration on the same email is rejected with 409', async () => {
    await createEmployerProfile(employerInput());

    const error = await expectAppError(createEmployerProfile(employerInput()), 409);
    expect(error.message).toMatch(/already registered/i);
  });

  test('a duplicate registration does not overwrite the existing profile', async () => {
    await createEmployerProfile(employerInput({ companyName: 'Original Clinic' }));

    await expectAppError(
      createEmployerProfile(employerInput({ companyName: 'Attacker Clinic', phoneNumber: '9800000008' })),
      409,
    );

    const stored = await EmployerProfile.findOne({ email: 'dup-employer@test.local' }).lean();
    expect(stored.companyName).toBe('Original Clinic');
  });

  test('a different email still registers successfully', async () => {
    await createEmployerProfile(employerInput());

    const second = await createEmployerProfile(
      employerInput({ email: 'other-employer@test.local', phoneNumber: '9800000004' }),
    );

    expect(second.email).toBe('other-employer@test.local');
    expect(await EmployerProfile.countDocuments({})).toBe(2);
  });
});
