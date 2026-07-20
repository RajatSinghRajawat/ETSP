import { candidateProfileSchema } from '../src/validations/candidate-profile.validation.js';

const validProfile = {
  firstName: 'Santosh',
  lastName: 'Sharma',
  email: 'SANTOSH@example.com',
  phone: '9876543210',
  address: 'Main road',
  city: 'Jaipur',
  pincode: '302001',
  currentLocation: 'Jaipur',
  gender: 'Male',
  aadhaarVerified: true,
  preferredLocations: ['Jaipur', 'Delhi'],
  profileSummary: 'Veterinary professional',
  photoUrl: '',
  degree: 'BVSc',
  educationLevel: 'Graduate',
  specialization: 'Small Animal Care',
  courseType: 'Full-time',
  courseStartDate: '2020-01-01',
  courseEndDate: '2024-01-01',
  grade: 'A',
  educationCountry: 'India',
  educationCity: 'Jaipur',
  additionalDetails: '',
  certifications: ['Pet first aid'],
  professionalLicenses: 'VCI registered',
  currentJobTitle: 'Veterinary Doctor',
  employmentType: 'Full-time',
  organizationName: 'ETS Clinic',
  currentSalary: '600000',
  salaryFormat: 'per annum',
  skills: ['Surgery', 'Diagnostics'],
  experiences: [
    {
      jobTitle: 'Veterinary Doctor',
      employmentType: 'Full-time',
      organizationName: 'ETS Clinic',
      joiningDate: '2024-01-01',
      endDate: '',
      roleDescription: 'Handled outpatient care',
    },
  ],
  status: 'submitted',
};

describe('candidateProfileSchema', () => {
  test('normalizes valid profile data', () => {
    const result = candidateProfileSchema.parse(validProfile);

    expect(result.email).toBe('santosh@example.com');
    expect(result.skills).toHaveLength(2);
  });

  test('rejects missing required profile fields', () => {
    expect(() =>
      candidateProfileSchema.parse({
        ...validProfile,
        firstName: '',
      }),
    ).toThrow();
  });
});
