import { employerProfileSchema } from '../src/validations/employer-profile.validation.js';

const validProfile = {
  companyName: 'ETS Animal Hospital',
  firstName: 'Santosh',
  lastName: 'Sharma',
  phoneNumber: '9876543210',
  email: 'EMPLOYER@example.com',
  website: 'https://example.com',
  organizationType: 'Hospital',
  foundedYear: '2015',
  teamSize: '50-100',
  headquarters: 'Jaipur, Rajasthan',
  activeJobs: '4',
  workplaceModel: 'On-site',
  hiringUrgency: 'Standard',
  logoUrl: '',
  overview: 'Multi-specialty veterinary employer hiring clinical teams.',
  specialties: ['Emergency Care', 'Diagnostics'],
  benefits: ['Health cover'],
  hiringRegions: ['Jaipur'],
  phoneVerified: true,
  emailVerified: true,
  status: 'submitted',
};

describe('employerProfileSchema', () => {
  test('normalizes valid employer profile data', () => {
    const result = employerProfileSchema.parse(validProfile);

    expect(result.email).toBe('employer@example.com');
    expect(result.specialties).toHaveLength(2);
  });

  test('rejects missing required employer profile fields', () => {
    expect(() =>
      employerProfileSchema.parse({
        ...validProfile,
        companyName: '',
      }),
    ).toThrow();
  });
});
