import {
  canEmployerViewCandidate,
  isExcelActive,
  maskCandidate,
} from '../src/services/candidate-masking.service.js';

const fullCandidate = () => ({
  _id: 'abc',
  firstName: 'Santosh',
  lastName: 'Sharma',
  email: 'santosh@example.com',
  phone: '9999999999',
  address: '12 Test Street',
  pincode: '302001',
  photoUrl: '/uploads/photo.jpg',
  aadhaarVerified: true,
  currentJobTitle: 'Veterinary Surgeon',
  currentLocation: 'Jaipur',
  skills: ['surgery'],
  organizationName: 'City Vet Clinic',
  experiences: [{ jobTitle: 'Vet', organizationName: 'Old Clinic' }],
});

describe('maskCandidate', () => {
  test('strips identity and contact data, keeps professional signal', () => {
    const masked = maskCandidate(fullCandidate());

    expect(masked.locked).toBe(true);
    expect(masked.firstName).toBe('S•••');
    expect(masked.lastName).toBe('');
    expect(masked.email).toBe('');
    expect(masked.phone).toBe('');
    expect(masked.address).toBe('');
    expect(masked.pincode).toBe('');
    expect(masked.photoUrl).toBe('');
    expect(masked.aadhaarVerified).toBe(false);
    expect(masked.organizationName).toBe('');
    expect(masked.experiences[0].organizationName).toBe('');
    // Professional signal survives.
    expect(masked.currentJobTitle).toBe('Veterinary Surgeon');
    expect(masked.currentLocation).toBe('Jaipur');
    expect(masked.skills).toEqual(['surgery']);
    expect(masked.experiences[0].jobTitle).toBe('Vet');
  });

  test('does not mutate the input object', () => {
    const original = fullCandidate();
    maskCandidate(original);

    expect(original.email).toBe('santosh@example.com');
    expect(original.experiences[0].organizationName).toBe('Old Clinic');
  });
});

describe('isExcelActive', () => {
  test('true for excel tier without expiry', () => {
    expect(isExcelActive({ subscriptionTier: 'excel', subscriptionExpiresAt: null })).toBe(true);
  });

  test('true for excel tier with future expiry', () => {
    expect(
      isExcelActive({ subscriptionTier: 'excel', subscriptionExpiresAt: new Date(Date.now() + 86_400_000) }),
    ).toBe(true);
  });

  test('false for lapsed excel', () => {
    expect(
      isExcelActive({ subscriptionTier: 'excel', subscriptionExpiresAt: new Date(Date.now() - 1000) }),
    ).toBe(false);
  });

  test('false for free tier', () => {
    expect(isExcelActive({ subscriptionTier: 'free' })).toBe(false);
    expect(isExcelActive(null)).toBe(false);
  });
});

describe('canEmployerViewCandidate', () => {
  const excelCandidate = { _id: 'c1', subscriptionTier: 'excel', subscriptionExpiresAt: null };
  const freeCandidate = { _id: 'c2', subscriptionTier: 'free' };

  test('unlocked candidates are always visible', () => {
    expect(
      canEmployerViewCandidate({
        effectiveFeatures: { visibleExcelProfilesPerJob: 5 },
        candidate: freeCandidate,
        unlockedSet: new Set(['c2']),
      }),
    ).toBe(true);
  });

  test('EXCEL candidate visible to paid context (all-excel plans)', () => {
    expect(
      canEmployerViewCandidate({
        effectiveFeatures: { visibleExcelProfilesPerJob: null },
        candidate: excelCandidate,
        unlockedSet: new Set(),
      }),
    ).toBe(true);
  });

  test('EXCEL candidate NOT auto-visible to free plan outside applicant slots', () => {
    expect(
      canEmployerViewCandidate({
        effectiveFeatures: { visibleExcelProfilesPerJob: 5 },
        candidate: excelCandidate,
        unlockedSet: new Set(),
      }),
    ).toBe(false);
  });

  test('free candidate hidden without unlock', () => {
    expect(
      canEmployerViewCandidate({
        effectiveFeatures: { visibleExcelProfilesPerJob: null },
        candidate: freeCandidate,
        unlockedSet: new Set(),
      }),
    ).toBe(false);
  });
});
